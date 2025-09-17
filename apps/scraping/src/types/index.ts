// Core types for the serverless scraping project
export interface ScrapingEvent {
  scrapingType: 'rising-stars-main' | 'rising-stars-all' | 'fiction' | 'fiction-history' | 'campaigns' | 'retention';
  fictionId?: string;
  royalroadId?: string;
  userId?: string;
  batchSize?: number;
  offset?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface ScrapingResponse {
  success: boolean;
  data?: any;
  error?: string;
  processedCount?: number;
  totalCount?: number;
  nextOffset?: number;
  hasMore?: boolean;
  executionTime?: number;
}

export interface RoyalRoadFiction {
  id: string;
  title: string;
  author: {
    name: string;
    id: string;
    avatar?: string;
  };
  description: string;
  image?: string;
  status: string;
  tags: string[];
  stats: {
    pages: number;
    ratings: number;
    followers: number;
    favorites: number;
    views: number;
    score: number;
    overall_score: number;
    style_score: number;
    story_score: number;
    grammar_score: number;
    character_score: number;
    total_views: number;
    average_views: number;
  };
  chapters: RoyalRoadChapter[];
  warnings: string[];
  type: string;
}

export interface RoyalRoadChapter {
  id: string;
  title: string;
  url: string;
  date: string;
  views: number;
  words: number;
}

export interface RisingStarEntry {
  id?: number;
  fiction_id: number;
  genre: string;
  position: number;
  captured_at?: string;
  title?: string;
  author_name?: string;
  royalroad_id?: string;
}

export interface FictionHistoryEntry {
  fiction_id: number;
  pages: number;
  ratings: number;
  followers: number;
  favorites: number;
  views: number;
  score: number;
  captured_at: string;
}

export interface CampaignData {
  campaignId: string;
  title: string;
  status: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  userId: string;
  captured_at: string;
}

export interface RetentionData {
  fictionId: string;
  userId: string;
  day1: number;
  day3: number;
  day7: number;
  day14: number;
  day30: number;
  captured_at: string;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export interface ScrapingConfig {
  baseUrl: string;
  userAgent: string;
  requestDelay: number;
  maxRetries: number;
  timeout: number;
  batchSize: number;
  concurrentRequests: number;
}
