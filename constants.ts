import { Project, ProjectCategory } from './types';

// This data feeds both the UI and the AI Context
export const DISABLED_CURL_IDS = [
  'k8s-auth-system',
  'llm-agent-infra',
  'whisper-trans'
];

export const PORTFOLIO_DATA: Project[] = [
  {
    id: 'league-mbti',
    title: 'League MBTI Analysis',
    category: ProjectCategory.GAMES,
    featured: true,
    description: 'A data-driven web application that analyzes League of Legends players\' MBTI personality types based on champion pools, playstyles, and in-game behavior patterns.',
    detailedDescription: 'League MBTI Analysis is a full-stack analytics platform that connects to the Riot Games API to fetch a player\'s match history and derives their MBTI personality archetype. The system analyzes champion preferences, kill/death patterns, vision control habits, and team-fight participation to map playstyle dimensions onto the MBTI framework.\n\nThe app features a shareable "Year-in-Review" report card rendered via a custom native Canvas 2D pipeline — no third-party capture libraries. A progressive match-fetching architecture provides immediate results while processing the full season\'s data in the background. All game modes are supported: Ranked Solo/Duo, ARAM, and Arena.\n\nBuilt with React + Vite, deployed on Cloudflare Pages. A serialized token-bucket rate limiter with exponential backoff keeps within Riot API limits while maximizing throughput.',
    previewImage: '/league-mbti-preview.png',
    tags: ['Riot API', 'Analytics', 'Canvas', 'React'],
    imageUrl: '/league-mbti-preview.png',
    demoUrl: 'https://league-mbti-analysis.pages.dev/',
    githubUrl: 'https://github.com/Stan370/League-MBTI-Analysis',
    techStack: ['React', 'Vite', 'Riot API', 'Canvas 2D', 'Cloudflare Pages'],
  },
  {
    id: 'reddit-tile-match',
    title: 'Reddit Tile Match',
    category: ProjectCategory.GAMES,
    featured: true,
    description: 'A new version of an old tile-match UGC game, incorporating features like daily challenges, a Reddit scheduler, and an auto-post bot, built using Devvit 0.12.',
    detailedDescription: 'Reddit Tile Match is a modern reimagining of a classic tile-matching game, purpose-built for the Reddit platform using Devvit 0.12. The game introduces daily challenges with a persistent leaderboard, a Reddit scheduler for automated community events, and an auto-post bot that keeps the subreddit active with fresh content.\n\nThe architecture leverages Devvit\'s webview integration for rendering the game client, while server-side logic handles leaderboard state via Redis. A custom scheduler manages daily challenge rotations and community engagement posts, creating a self-sustaining game ecosystem within the Reddit platform.',
    tags: ['Devvit', 'Reddit API', 'React'],
    imageUrl: '/splash-background.png',
    demoUrl: 'https://www.reddit.com/r/TileMatch/',
    techStack: ['Devvit', 'Redis', 'React', 'Reddit API'],
  },

  {
    id: 'klotski',
    title: 'Klotski / 华容道',
    category: ProjectCategory.GAMES,
    description: 'An interactive puzzle game with real-time leaderboards and multi-language support. Implemented complex grid logic and collision detection in TypeScript. Integrated Redis for optimized leaderboard management and resolved ESM/CommonJS compatibility issues for Devvit/Webview integration.',
    tags: ['TypeScript', 'Redis', 'Devvit', 'Puzzles'],
    imageUrl: 'https://picsum.photos/800/406',
    githubUrl: 'https://github.com/Stan370/Klotski',
    demoUrl: 'https://stan370.github.io/Klotski/',
    techStack: ['TypeScript', 'Redis', 'Devvit', 'SVGs'],
    featured: false
  },
  // --- SYSTEMS & INFRA ---
  {
    id: 'k8s-auth-system',
    title: 'Exploring Linux Through Docker Containers',
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
    blogUrl: 'https://stan370.github.io/2024/06/14/Dockerlinux/'
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
    githubUrl: 'https://stan370.github.io'
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
    githubUrl: 'https://github.com/Stan370/TonyChat',
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
    "Golang", "Python", "Node.js", "RESTful", "Socket", "Auth", "Microservices", "Concurrency", "Distributed Systems",
    "LLM Integration", "Agent harness", "Whisper ASR",
    "TypeScript", "React", "Next.js", "Cloudflare", "TailwindCSS",
    "Docker", "Linux", "CI/CD", "Observability"
  ]
};