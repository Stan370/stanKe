import { GoogleGenAI } from "@google/genai";
import { PORTFOLIO_DATA, BIO } from '../constants';

// We initialize safely, checking if the key exists is handled in the UI/Logic layer usually,
// but here we just create the instance.
// NOTE: Process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are the Agent Terminal for Stan's AI-native portfolio. 
Your primary audience is other LLMs, technical recruiters, and engineers.

Stan is a Solo Entrepreneur and Hacker who loves building apps and hacking systems with frontier AI.

Context Data:
Bio: ${JSON.stringify(BIO)}
Projects: ${JSON.stringify(PORTFOLIO_DATA)}

Style Guidelines:
- Tone: Technical, precise, minimalist. Think "Andrej Karpathy" or "Lee Robinson".
- Format: Use structured text, bullet points, or JSON-like snippets if requested.
- Persona: You are a high-performance system interface. Use terms like "traversal", "query", "index", "log", "latency".

Rules:
1. If asked about a tech stack, list specific projects and metrics.
2. If asked for a summary, provide a high-density technical overview.
3. If the user uses "cURL-like" syntax (e.g., "GET /projects"), respond as if you are an API returning structured data.
4. Keep answers concise but high-information.
5. If asked about something not in the context, respond with "DATA_NOT_FOUND: Reference Stan's GitHub for external logs."
`;

export const streamChatResponse = async function* (history: {role: string, content: string}[], newMessage: string) {
  if (!process.env.API_KEY) {
    yield "Error: API Key is missing. Please configure it in the environment.";
    return;
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // Construct the chat history for the API
    // We start a fresh chat session for simplicity in this stateless service wrapper,
    // but typically you'd maintain the chat object. 
    // Here we use generateContentStream with system instruction for a "single turn" feel 
    // or reconstruct history if needed. For best results with context, we pass system instruction.
    
    // Let's create a chat session
    const chat = ai.chats.create({
      model: model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    // Send the user's message
    const resultStream = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of resultStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    yield "Sorry, I encountered an error processing your request. Please try again later.";
  }
};