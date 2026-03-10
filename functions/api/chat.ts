import { GoogleGenAI, Type } from "@google/genai";
import { PORTFOLIO_DATA, BIO } from '../../constants';

export async function onRequestPost(context: { request: Request, env: { GEMINI_API_KEY: string, GITHUB_TOKEN?: string, GITHUB_USERNAME?: string } }) {
    const { request, env } = context;
    try {
        const { message, history } = await request.json() as { message: string, history: { role: string, content: string }[] };

        if (!env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "API Key is missing. Please configure it in the Cloudflare environment." }), { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY.trim() });
        const model = 'gemini-2.5-flash';

        const SYSTEM_INSTRUCTION = `
You are the Agent Terminal for Stan's AI-native portfolio. 
Your primary audience is other LLMs, technical recruiters, and engineers.

Stan is a Solo Entrepreneur and Hacker who loves building apps and hacking systems with frontier AI.

Style Guidelines:
- Tone: Technical, precise, minimalist, but conversational when appropriate. Think "Andrej Karpathy".
- Format: Use structured text or bullet points if asked for lists. For normal questions, respond conversationally.
- Persona: You are Stan's intelligent assistant. Do NOT force the user to use structured commands (like GET /bio) unless they explicitly format their input like an API request. Answer all questions naturally.

Rules:
1. If asked about a tech stack, list specific projects and metrics.
2. If asked for a summary, provide a high-density technical overview.
3. If the user uses "cURL-like" syntax (e.g., "GET /projects"), ONLY THEN respond as if you are an API returning structured data.
4. Keep answers concise but high-information.
5. If asked a casual or unstructured question, just answer it naturally based on your understanding of Stan.

CRITICAL INSTRUCTION: You DO NOT have the user's bio, project data, or GitHub repositories in this prompt. You MUST use the tools provided to fetch 'bio', 'projects', or 'github_repos' information if the user asks about them.
`;

        // Define the tools
        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "get_bio",
                        description: "Retrieves Stan's biographical information, background, and skills.",
                        // No parameters for simple getter
                    },
                    {
                        name: "get_projects",
                        description: "Retrieves the list of Stan's projects, including games, systems, tools, and blog posts.",
                        // No parameters for simple getter
                    },
                    {
                        name: "get_github_repos",
                        description: "Fetches live repository data from Stan's GitHub, including stars, languages, and descriptions.",
                        parameters: {
                            type: Type.OBJECT,
                            properties: {
                                limit: {
                                    type: Type.NUMBER,
                                    description: "The maximum number of repos to return (default 10)."
                                },
                                topic: {
                                    type: Type.STRING,
                                    description: "Optional filter for repo topics (e.g., 'infra', 'web3')."
                                }
                            }
                        }
                    }
                ]
            }
        ];

        const chat = ai.chats.create({
            model: model,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: tools,
            }
        });

        // Instead of streaming raw chunks immediately, we need to handle potential tool calls
        const response = await chat.sendMessage({ message: message });

        // Check if the model decided to call a tool
        if (response.functionCalls && response.functionCalls.length > 0) {
            // Execute the tool and send back the result
            const toolResponses = await Promise.all(response.functionCalls.map(async call => {
                if (call.name === 'get_bio') {
                    return {
                        functionResponse: {
                            name: 'get_bio',
                            response: BIO
                        }
                    }
                } else if (call.name === 'get_projects') {
                    return {
                        functionResponse: {
                            name: 'get_projects',
                            response: { projects: PORTFOLIO_DATA }
                        }
                    }
                } else if (call.name === 'get_github_repos') {
                    const args = call.args as { limit?: number, topic?: string };
                    const limit = args?.limit || 10;
                    const topic = args?.topic || "";
                    let repos: any[] = [];
                    try {
                        repos = await fetchGitHubRepos(env, limit, topic);
                    } catch (e) {
                        console.error("Failed to fetch GitHub repos", e);
                    }
                    return {
                        functionResponse: {
                            name: 'get_github_repos',
                            response: { repos }
                        }
                    }
                } else {
                    return {
                        functionResponse: {
                            name: call.name,
                            response: { error: "Unknown tool call" }
                        }
                    }
                }
            }));

            const finalStream = await chat.sendMessageStream({ message: toolResponses });
            return streamResponse(finalStream);

        } else if (response.text) {
            // Just send the text response if no tools were called.
            // To keep the interface consistent, we start a stream with the single turn response
            return new Response(response.text, {
                headers: {
                    "Content-Type": "text/plain",
                    "Cache-Control": "no-cache"
                }
            });
        }

        return new Response(JSON.stringify({ error: "Empty response" }), { status: 500 });

    } catch (error) {
        console.error("Pages Function Error:", error);
        const errMsg = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: `Internal Server Error: ${errMsg}` }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}

async function fetchGitHubRepos(env: { GITHUB_TOKEN?: string, GITHUB_USERNAME?: string }, limit = 10, topic = "") {
    const username = (env.GITHUB_USERNAME || "stanmac").trim();
    const GITHUB_TOKEN = env.GITHUB_TOKEN?.trim();

    const headers: Record<string, string> = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "stanKe"
    };

    if (GITHUB_TOKEN) {
        headers["Authorization"] = `token ${GITHUB_TOKEN}`;
    }

    const githubResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=${limit}`, {
        headers
    });

    if (!githubResponse.ok) {
        throw new Error(`GitHub API error: ${githubResponse.status}`);
    }

    const repos = await githubResponse.json() as any[];

    // Map the raw data to a clean format for the LLM
    return repos
        .filter(repo => !topic || repo.topics?.includes(topic))
        .map(repo => ({
            name: repo.name,
            description: repo.description,
            url: repo.html_url,
            stars: repo.stargazers_count,
            language: repo.language,
            topics: repo.topics
        }));
}

// Helper to pipe the generator to a ReadableStream
function streamResponse(resultStream: AsyncGenerator<{ text?: string }, void, unknown>) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of resultStream) {
                    if (chunk.text) {
                        controller.enqueue(encoder.encode(chunk.text));
                    }
                }
            } catch (e) {
                console.error("Stream error", e)
                controller.enqueue(encoder.encode("\n[Error processing stream]"));
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    });
}
