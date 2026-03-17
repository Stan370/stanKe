import { DocumentChunk } from '../types';

// ── Text extraction ─────────────────────────────────────────────────────────

export async function extractText(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
        return extractPdfText(file);
    }
    // .txt, .md, and anything else text-based
    return file.text();
}

async function extractPdfText(file: File): Promise<string> {
    // Lazy-load pdf.js from CDN to avoid npm dependency
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((item: any) => item.str).join(' ');
        pages.push(text);
    }
    return pages.join('\n\n');
}

async function loadPdfJs(): Promise<any> {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
    await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load pdf.js'));
        document.head.appendChild(script);
    });
    const lib = (window as any).pdfjsLib;
    lib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    return lib;
}

// ── Chunking ────────────────────────────────────────────────────────────────

export function chunkText(
    text: string,
    filename: string,
    chunkSize = 500,
    overlap = 80
): DocumentChunk[] {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: DocumentChunk[] = [];
    let i = 0;
    let idx = 0;

    while (i < words.length) {
        const slice = words.slice(i, i + chunkSize).join(' ');
        chunks.push({
            id: `${filename}-${idx++}`,
            filename,
            text: slice,
        });
        i += chunkSize - overlap;
    }
    return chunks;
}

// ── Embedding (via proxy) ────────────────────────────────────────────────────

// Reads secret baked in at build time by Vite (VITE_EMBED_SECRET in .env)
const EMBED_SECRET = (import.meta as any).env?.VITE_EMBED_SECRET as string | undefined;

function embedHeaders(): HeadersInit {
    const h: HeadersInit = { 'Content-Type': 'application/json' };
    if (EMBED_SECRET) (h as Record<string, string>)['X-Embed-Key'] = EMBED_SECRET;
    return h;
}

export async function embedChunks(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    const texts = chunks.map(c => c.text);
    const response = await fetch('/api/embed', {
        method: 'POST',
        headers: embedHeaders(),
        body: JSON.stringify({ texts }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Embed API error: ${(err as any).error ?? response.statusText}`);
    }

    const { embeddings } = (await response.json()) as { embeddings: number[][] };
    return chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] }));
}

// ── Retrieval ────────────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function retrieveRelevant(
    query: string,
    chunks: DocumentChunk[],
    topK = 3
): Promise<DocumentChunk[]> {
    const chunksWithEmbeddings = chunks.filter(c => c.embedding && c.embedding.length > 0);
    if (chunksWithEmbeddings.length === 0) return [];

    // Embed the query
    const response = await fetch('/api/embed', {
        method: 'POST',
        headers: embedHeaders(),
        body: JSON.stringify({ texts: [query] }),
    });

    if (!response.ok) return [];
    const { embeddings } = (await response.json()) as { embeddings: number[][] };
    const queryEmbedding = embeddings[0];
    if (!queryEmbedding || queryEmbedding.length === 0) return [];

    const scored = chunksWithEmbeddings.map(chunk => ({
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding!),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(s => s.chunk);
}

// ── Fallback keyword search (when no embeddings yet) ─────────────────────────

export function keywordRetrieve(query: string, chunks: DocumentChunk[], topK = 3): DocumentChunk[] {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = chunks.map(chunk => {
        const lower = chunk.text.toLowerCase();
        const score = terms.reduce((acc, t) => acc + (lower.includes(t) ? 1 : 0), 0);
        return { chunk, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).filter(s => s.score > 0).map(s => s.chunk);
}
