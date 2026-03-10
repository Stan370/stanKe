export enum ProjectCategory {
  SYSTEMS = 'Systems & Infra',
  TOOLS = 'Tools & AI Apps',
  HACKATHON = 'Experiments',
  GAMES = 'Games',
  BLOG = 'Engineering Blog'
}

export interface Metric {
  name: string;
  value: number;
  unit: string;
  description?: string;
}

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  detailedDescription?: string;
  tags: string[];
  imageUrl: string;

  // Systems Specific
  architectureDiagram?: string; // URL
  metrics?: Metric[]; // For Recharts
  techStack?: string[];

  // Hackathon Specific
  hypothesis?: string;
  outcome?: string;

  // Links
  githubUrl?: string;
  demoUrl?: string;
  blogUrl?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}