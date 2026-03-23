import { GoogleGenAI, Type } from "@google/genai";
import { PORTFOLIO_DATA, BIO } from '../../constants';

// ── IMPORTANT: must match the AI Search instance name in the CF Dashboard ──
const AI_SEARCH_INSTANCE = "stanke-rag";

export async function onRequestPost(context: { request: Request, env: { GEMINI_API_KEY: string, GITHUB_TOKEN?: string, GITHUB_USERNAME?: string, AI?: any } }) {
    const { request, env } = context;
    try {
        const { message, history } = await request.json() as { message: string, history: { role: string, content: string }[] };

        // ── RAG: fetch relevant context from CF AI Search (if configured) ──────────
        const ragContext = await getDocContext(env, message);

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

CRITICAL INSTRUCTION: You DO NOT have the user's bio, project data, or GitHub repositories in this prompt. You MUST use the tools provided to fetch this information when asked.
- For biography or background: call 'get_bio'
- For portfolio projects: call 'get_projects'
- For GitHub repos list: call 'get_github_repos'
- For recent commits or commit history on a repo: call 'get_github_commits'
- For recent GitHub activity (pushes, PRs, issues): call 'get_github_user_activity'
- For detailed info on a specific repo (issues, PRs, languages, topics): call 'get_github_repo_details'
- For GitHub profile stats (followers, stars, public repos): call 'get_github_profile'
NEVER say you cannot access GitHub data. Always call the appropriate tool first.
${ragContext ? `\n[RELEVANT CONTEXT FROM USER DOCUMENTS]\n${ragContext}\n[END CONTEXT]` : ''}
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
                    },
                    {
                        name: "get_github_commits",
                        description: "Fetches recent commits for a specific GitHub repository of Stan's. Use this when asked about recent commits, what Stan has been working on, or commit history.",
                        parameters: {
                            type: Type.OBJECT,
                            properties: {
                                repo: {
                                    type: Type.STRING,
                                    description: "The repository name (e.g., 'stanKe'). If not specified, use the most recently updated repo."
                                },
                                limit: {
                                    type: Type.NUMBER,
                                    description: "Number of commits to fetch (default 10)."
                                }
                            },
                            required: []
                        }
                    },
                    {
                        name: "get_github_user_activity",
                        description: "Fetches Stan's recent public GitHub activity events: pushes, PRs, issues, forks, stars. Use this for questions like 'what has Stan been doing lately on GitHub?' or 'recent activity'.",
                        parameters: {
                            type: Type.OBJECT,
                            properties: {
                                limit: {
                                    type: Type.NUMBER,
                                    description: "Number of events to return (default 15)."
                                }
                            }
                        }
                    },
                    {
                        name: "get_github_repo_details",
                        description: "Fetches detailed info about a specific GitHub repo: language breakdown, open issues, open PRs, topics, README summary, latest release. Use for deep-dives into a specific project.",
                        parameters: {
                            type: Type.OBJECT,
                            properties: {
                                repo: {
                                    type: Type.STRING,
                                    description: "The exact repository name (e.g., 'stanKe')."
                                }
                            },
                            required: ["repo"]
                        }
                    },
                    {
                        name: "get_github_profile",
                        description: "Fetches Stan's GitHub profile stats: follower count, total public repos, total stars across all repos, most used languages, account created date.",
                    }
                ]
            }
        ];

        const chat = ai.chats.create({
            model: model,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: tools,
                maxOutputTokens: 8192,
            }
        });

        // ── Turn 1: stream the first response ─────────────────────────────────
        // Using sendMessageStream so text responses reach the client immediately.
        // If the model decides to call tools instead, we collect the calls,
        // execute them, then do a second streaming turn (Turn 2 below).
        const firstStream = await chat.sendMessageStream({ message });

        const collectedFunctionCalls: any[] = [];
        const textChunks: string[] = [];

        for await (const chunk of firstStream) {
            // Accumulate any function calls
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                collectedFunctionCalls.push(...chunk.functionCalls);
            }
            // Accumulate text (may arrive alongside or instead of tool calls)
            if (chunk.text) {
                textChunks.push(chunk.text);
            }
        }

        // ── Tool-call path ─────────────────────────────────────────────────────
        if (collectedFunctionCalls.length > 0) {
            const toolResponses = await Promise.all(collectedFunctionCalls.map(async call => {
                if (call.name === 'get_bio') {
                    return { functionResponse: { name: 'get_bio', response: BIO } };
                } else if (call.name === 'get_projects') {
                    return { functionResponse: { name: 'get_projects', response: { projects: PORTFOLIO_DATA } } };
                } else if (call.name === 'get_github_repos') {
                    const args = call.args as { limit?: number, topic?: string };
                    let repos: any[] = [];
                    try { repos = await fetchGitHubRepos(env, args?.limit || 10, args?.topic || ''); } catch (e) { console.error(e); }
                    return { functionResponse: { name: 'get_github_repos', response: { repos } } };
                } else if (call.name === 'get_github_commits') {
                    const args = call.args as { repo?: string, limit?: number };
                    let result: any = {};
                    try { result = await fetchGitHubCommits(env, args?.repo, args?.limit || 10); } catch (e) { result = { error: String(e) }; }
                    return { functionResponse: { name: 'get_github_commits', response: result } };
                } else if (call.name === 'get_github_user_activity') {
                    const args = call.args as { limit?: number };
                    let result: any = {};
                    try { result = await fetchGitHubActivity(env, args?.limit || 15); } catch (e) { result = { error: String(e) }; }
                    return { functionResponse: { name: 'get_github_user_activity', response: result } };
                } else if (call.name === 'get_github_repo_details') {
                    const args = call.args as { repo: string };
                    let result: any = {};
                    try { result = await fetchGitHubRepoDetails(env, args.repo); } catch (e) { result = { error: String(e) }; }
                    return { functionResponse: { name: 'get_github_repo_details', response: result } };
                } else if (call.name === 'get_github_profile') {
                    let result: any = {};
                    try { result = await fetchGitHubProfile(env); } catch (e) { result = { error: String(e) }; }
                    return { functionResponse: { name: 'get_github_profile', response: result } };
                } else {
                    return { functionResponse: { name: call.name, response: { error: 'Unknown tool call' } } };
                }
            }));

            // ── Turn 2: stream the model's final answer after tool execution ──────
            const finalStream = await chat.sendMessageStream({ message: toolResponses });
            return streamResponse(finalStream);
        }

        // ── Pure-text path: replay buffered chunks as a ReadableStream ──────────
        if (textChunks.length > 0) {
            const encoder = new TextEncoder();
            const readable = new ReadableStream({
                start(controller) {
                    for (const chunk of textChunks) {
                        controller.enqueue(encoder.encode(chunk));
                    }
                    controller.close();
                }
            });
            return new Response(readable, {
                headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache' }
            });
        }

        return new Response(JSON.stringify({ error: 'Empty response' }), { status: 500 });

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

async function fetchGitHubCommits(env: { GITHUB_TOKEN?: string, GITHUB_USERNAME?: string }, repoName?: string, limit = 10) {
    const username = (env.GITHUB_USERNAME || "stanmac").trim();
    const headers = buildGitHubHeaders(env);

    // If no repo specified, pick the most recently updated one
    let repo = repoName?.trim();
    if (!repo) {
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=1`, { headers });
        const reposData = await reposRes.json() as any[];
        repo = reposData[0]?.name;
    }
    if (!repo) return { error: "No repository found" };

    const res = await fetch(`https://api.github.com/repos/${username}/${repo}/commits?per_page=${limit}`, { headers });
    if (!res.ok) throw new Error(`GitHub Commits API error: ${res.status}`);
    const commits = await res.json() as any[];
    return {
        repo,
        commits: commits.map(c => ({
            sha: c.sha?.substring(0, 7),
            message: c.commit?.message,
            author: c.commit?.author?.name,
            date: c.commit?.author?.date,
            url: c.html_url
        }))
    };
}

async function fetchGitHubActivity(env: { GITHUB_TOKEN?: string, GITHUB_USERNAME?: string }, limit = 15) {
    const username = (env.GITHUB_USERNAME || "stanmac").trim();
    const headers = buildGitHubHeaders(env);
    const res = await fetch(`https://api.github.com/users/${username}/events/public?per_page=${limit}`, { headers });
    if (!res.ok) throw new Error(`GitHub Events API error: ${res.status}`);
    const events = await res.json() as any[];
    return {
        events: events.map(e => ({
            type: e.type,
            repo: e.repo?.name,
            created_at: e.created_at,
            detail: summariseEvent(e)
        }))
    };
}

function summariseEvent(e: any): string {
    switch (e.type) {
        case 'PushEvent': {
            const commits = e.payload?.commits?.map((c: any) => c.message).join('; ') || '';
            return `Pushed ${e.payload?.size || 0} commit(s): ${commits}`;
        }
        case 'PullRequestEvent':
            return `PR #${e.payload?.number} ${e.payload?.action}: "${e.payload?.pull_request?.title}"`;
        case 'IssuesEvent':
            return `Issue #${e.payload?.issue?.number} ${e.payload?.action}: "${e.payload?.issue?.title}"`;
        case 'CreateEvent':
            return `Created ${e.payload?.ref_type} "${e.payload?.ref}" in ${e.repo?.name}`;
        case 'ForkEvent':
            return `Forked ${e.repo?.name}`;
        case 'WatchEvent':
            return `Starred ${e.repo?.name}`;
        case 'DeleteEvent':
            return `Deleted ${e.payload?.ref_type} "${e.payload?.ref}" in ${e.repo?.name}`;
        default:
            return e.type;
    }
}

async function fetchGitHubRepoDetails(env: { GITHUB_TOKEN?: string, GITHUB_USERNAME?: string }, repoName: string) {
    const username = (env.GITHUB_USERNAME || "stanmac").trim();
    const headers = buildGitHubHeaders(env);

    const [repoRes, languagesRes, prsRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${username}/${repoName}`, { headers }),
        fetch(`https://api.github.com/repos/${username}/${repoName}/languages`, { headers }),
        fetch(`https://api.github.com/repos/${username}/${repoName}/pulls?state=open&per_page=5`, { headers })
    ]);
    if (!repoRes.ok) throw new Error(`GitHub Repo API error: ${repoRes.status}`);
    const repo = await repoRes.json() as any;
    const languages = languagesRes.ok ? await languagesRes.json() : {};
    const prs = prsRes.ok ? await prsRes.json() as any[] : [];

    return {
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        open_issues: repo.open_issues_count,
        default_branch: repo.default_branch,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        topics: repo.topics,
        languages,
        open_prs: prs.map((pr: any) => ({ number: pr.number, title: pr.title, user: pr.user?.login }))
    };
}

async function fetchGitHubProfile(env: { GITHUB_TOKEN?: string, GITHUB_USERNAME?: string }) {
    const username = (env.GITHUB_USERNAME || "stanmac").trim();
    const headers = buildGitHubHeaders(env);

    const [profileRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`, { headers }),
        fetch(`https://api.github.com/users/${username}/repos?per_page=100`, { headers })
    ]);
    if (!profileRes.ok) throw new Error(`GitHub Profile API error: ${profileRes.status}`);
    const profile = await profileRes.json() as any;
    const repos = reposRes.ok ? await reposRes.json() as any[] : [];

    const totalStars = repos.reduce((sum: number, r: any) => sum + (r.stargazers_count || 0), 0);
    const langCounts: Record<string, number> = {};
    repos.forEach((r: any) => { if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1; });
    const topLanguages = Object.entries(langCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([lang]) => lang);

    return {
        login: profile.login,
        name: profile.name,
        bio: profile.bio,
        followers: profile.followers,
        following: profile.following,
        public_repos: profile.public_repos,
        total_stars: totalStars,
        top_languages: topLanguages,
        created_at: profile.created_at,
        blog: profile.blog,
        location: profile.location
    };
}

function buildGitHubHeaders(env: { GITHUB_TOKEN?: string }): Record<string, string> {
    const headers: Record<string, string> = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "stanKe"
    };
    if (env.GITHUB_TOKEN?.trim()) {
        headers["Authorization"] = `token ${env.GITHUB_TOKEN.trim()}`;
    }
    return headers;
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

// ── CF AI Search retrieval ─────────────────────────────────────────────────────

async function getDocContext(env: { AI?: any }, query: string): Promise<string> {
    if (!env.AI) return ""; // binding not present in local dev — degrade gracefully
    try {
        const result = await env.AI.autorag(AI_SEARCH_INSTANCE).search({
            query,
            max_num_results: 5,
            reranking: { enabled: true, model: "@cf/baai/bge-reranker-base" },
        });
        const chunks: string[] = (result?.data ?? []).map((item: any) => {
            const text = item.content?.[0]?.text ?? item.text ?? "";
            const src = item.filename ?? item.source ?? "";
            return src ? `[${src}]\n${text}` : text;
        });
        return chunks.filter(Boolean).join("\n\n---\n\n");
    } catch {
        // Index empty or not yet ready — return empty so chat still works
        return "";
    }
}
