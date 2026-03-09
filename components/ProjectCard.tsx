import React, { useState } from 'react';
import { Project, ProjectCategory } from '../types';
import { StatsChart } from './StatsChart';
import { Github, ExternalLink, Activity, Terminal, Gamepad2, FlaskConical, BookOpen, Copy, Check } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

const CategoryIcon = ({ category }: { category: ProjectCategory }) => {
  switch (category) {
    case ProjectCategory.SYSTEMS: return <Terminal className="w-3 h-3 text-zinc-500" />;
    case ProjectCategory.GAMES: return <Gamepad2 className="w-3 h-3 text-zinc-500" />;
    case ProjectCategory.HACKATHON: return <FlaskConical className="w-3 h-3 text-zinc-500" />;
    case ProjectCategory.BLOG: return <BookOpen className="w-3 h-3 text-zinc-500" />;
    default: return <Activity className="w-3 h-3 text-zinc-500" />;
  }
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const [copied, setCopied] = useState(false);

  const curlCommand = `curl -X GET stan.dev/api/projects/${project.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-all flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CategoryIcon category={project.category} />
          <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">{project.category}</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-700">ID: {project.id}</span>
      </div>

      <h3 className="text-lg font-bold text-zinc-100 mb-2 group-hover:text-white transition-colors">
        {project.title}
      </h3>

      <p className="text-zinc-500 text-sm leading-relaxed mb-6 flex-1">
        {project.description}
      </p>

      {project.metrics && (
        <div className="mb-6 p-4 bg-black/50 border border-zinc-800 rounded font-mono">
          <div className="text-[10px] text-zinc-600 mb-2 uppercase tracking-widest">Metrics</div>
          <div className="space-y-1">
            {project.metrics.map(m => (
              <div key={m.name} className="flex justify-between text-xs">
                <span className="text-zinc-500">{m.name}</span>
                <span className="text-zinc-300">{m.value}{m.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {project.tags.map(tag => (
          <span key={tag} className="text-[10px] font-mono text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto space-y-4">
        <div className="relative group/curl">
          <div className="bg-black border border-zinc-800 rounded p-2 flex items-center justify-between gap-2">
            <code className="text-[10px] text-zinc-400 font-mono truncate">{curlCommand}</code>
            <button 
              onClick={copyToClipboard}
              className="text-zinc-600 hover:text-white transition-colors flex-shrink-0"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
              <Github size={14} /> Source
            </a>
          )}
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
              <ExternalLink size={14} /> Live
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
