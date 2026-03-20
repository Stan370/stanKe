import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Trash2, Loader, CheckCircle, AlertCircle, X, Database, CloudUpload } from 'lucide-react';
import { UploadedFile } from '../types';
import { extractText, uploadDocs } from '../services/ragService';

type ProcessState = 'idle' | 'uploading' | 'uploaded' | 'error';

interface DocUploaderProps {
    /** Called after a successful upload batch */
    onUploadComplete: () => void;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const STATUS_LABELS: Record<ProcessState, string> = {
    idle: 'DROP_TO_UPLOAD',
    uploading: 'UPLOADING...',
    uploaded: 'INDEXED_TO_R2',
    error: 'ERROR',
};

export const DocUploader: React.FC<DocUploaderProps> = ({ onUploadComplete }) => {
    const [processState, setProcessState] = useState<ProcessState>('idle');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback(async (files: FileList | File[]) => {
        const fileList = Array.from(files).filter(f =>
            f.type === 'text/plain' ||
            f.name.endsWith('.md') ||
            f.name.endsWith('.txt') ||
            f.type === 'application/pdf'
        );

        if (fileList.length === 0) {
            setErrorMsg('Only .txt, .md, and .pdf files are supported.');
            setProcessState('error');
            return;
        }

        setProcessState('uploading');
        setErrorMsg('');

        try {
            // For PDFs: extract text client-side so R2 stores a text blob that
            // AI Search can index (CF AI Search indexes text, not binary PDFs).
            const textFiles: File[] = await Promise.all(
                fileList.map(async (file) => {
                    if (file.type === 'application/pdf') {
                        const text = await extractText(file);
                        return new File([text], file.name.replace(/\.pdf$/i, '.txt'), {
                            type: 'text/plain',
                        });
                    }
                    return file;
                })
            );

            const result = await uploadDocs(textFiles);

            setUploadedFiles(prev => [...prev, ...result]);
            setProcessState('uploaded');
            onUploadComplete();
        } catch (err) {
            console.error(err);
            setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
            setProcessState('error');
        }
    }, [onUploadComplete]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);

    const handleClear = () => {
        setUploadedFiles([]);
        setProcessState('idle');
        setErrorMsg('');
    };

    const removeFile = (name: string) => {
        const updated = uploadedFiles.filter(f => f.name !== name);
        setUploadedFiles(updated);
        if (updated.length === 0) setProcessState('idle');
    };

    const isProcessing = processState === 'uploading';

    return (
        <div>
            {/* Header */}
            <header className="mb-12">
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-mono mb-6">
                    <Database size={12} />
                    <span>CF_RAG / R2 + AI_SEARCH</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Context Documents</h2>
                <p className="text-zinc-500 text-sm font-mono uppercase tracking-wider">
                    Upload files to R2. Cloudflare auto-chunks, embeds, and indexes them.
                </p>
            </header>

            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isProcessing && inputRef.current?.click()}
                className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200 mb-8
          ${isDragging
                        ? 'border-white bg-white/5 scale-[1.01]'
                        : processState === 'uploaded'
                            ? 'border-emerald-700 bg-emerald-950/20 hover:border-emerald-500'
                            : processState === 'error'
                                ? 'border-red-800 bg-red-950/20'
                                : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-600'}
        `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".txt,.md,.pdf,text/plain,application/pdf"
                    className="hidden"
                    onChange={e => e.target.files && processFiles(e.target.files)}
                />

                {/* Icon area */}
                <div className="flex justify-center mb-4">
                    {isProcessing ? (
                        <Loader size={32} className="text-zinc-400 animate-spin" />
                    ) : processState === 'uploaded' ? (
                        <CheckCircle size={32} className="text-emerald-500" />
                    ) : processState === 'error' ? (
                        <AlertCircle size={32} className="text-red-500" />
                    ) : (
                        <CloudUpload size={32} className={`transition-colors ${isDragging ? 'text-white' : 'text-zinc-600'}`} />
                    )}
                </div>

                <p className="text-sm font-mono uppercase tracking-widest text-zinc-400 mb-1">
                    {STATUS_LABELS[processState]}
                </p>

                {processState === 'error' && errorMsg && (
                    <p className="text-xs text-red-500 font-mono mt-2">{errorMsg}</p>
                )}

                {(processState === 'idle' || processState === 'error') && (
                    <p className="text-[10px] text-zinc-600 font-mono mt-3 uppercase tracking-wider">
                        .txt · .md · .pdf — drag &amp; drop or click
                    </p>
                )}

                {processState === 'uploading' && (
                    <p className="text-[10px] text-zinc-600 font-mono mt-2 animate-pulse">
                        Streaming to R2 → AI Search indexing...
                    </p>
                )}

                {processState === 'uploaded' && (
                    <p className="text-[10px] text-emerald-700 font-mono mt-2">
                        {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded — CF AI Search will index in ~30s
                    </p>
                )}
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                            Uploaded to R2
                        </span>
                        <button
                            onClick={handleClear}
                            className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                            <Trash2 size={10} /> Clear list
                        </button>
                    </div>

                    {uploadedFiles.map(file => (
                        <div
                            key={file.name}
                            className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded group hover:border-zinc-700 transition-colors"
                        >
                            <FileText size={14} className="text-zinc-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-mono text-zinc-300 truncate">{file.name}</p>
                                <p className="text-[10px] font-mono text-zinc-600">{file.size} · in R2 stanke-docs</p>
                            </div>
                            <button
                                onClick={() => removeFile(file.name)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-700 hover:text-red-400"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Pipeline info */}
            <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg font-mono text-xs">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500 uppercase tracking-widest">RAG Pipeline</span>
                    <span className="text-[10px] text-emerald-700">CF AI Search</span>
                </div>
                <div className="space-y-2 text-zinc-500">
                    {([
                        ['01', 'UPLOAD', 'POST /api/upload → R2 bucket (stanke-docs)'],
                        ['02', 'INDEX', 'CF AI Search auto-chunks + embeds via Workers AI'],
                        ['03', 'STORE', 'Vectors synced into Cloudflare Vectorize'],
                        ['04', 'QUERY', 'env.AI.autorag().search() → top-5 chunks → Gemini'],
                    ] as [string, string, string][]).map(([num, label, desc]) => (
                        <div key={num} className="flex gap-4">
                            <span className="text-zinc-700">{num}</span>
                            <span className="text-accent w-16 flex-shrink-0">{label}</span>
                            <span className="text-zinc-600">{desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
