import React, { useState, useMemo, useEffect } from 'react';
import { PORTFOLIO_DATA, BIO } from './constants';
import { ProjectCard } from './components/ProjectCard';
import { ChatInterface } from './components/ChatInterface';
import { ProjectCategory } from './types';
import { Terminal, Github, Linkedin, Mail, ArrowRight, BookOpen, Layers, Zap, Clock, Command, Search, Cpu, Globe, Braces } from 'lucide-react';

type ViewState = 'home' | 'works' | 'blogs' | 'prompts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const worksProjects = useMemo(() => {
    const worksData = PORTFOLIO_DATA.filter(p => p.category !== ProjectCategory.BLOG);
    if (activeCategory === 'All') return worksData;
    return worksData.filter(p => p.category === activeCategory);
  }, [activeCategory]);

  const blogPosts = useMemo(() => {
    return PORTFOLIO_DATA.filter(p => p.category === ProjectCategory.BLOG);
  }, []);

  const categories = ['All', ProjectCategory.SYSTEMS, ProjectCategory.TOOLS, ProjectCategory.HACKATHON, ProjectCategory.GAMES];

  return (
    <div className="min-h-screen bg-background text-zinc-400 font-sans selection:bg-white/10 selection:text-white flex flex-col">

      {/* --- MINIMALIST NAV --- */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b ${scrolled ? 'bg-background/90 backdrop-blur-md border-zinc-800 py-3' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div
            className="text-lg font-bold text-white cursor-pointer flex items-center gap-2 group"
            onClick={() => setCurrentView('home')}
          >
            <span className="text-zinc-500 group-hover:text-white transition-colors">stan@dev:~$</span>
            <span className="animate-pulse">_</span>
          </div>

          <div className="flex items-center gap-6">
            <ul className="flex gap-6 text-xs font-mono uppercase tracking-widest">
              {[
                { id: 'home', label: 'Index' },
                { id: 'works', label: 'Projects' },
                { id: 'blogs', label: 'Logs' },
                { id: 'prompts', label: 'Prompts' }
              ].map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentView(item.id as ViewState)}
                    className={`transition-colors flex items-center gap-1 ${currentView === item.id ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
                  >
                    {currentView === item.id && <span className="text-accent">●</span>}
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden md:flex gap-4 pl-6 border-l border-zinc-800">
              <a href="https://github.com/Stan370" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors"><Github size={16} /></a>
              <a href="/llms.txt" className="text-zinc-500 hover:text-white transition-colors text-[10px] font-mono border border-zinc-800 px-1 rounded">llms.txt</a>
            </div>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-grow pt-32 pb-20">

        {/* VIEW: HOME / INDEX */}
        {currentView === 'home' && (
          <div className="max-w-4xl mx-auto px-6">
            <div className="mb-20">
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-mono mb-6">
                <Cpu size={12} />
                <span>SYSTEM_STATUS: OPTIMIZED_FOR_LLM_CRAWLERS</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tighter mb-8 leading-tight">
                Solo Entrepreneur & Hacker.<br />
                <span className="text-zinc-500">Building apps with frontier AI.</span>
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                <div>
                  <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                    <Command size={14} /> 01. Abstract
                  </h2>
                  <div className="text-zinc-400 leading-relaxed space-y-4">
                    <p><strong>Who the hell am I?</strong></p>
                    <p>
                      I'm <a href="https://github.com/Stan370" target="_blank" rel="noreferrer" className="text-white hover:text-accent underline decoration-zinc-700 underline-offset-4">@Stan370</a>, a solo entrepreneur, full-stack hacker, and builder of apps. I love to hack systems and use frontier AI models to build cool things.
                    </p>
                    <p>
                      I share everything I know about making awesome software through my <button onClick={() => setCurrentView('works')} className="text-white hover:text-accent underline decoration-zinc-700 underline-offset-4">projects</button>, <button onClick={() => setCurrentView('blogs')} className="text-white hover:text-accent underline decoration-zinc-700 underline-offset-4">articles</button>, and open-source experiments.
                    </p>
                  </div>
                </div>
                <div>
                  <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                    <Braces size={14} /> 02. Capabilities
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {BIO.skills.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-lg font-mono text-sm mb-12">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2">
                  <span className="text-zinc-500">Quick Access</span>
                  <span className="text-[10px] text-zinc-600">bash</span>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-4">
                    <span className="text-accent">$</span>
                    <span className="text-zinc-300">curl -L stan.dev/llms.txt</span>
                    <span className="text-zinc-600 ml-auto"># Get machine-readable summary</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-accent">$</span>
                    <span className="text-zinc-300">curl -X GET stan.dev/api/projects</span>
                    <span className="text-zinc-600 ml-auto"># List all engineering works</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-accent">$</span>
                    <span className="text-zinc-300">ask-ai "What is Stan's experience with K8s?"</span>
                    <span className="text-zinc-600 ml-auto"># Query the agent</span>
                  </div>
                </div>
              </div>
            </div>

            <section className="border-t border-zinc-800 pt-12">
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-8">Featured Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {worksProjects.slice(0, 2).map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
              <button
                onClick={() => setCurrentView('works')}
                className="mt-8 text-xs font-mono text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
              >
                VIEW_ALL_PROJECTS <ArrowRight size={14} />
              </button>
            </section>
          </div>
        )}

        {/* VIEW: WORKS / PROJECTS */}
        {currentView === 'works' && (
          <div className="max-w-6xl mx-auto px-6">
            <header className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-2">Engineering Works</h2>
              <p className="text-zinc-500 text-sm font-mono uppercase tracking-wider">
                Total: {worksProjects.length} | Filtered by: {activeCategory}
              </p>
            </header>

            <div className="mb-12 flex overflow-x-auto pb-4 gap-4 scrollbar-hide border-b border-zinc-900">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] font-mono uppercase tracking-widest transition-all px-3 py-1 border ${activeCategory === cat
                      ? 'bg-white text-black border-white'
                      : 'text-zinc-500 border-zinc-800 hover:border-zinc-600'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {worksProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* VIEW: BLOGS / LOGS */}
        {currentView === 'blogs' && (
          <div className="max-w-3xl mx-auto px-6">
            <header className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-2">Engineering Logs</h2>
              <p className="text-zinc-500 text-sm font-mono uppercase tracking-wider">
                Raw thoughts on systems and intelligence.
              </p>
            </header>

            <div className="space-y-12">
              {blogPosts.map(post => (
                <article key={post.id} className="group cursor-pointer">
                  <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-600 mb-2 uppercase tracking-widest">
                    <span>{post.tags[0]}</span>
                    <span>/</span>
                    <span>5 MIN READ</span>
                    <span className="ml-auto text-zinc-800 group-hover:text-accent transition-colors">0x{post.id.slice(0, 4)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-200 group-hover:text-white transition-colors mb-2">{post.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-4 line-clamp-2">{post.description}</p>
                  <div className="flex gap-2">
                    {post.tags.slice(1).map(tag => (
                      <span key={tag} className="text-[10px] font-mono text-zinc-700">#{tag}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: PROMPTS */}
        {currentView === 'prompts' && (
          <div className="max-w-3xl mx-auto px-6">
            <header className="mb-16">
              <h2 className="text-2xl font-bold text-white mb-2">Prompt Library</h2>
              <p className="text-zinc-500 text-sm font-mono uppercase tracking-wider">
                Optimized instructions for interacting with this portfolio.
              </p>
            </header>

            <div className="space-y-8">
              {[
                {
                  title: "Summarize Experience",
                  prompt: "Analyze Stan's projects and summarize his core expertise in distributed systems. Focus on specific metrics and technologies used.",
                  useCase: "Recruiter / Technical Lead"
                },
                {
                  title: "Tech Stack Evaluation",
                  prompt: "List all projects where Stan used Golang and Kubernetes. For each project, explain his specific contribution and the scale of the system.",
                  useCase: "Technical Interviewer"
                },
                {
                  title: "Creative Coding Insight",
                  prompt: "Explain the intersection of Stan's systems engineering background and his creative projects like NeuroSync or Pixel War.",
                  useCase: "Collaborator"
                }
              ].map((item, idx) => (
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
                      onClick={() => {
                        navigator.clipboard.writeText(item.prompt);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-zinc-300 text-[10px] px-2 py-1 rounded hover:bg-zinc-700"
                    >
                      COPY_PROMPT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <ChatInterface />

      <footer className="border-t border-zinc-900 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
            &copy; 2026 STAN.DEV / ALL_RIGHTS_RESERVED / BUILT_FOR_AGENTS
          </div>
          <div className="flex gap-6 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;