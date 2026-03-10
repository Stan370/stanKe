import { Project, ProjectCategory } from './types';

// This data feeds both the UI and the AI Context
export const DISABLED_CURL_IDS = [
  'k8s-auth-system',
  'llm-agent-infra',
  'whisper-trans'
];

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
    title: 'TonyChat: Multi-Tenant Agent Marketplace',
    category: ProjectCategory.TOOLS,
    description: 'Designed and built a multi-tenant agent marketplace enabling users to deploy custom AI assistants with private knowledge. Supports dynamic model switching across OpenAI, Claude, and Gemini. Features secure user authentication and real-time chat history management.',
    tags: ['Agent Marketplace', 'Multi-tenant', 'LLMs', 'Supabase'],
    imageUrl: 'https://picsum.photos/800/402',
    demoUrl: 'https://devpost.com/Stan370',
    githubUrl: 'https://github.com/Stan370',
    techStack: ['Vercel', 'Supabase', 'OpenAI', 'Claude', 'Gemini']
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
    id: 'whisper-trans',
    title: 'WhisperTrans',
    category: ProjectCategory.HACKATHON,
    description: 'An AI-powered platform designed to help teachers handle multilingual classrooms effortlessly. It turns spoken lessons, story reading, or student discussions into real-time text, automatically translating them into multiple languages so every student can follow along.',
    detailedDescription: 'The system uses modern speech models to perform speech-to-text, translation, and transcript generation in a single pipeline, making classroom content instantly accessible and reusable.\n\nUnder the hood, the platform runs a distributed inference system built with FastAPI and Whisper, optimized for low-latency transcription and translation. A Redis Streams task queue manages audio processing jobs, while memory-aware worker scheduling and containerized services allow the system to scale horizontally and adapt to resource constraints. To keep data transfer efficient across services, multilingual audio and text are encoded using FlatBuffers.\n\nThe result is a single AI platform that can transcribe lessons, translate content, generate transcripts, and make classroom knowledge accessible across languages in real time.',
    tags: ['FastAPI', 'Whisper', 'Redis'],
    imageUrl: 'https://picsum.photos/800/404',
    techStack: ['Python', 'FastAPI', 'Redis Streams', 'FlatBuffers', 'Whisper']
  },

  // --- GAMES ---
  {
    id: 'reddit-tile-match',
    title: 'Reddit Tile Match',
    category: ProjectCategory.GAMES,
    description: 'A new version of an old tile-match UGC game, incorporating features like daily challenges, a Reddit scheduler, and an auto-post bot, built using Devvit 0.12.',
    tags: ['Devvit', 'Reddit API', 'React'],
    imageUrl: 'https://picsum.photos/800/410',
    demoUrl: 'https://www.reddit.com/r/TileMatch/',
  },
  {
    id: 'league-mbti',
    title: 'League MBTI Analysis',
    category: ProjectCategory.GAMES,
    description: 'A data-driven web application to analyze the MBTI personality types of League of Legends players based on their champion pools and playstyles.',
    tags: ['Analytics', 'Web', 'Data'],
    imageUrl: 'https://picsum.photos/800/411',
    demoUrl: 'https://league-mbti-analysis.pages.dev/',
  },
  {
    id: 'klotski',
    title: 'Klotski / 华容道',
    category: ProjectCategory.GAMES,
    description: 'An interactive puzzle game with real-time leaderboards and multi-language support. Implemented complex grid logic and collision detection in TypeScript. Integrated Redis for optimized leaderboard management and resolved ESM/CommonJS compatibility issues for Devvit/Webview integration.',
    tags: ['TypeScript', 'Redis', 'Devvit', 'Puzzles'],
    imageUrl: 'https://picsum.photos/800/406',
    githubUrl: 'https://github.com/Stan370',
    techStack: ['TypeScript', 'Redis', 'Devvit', 'SVGs']
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
  summary: "Who the hell am I? I'm @Stan370, a solo entrepreneur, full stack hacker, and builder of apps. I love to hack systems and use frontier AI models to build cool things. I share everything I know about making awesome software through my projects, articles, and open-source experiments.",
  skills: [
    "Golang", "Node.js", "Python", "RESTful", "Socket", "Auth", "Microservices", "Concurrency", "Distributed Systems",
    "LLM Integration", "Agent Architecture", "Multi-model Routing", "Whisper ASR",
    "TypeScript", "React", "Next.js", "Vite", "TailwindCSS",
    "Docker", "Linux", "CI/CD", "Observability"
  ]
};