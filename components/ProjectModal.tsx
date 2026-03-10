import React, { useEffect } from 'react';
import { Project } from '../types';
import { X, ExternalLink, Github } from 'lucide-react';

interface ProjectModalProps {
    project: Project;
    onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-zinc-900/90 backdrop-blur border-b border-zinc-800 p-6 flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{project.title}</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white transition-colors p-1"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 flex-1">
                    <div className="flex flex-wrap gap-2 mb-8">
                        {project.techStack?.map(tech => (
                            <span key={tech} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] font-mono uppercase tracking-widest rounded border border-zinc-700">
                                {tech}
                            </span>
                        ))}
                    </div>

                    <div className="prose prose-invert prose-zinc max-w-none prose-p:text-zinc-400 prose-p:leading-relaxed">
                        <p className="text-zinc-300 text-lg mb-6">{project.description}</p>
                        {project.detailedDescription?.split('\n\n').map((paragraph, i) => (
                            <p key={i} className="mb-4">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>

                <div className="sticky bottom-0 bg-zinc-900/90 backdrop-blur border-t border-zinc-800 p-6 flex items-center gap-6 mt-auto">
                    {project.githubUrl && (
                        <a href={project.githubUrl} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-mono uppercase tracking-widest">
                            <Github size={16} /> Source Code
                        </a>
                    )}
                    {project.demoUrl && (
                        <a href={project.demoUrl} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-mono uppercase tracking-widest">
                            <ExternalLink size={16} /> Live Demo
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};
