// User types
export interface User {
  id: number;
  email: string;
  name?: string;
  created_at: Date;
  updated_at: Date;
  oauth_provider?: string;
  oauth_id?: string;
  avatar_url?: string;
  admin?: boolean;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
  oauth_provider?: string;
  avatar_url?: string;
  admin?: boolean;
}

// OAuth types
export interface OAuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  provider: 'discord' | 'google' | 'facebook' | 'apple';
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

// Session types
export interface Session {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
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
  sponsored: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFictionRequest {
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
  pages?: number;
  ratings?: number;
  followers?: number;
  favorites?: number;
  views?: number;
  score?: number;
  overall_score?: number;
  style_score?: number;
  story_score?: number;
  grammar_score?: number;
  character_score?: number;
  total_views?: number;
  average_views?: number;
}

export interface UpdateFictionRequest {
  title?: string;
  author_name?: string;
  author_id?: string;
  author_avatar?: string;
  description?: string;
  image_url?: string;
  status?: string;
  type?: string;
  tags?: string[];
  warnings?: string[];
  pages?: number;
  ratings?: number;
  followers?: number;
  favorites?: number;
  views?: number;
  score?: number;
  overall_score?: number;
  style_score?: number;
  story_score?: number;
  grammar_score?: number;
  character_score?: number;
  total_views?: number;
  average_views?: number;
  sponsored?: number;
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
  last_read_at?: Date;
  is_favorite: boolean;
  created_at: Date;
  updated_at: Date;
  // Joined data
  fiction?: Fiction;
  user?: User;
}

export interface CreateUserFictionRequest {
  fiction_id: number;
  status?: UserFictionStatus;
  rating?: number;
  review?: string;
  current_chapter?: number;
  total_chapters?: number;
  is_favorite?: boolean;
}

export interface UpdateUserFictionRequest {
  status?: UserFictionStatus;
  rating?: number;
  review?: string;
  current_chapter?: number;
  total_chapters?: number;
  is_favorite?: boolean;
}

// JWT types
export interface JWTPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Coupon types
export interface CouponCode {
  id: number;
  code: string;
  discount_percent: number;
  expires_at: string;
  created_at: string;
  max_uses: number;
  current_uses: number;
  used: boolean;
  used_by_user_id?: number;
  used_for_fiction_id?: number;
  used_at?: string;
  is_active: boolean;
}

export interface CreateCouponRequest {
  code?: string;
  discount_percent: number;
  expires_in_days: number;
  max_uses: number;
}

export interface UpdateCouponRequest {
  discount_percent?: number;
  expires_at?: string;
  max_uses?: number;
  is_active?: boolean;
}

// Request context types
export interface AuthenticatedContext {
  user: User;
  token: string;
}

// Error types
export interface ApiError {
  status: number;
  message: string;
  code?: string;
}
