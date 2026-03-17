export async function onRequestPost(context: {
    request: Request;
    env: { GEMINI_API_KEY: string; EMBED_SECRET?: string };
}) {
    const { request, env } = context;

    // ── Auth guard ──────────────────────────────────────────────────────────────
    if (env.EMBED_SECRET) {
        const token =
            request.headers.get("X-Embed-Key") ??
            new URL(request.url).searchParams.get("key");
        if (token !== env.EMBED_SECRET) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }
    }

    // ── Parse body ──────────────────────────────────────────────────────────────
    let texts: string[];
    try {
        const body = (await request.json()) as { texts?: unknown };
        if (!Array.isArray(body.texts) || body.texts.length === 0) {
            return new Response(JSON.stringify({ error: "texts[] required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
        texts = body.texts as string[];
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!env.GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: "API Key missing" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    // ── Embed via Gemini v1beta REST API ─────────────────────────────────────────
    // text-embedding-004 is only available under v1beta, not the stable v1 endpoint.
    const apiKey = env.GEMINI_API_KEY.trim();
    const model = "text-embedding-001";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${apiKey}`;

    try {
        const geminiRes = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                requests: texts.map((text) => ({
                    model: `models/${model}`,
                    content: { parts: [{ text }] },
                })),
            }),
        });

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            return new Response(
                JSON.stringify({ error: `Gemini error ${geminiRes.status}: ${errText}` }),
                { status: 502, headers: { "Content-Type": "application/json" } }
            );
        }

        const data = (await geminiRes.json()) as {
            embeddings: { values: number[] }[];
        };

        const embeddings = (data.embeddings ?? []).map((e) => e.values ?? []);

        return new Response(JSON.stringify({ embeddings }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
