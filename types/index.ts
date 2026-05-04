export interface TwitterProfile {
  id: string;
  name: string;
  userName: string;
  followers: number;
  following: number;
  favouritesCount: number;
  statusesCount: number;
  isBlueVerified: boolean;
  createdAt: string;
  description?: string;
  profilePicture?: string;
  bannerPicture?: string;
  location?: string;
  url?: string;
}

export interface Tweet {
  id: string;
  text: string;
  likes: number;
  retweets: number;
  replies: number;
  impressions?: number;
  createdAt: string;
}

export interface StartupIdea {
  name: string;
  description: string;
  why_it_fits: string;
}

export interface FounderAnalysis {
  founder_score: number;
  founder_archetype: string;
  tagline: string;
  strengths: string[];
  weaknesses: string[];
  ideal_cofounder_type: string;
  cofounder_why: string;
  cofounder_skills: string[];
  roast: string;
  rarity: string;
  vibe_check: string;
  investor_verdict: string;
  startup_ideas: StartupIdea[];
}

export type DataSource = "live" | "syndication" | "ai_only";

export interface AnalysisResult {
  profile: TwitterProfile;
  tweets: Tweet[];
  analysis: FounderAnalysis;
  dataSource?: DataSource;
}
