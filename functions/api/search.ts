// functions/api/search.ts
// Thin wrapper around the Cloudflare AI Search Workers binding.
// The frontend calls this to retrieve relevant chunks for a given query.
// AI Search handles embedding the query + vector search against the Vectorize
// index that was auto-built from the R2 bucket.

interface Env {
    // Workers AI binding — use `any` to avoid @cloudflare/workers-types dependency
    AI: any;
    UPLOAD_SECRET?: string;
}

// ── IMPORTANT: Replace "stanke-rag" with the name you gave your AI Search
// instance in the Cloudflare Dashboard (Compute & AI → AI Search).
const AI_SEARCH_INSTANCE = "stanke-rag";

export async function onRequestPost(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // ── Auth guard ─────────────────────────────────────────────────────────────
    if (env.UPLOAD_SECRET) {
        const token = request.headers.get("X-Upload-Key");
        if (token !== env.UPLOAD_SECRET) {
            return json({ error: "Unauthorized" }, 401);
        }
    }

    // ── Parse body ─────────────────────────────────────────────────────────────
    let query: string;
    try {
        const body = (await request.json()) as { query?: unknown };
        if (typeof body.query !== "string" || body.query.trim() === "") {
            return json({ error: "query string required" }, 400);
        }
        query = body.query.trim();
    } catch {
        return json({ error: "Invalid JSON" }, 400);
    }

    // ── AI Search retrieval ────────────────────────────────────────────────────
    try {
        const result = await (env.AI as any).autorag(AI_SEARCH_INSTANCE).search({
            query,
            max_num_results: 5,
            reranking: {
                enabled: true,
                model: "@cf/baai/bge-reranker-base",
            },
        });

        // Flatten chunks into a context string for the chat worker
        const chunks: { text: string; filename?: string; score?: number }[] =
            (result?.data ?? []).map((item: any) => ({
                text: item.content?.[0]?.text ?? item.text ?? "",
                filename: item.filename ?? item.source ?? undefined,
                score: item.score ?? undefined,
            }));

        const context = chunks
            .filter((c) => c.text.length > 0)
            .map((c) => (c.filename ? `[${c.filename}]\n${c.text}` : c.text))
            .join("\n\n---\n\n");

        return json({ context, chunkCount: chunks.length });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // If the index is empty / not ready, return gracefully with no context
        if (msg.includes("not found") || msg.includes("empty")) {
            return json({ context: "", chunkCount: 0 });
        }
        return json({ error: msg }, 502);
    }
}

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
