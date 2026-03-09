import { Project, ProjectCategory } from './types';

// This data feeds both the UI and the AI Context
export const PORTFOLIO_DATA: Project[] = [
  // --- SYSTEMS & INFRA ---
  {
    id: 'k8s-auth-system',
    title: 'Distributed Auth System for K8s',
    category: ProjectCategory.SYSTEMS,
    description: 'A high-throughput authentication sidecar designed for zero-trust Kubernetes environments. Handles token introspection and RBAC enforcement at the pod level.',
    tags: ['Go', 'Kubernetes', 'gRPC', 'OIDC'],
    imageUrl: 'https://picsum.photos/800/400?grayscale', 
    metrics: [
      { name: 'Avg Latency (ms)', value: 12, unit: 'ms' },
      { name: 'P99 Latency (ms)', value: 45, unit: 'ms' },
      { name: 'QPS Capacity', value: 15000, unit: 'req/s' },
    ],
    techStack: ['Golang', 'Envoy', 'Redis Cluster', 'Prometheus'],
    githubUrl: 'https://github.com/Stan370',
    blogUrl: '#'
  },
  {
    id: 'llm-agent-infra',
    title: 'Scalable LLM Agent Infrastructure',
    category: ProjectCategory.SYSTEMS,
    description: 'Event-driven architecture for managing stateful LLM agents. Features a custom vector retrieval pipeline and optimistic concurrency control for agent memory.',
    tags: ['Python', 'FastAPI', 'VectorDB', 'Kafka'],
    imageUrl: 'https://picsum.photos/800/401?grayscale',
    metrics: [
      { name: 'Context Retrieval', value: 120, unit: 'ms' },
      { name: 'Concurrent Agents', value: 500, unit: 'active' },
    ],
    techStack: ['Python', 'Celery', 'Pinecone', 'Docker'],
    githubUrl: 'https://github.com/Stan370'
  },

  // --- TOOLS & APPS ---
  {
    id: 'tony-chat',
    title: 'TonyChat: Context-Aware Assistant',
    category: ProjectCategory.TOOLS,
    description: 'A React Native + Python assistant that builds a local knowledge graph of user interactions to provide personalized context without sending PII to cloud models.',
    tags: ['React Native', 'Local LLM', 'GraphRAG'],
    imageUrl: 'https://picsum.photos/800/402',
    demoUrl: 'https://devpost.com/Stan370',
    githubUrl: 'https://github.com/Stan370',
    techStack: ['Llama.cpp', 'Neo4j', 'TypeScript']
  },
  {
    id: 'vct-agent',
    title: 'VCT Agent Manager',
    category: ProjectCategory.TOOLS,
    description: 'An autonomous agent interface for managing Valorant Champions Tour fantasy leagues. Scrapes real-time data and proposes roster changes.',
    tags: ['LangChain', 'Puppeteer', 'Next.js'],
    imageUrl: 'https://picsum.photos/800/403',
    demoUrl: '#',
    techStack: ['Vercel AI SDK', 'Postgres', 'Tailwind']
  },

  // --- HACKATHONS ---
  {
    id: 'hackathon-health',
    title: 'NeuroSync (HackMIT Winner)',
    category: ProjectCategory.HACKATHON,
    description: 'Real-time EEG visualization tool using WebBluetooth and WebGL.',
    hypothesis: 'Can we visualize focus states in browser with < 50ms latency?',
    outcome: 'Achieved 30ms render loop. Won Best Health Tech.',
    tags: ['WebGL', 'WebBluetooth', 'React'],
    imageUrl: 'https://picsum.photos/800/404',
    demoUrl: 'https://devpost.com/Stan370'
  },
  
  // --- GAMES ---
  {
    id: 'reddit-place-game',
    title: 'Pixel War Strategy',
    category: ProjectCategory.GAMES,
    description: 'A simulation game based on r/place. Coordinate pixel placement with bots in a simulated chaotic environment.',
    tags: ['Canvas API', 'WebSockets', 'Rust (WASM)'],
    imageUrl: 'https://picsum.photos/800/405',
    demoUrl: '#',
    githubUrl: 'https://github.com/Stan370'
  },
  {
    id: 'klotski-solver',
    title: 'Klotski Solver & UI',
    category: ProjectCategory.GAMES,
    description: 'A BFS-based solver for the Klotski sliding block puzzle with a smooth, animated React UI.',
    tags: ['Algorithms', 'React', 'Framer Motion'],
    imageUrl: 'https://picsum.photos/800/406',
    githubUrl: 'https://github.com/Stan370'
  },

  // --- BLOG MOCK (Mixed EN/CN) ---
  {
    id: 'blog-k8s-source',
    title: 'K8s Source Reading: Scheduler Internals',
    category: ProjectCategory.BLOG,
    description: '深入理解 Kubernetes 调度器的工作原理. A deep dive into the priority queues and scoring plugins.',
    tags: ['Source Code', 'Deep Dive', 'CN'],
    imageUrl: 'https://picsum.photos/800/407?grayscale',
    blogUrl: '#'
  },
  {
    id: 'blog-llm-eval',
    title: 'Evaluating RAG Pipelines: Metrics that Matter',
    category: ProjectCategory.BLOG,
    description: 'How to move beyond "vibes" when evaluating retrieval systems. Discussing faithfulness, answer relevance, and context precision.',
    tags: ['LLM', 'Engineering', 'EN'],
    imageUrl: 'https://picsum.photos/800/408?grayscale',
    blogUrl: '#'
  },
  {
    id: 'blog-rust-wasm',
    title: 'Rust + WASM: Bringing Native Performance to the Web',
    category: ProjectCategory.BLOG,
    description: 'My experience rewriting a physics engine in Rust and compiling to WebAssembly. Is the complexity worth the FPS gain?',
    tags: ['Rust', 'WebAssembly', 'Performance'],
    imageUrl: 'https://picsum.photos/800/409?grayscale',
    blogUrl: '#'
  }
];

export const BIO = {
  name: "Stan",
  title: "Solo Entrepreneur & Hacker",
  tagline: "Building apps and hacking systems with frontier AI.",
  summary: "Who the hell am I? I'm @Stan370, a solo entrepreneur, full-stack hacker, and builder of apps. I love to hack systems and use frontier AI models to build cool things. I share everything I know about making awesome software through my projects, articles, and open-source experiments.",
  skills: ["React", "TypeScript", "Node.js", "Frontier AI", "Rapid Prototyping", "Full-Stack"]
};