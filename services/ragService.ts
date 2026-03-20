import { UploadedFile } from '../types';

// ── Text extraction (still useful for plaintext uploads) ─────────────────────

export async function extractText(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
        return extractPdfText(file);
    }
    return file.text();
}

async function extractPdfText(file: File): Promise<string> {
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

// ── Upload to R2 via /api/upload ─────────────────────────────────────────────

// Secret is never baked into the frontend bundle anymore — kept here as a
// header passthrough only if the env var was explicitly exposed via Vite.
// For production, leave VITE_UPLOAD_SECRET unset and rely on Cloudflare's
// network-level isolation instead.
const UPLOAD_SECRET = (import.meta as any).env?.VITE_UPLOAD_SECRET as string | undefined;

export async function uploadDocs(files: File[]): Promise<UploadedFile[]> {
    const form = new FormData();
    for (const file of files) {
        form.append('file', file, file.name);
    }

    const headers: HeadersInit = {};
    if (UPLOAD_SECRET) (headers as Record<string, string>)['X-Upload-Key'] = UPLOAD_SECRET;

    const res = await fetch('/api/upload', { method: 'POST', headers, body: form });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Upload failed: ${(err as any).error ?? res.statusText}`);
    }

    const { uploaded, errors } = (await res.json()) as {
        uploaded: string[];
        errors?: { name: string; error: string }[];
    };

    if (errors && errors.length > 0) {
        console.warn('Some files failed to upload:', errors);
    }

    return files
        .filter(f => uploaded.includes(f.name.replace(/[^a-zA-Z0-9._\-]/g, '_')))
        .map(f => ({ name: f.name, size: formatSize(f.size) }));
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
