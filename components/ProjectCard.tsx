import React, { useState } from 'react';
import { Project, ProjectCategory } from '../types';
import { DISABLED_CURL_IDS } from '../constants';
import { StatsChart } from './StatsChart';
import { Github, ExternalLink, Activity, Terminal, Gamepad2, FlaskConical, BookOpen, Copy, Check, Info, Star } from 'lucide-react';
import { ProjectModal } from './ProjectModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isCurlDisabled = DISABLED_CURL_IDS.includes(project.id);

  const curlCommand = `curl -X GET stan.dev/api/projects/${project.id}`;

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFeatured = project.featured;

  return (
    <>
      <div
        onClick={() => {
          if (project.detailedDescription) {
            setIsModalOpen(true);
          } else {
            const url = project.demoUrl || project.githubUrl || project.blogUrl;
            if (url && url !== '#') window.open(url, '_blank', 'noreferrer');
          }
        }}
        className={`group bg-zinc-900 border rounded-lg p-6 transition-all flex flex-col h-full cursor-pointer relative ${isFeatured
          ? 'border-zinc-600 hover:border-zinc-500 shadow-[0_0_20px_-5px_rgba(161,161,170,0.15)]'
          : 'border-zinc-800 hover:border-zinc-700'
          }`}
      >
        {/* Featured badge */}
        {isFeatured && (
          <div className="absolute -top-2.5 right-4 flex items-center gap-1 px-2 py-0.5 bg-zinc-800 border border-zinc-600 rounded-full text-[9px] font-mono uppercase tracking-widest text-zinc-300">
            <Star size={9} className="text-amber-500 fill-amber-500" /> Featured
          </div>
        )}

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

        {/* Preview image + View Details for featured projects */}
        {project.detailedDescription && (
          <div className="mb-6">
            {project.previewImage && (
              <div
                className="relative mb-3 rounded overflow-hidden border border-zinc-800 group/preview"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
              >
                <img
                  src={project.imageUrl}
                  alt={`${project.title} preview`}
                  className="w-full h-36 object-cover object-top opacity-70 group-hover/preview:opacity-100 transition-opacity duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-[10px] font-mono py-1.5 px-3 rounded-full border border-zinc-700 uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all self-start"
            >
              <Info size={12} /> View Details
            </button>
          </div>
        )}

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
          <div className={`relative group/curl ${isCurlDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
            <div className="bg-black border border-zinc-800 rounded p-2 flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
              <code className="text-[10px] text-zinc-400 font-mono truncate">{curlCommand}</code>
              {!isCurlDisabled && (
                <button
                  onClick={copyToClipboard}
                  className="text-zinc-600 hover:text-white transition-colors flex-shrink-0"
                >
                  {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
            {project.githubUrl && (
              <a href={project.githubUrl} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
                <Github size={14} /> Source
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
                <ExternalLink size={14} /> Live
              </a>
            )}
          </div>
        </div>
      </div>
      {isModalOpen && (
        <ProjectModal project={project} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};
