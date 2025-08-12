// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User types
export interface User {
  id: number;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
  oauth_provider?: string;
  avatar_url?: string;
  admin?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// OAuth types
export interface OAuthProvider {
  name: string;
  displayName: string;
  color: string;
  icon: string;
  enabled?: boolean;
}

export interface OAuthInitiationResponse {
  authorizationUrl: string;
  state: string;
}

// Fiction types
export interface Fiction {
  id: number;
  royalroad_id: string;
  title: string;
  author_name: string;
  author_id?: string;
  author_avatar?: string;
  description?: string;
  image_url?: string;
  status?: string;
  type?: string;
  tags?: string[];
  warnings?: string[];
  pages: number;
  ratings: number;
  followers: number;
  favorites: number;
  views: number;
  score: number;
  overall_score: number;
  sponsored: number;
  created_at: string;
  updated_at: string;
  history?: FictionHistoryEntry[];
}

// Fiction History types
export interface FictionHistoryEntry {
  id?: number;
  fiction_id: number;
  royalroad_id: string;
  description?: string;
  status?: string;
  type?: string;
  tags?: any;
  warnings?: any;
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
  captured_at?: string;
}

// UserFiction types
export type UserFictionStatus = 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';

export interface UserFiction {
  id: number;
  user_id: number;
  fiction_id: number;
  status: UserFictionStatus;
  rating?: number;
  review?: string;
  current_chapter: number;
  total_chapters: number;
  last_read_at?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  fiction?: Fiction;
  user?: User;
}

// RoyalRoad types
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

export interface RoyalRoadUser {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
  joinDate: string;
  lastSeen: string;
  stats: {
    followers: number;
    following: number;
    fictions: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  name?: string;
}

export interface UpdateProfileForm {
  name?: string;
  email?: string;
}

// Auth state
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Component props
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

// Navigation
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
} 