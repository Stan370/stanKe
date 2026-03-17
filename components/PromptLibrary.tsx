import React from 'react';

const PROMPTS = [
    {
        title: "Summarize Experience",
        prompt: "Analyze Stan's projects and summarize his core expertise in distributed systems. Focus on specific metrics and technologies used.",
        useCase: "Recruiter / Technical Lead",
    },
    {
        title: "Tech Stack Evaluation",
        prompt: "List all projects where Stan used Golang and Kubernetes. For each project, explain his specific contribution and the scale of the system.",
        useCase: "Technical Interviewer",
    },
    {
        title: "Creative Coding Insight",
        prompt: "Explain the intersection of Stan's systems engineering background and his creative projects like WhisperTrans or Pixel War.",
        useCase: "Collaborator",
    },
];

export const PromptLibrary: React.FC = () => (
    <div className="space-y-8">
        {PROMPTS.map((item, idx) => (
            <div key={idx} className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">{item.title}</h3>
                    <span className="text-[10px] font-mono text-zinc-600">{item.useCase}</span>
                </div>
                <div className="relative group">
                    <pre className="text-xs text-zinc-400 bg-black p-4 rounded border border-zinc-800 whitespace-pre-wrap font-mono leading-relaxed">
                        {item.prompt}
                    </pre>
                    <button
                        onClick={() => navigator.clipboard.writeText(item.prompt)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-zinc-300 text-[10px] px-2 py-1 rounded hover:bg-zinc-700"
                    >
                        COPY_PROMPT
                    </button>
                </div>
            </div>
        ))}
    </div>
);
