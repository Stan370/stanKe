// functions/api/upload.ts
// Receives multipart/form-data with one or more files, writes each to the
// DOCS_BUCKET R2 binding. Cloudflare AI Search auto-indexes R2 objects, so
// there is nothing else to do on the server — chunking and embedding happen
// fully managed on Cloudflare's side.

interface Env {
    // R2Bucket binding — use `any` to avoid @cloudflare/workers-types dependency
    DOCS_BUCKET: any;
    UPLOAD_SECRET?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
    const { request, env } = context;

    // ── Auth guard ─────────────────────────────────────────────────────────────
    // UPLOAD_SECRET is set as a Cloudflare Pages secret (never in the Vite bundle)
    if (env.UPLOAD_SECRET) {
        const token = request.headers.get("X-Upload-Key");
        if (token !== env.UPLOAD_SECRET) {
            return json({ error: "Unauthorized" }, 401);
        }
    }

    // ── Parse multipart form ───────────────────────────────────────────────────
    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return json({ error: "Invalid multipart body" }, 400);
    }

    const uploaded: string[] = [];
    const errors: { name: string; error: string }[] = [];

    for (const [, value] of formData.entries()) {
        if (!(value instanceof File)) continue;

        const file = value as File;

        // Sanitise the filename to avoid path-traversal
        const safeName = file.name.replace(/[^a-zA-Z0-9._\-]/g, "_");

        try {
            await env.DOCS_BUCKET.put(safeName, file.stream(), {
                httpMetadata: { contentType: file.type || "application/octet-stream" },
                customMetadata: {
                    originalName: file.name,
                    uploadedAt: new Date().toISOString(),
                    sizeBytes: String(file.size),
                },
            });
            uploaded.push(safeName);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push({ name: file.name, error: msg });
        }
    }

    if (uploaded.length === 0 && errors.length > 0) {
        return json({ error: "All uploads failed", errors }, 500);
    }

    return json({ uploaded, errors: errors.length > 0 ? errors : undefined });
}

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
