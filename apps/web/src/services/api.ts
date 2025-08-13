import axios from 'axios';
import type { ApiResponse, AuthResponse, User, LoginForm, RegisterForm, UpdateProfileForm, OAuthProvider, OAuthInitiationResponse, RoyalRoadFiction, RoyalRoadUser, Fiction, UserFiction } from '@/types';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔐 Request interceptor - Token from localStorage:', token ? 'EXISTS' : 'NOT FOUND');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Request interceptor - Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('🔐 Request interceptor - No token found, request will be sent without Authorization header');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on auth pages or fiction pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && 
          !currentPath.includes('/register') && 
          !currentPath.includes('/fiction/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    // Enhance error messages for better user experience
    if (error.response?.data?.error) {
      // Use the server-provided error message
      error.userMessage = error.response.data.error;
    } else if (error.response?.status === 503) {
      error.userMessage = 'Service temporarily unavailable. Please try again later.';
    } else if (error.response?.status === 500) {
      error.userMessage = 'An unexpected error occurred. Please try again later.';
    } else if (error.response?.status === 429) {
      error.userMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.response?.status === 0 || error.code === 'NETWORK_ERROR') {
      error.userMessage = 'Network error. Please check your connection and try again.';
    } else {
      error.userMessage = 'An error occurred. Please try again.';
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: RegisterForm): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginForm): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileForm): Promise<ApiResponse<User>> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
};

// OAuth API
export const oauthAPI = {
  getProviders: async (): Promise<ApiResponse<OAuthProvider[]>> => {
    const response = await api.get('/oauth/providers');
    return response.data;
  },

  initiateOAuth: async (provider: string): Promise<ApiResponse<OAuthInitiationResponse>> => {
    const response = await api.get(`/oauth/${provider}/initiate`);
    return response.data;
  },
};

// Fiction API
export const fictionAPI = {
  getFictions: async (page = 1, limit = 20): Promise<ApiResponse<{ fictions: Fiction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> => {
    const response = await api.get(`/fictions?page=${page}&limit=${limit}`);
    return response.data;
  },

  getFictionByRoyalRoadId: async (id: string): Promise<ApiResponse<Fiction>> => {
    const response = await api.get(`/fictions/${id}`);
    return response.data;
  },

  createFiction: async (fictionData: any): Promise<ApiResponse<Fiction>> => {
    const response = await api.post('/fictions', fictionData);
    return response.data;
  },

  refreshFiction: async (id: string): Promise<ApiResponse<Fiction>> => {
    const response = await api.post(`/fictions/${id}/refresh`);
    return response.data;
  },

  searchFictions: async (query: string, page = 1, limit = 20): Promise<ApiResponse<{ fictions: Fiction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> => {
    const response = await api.get(`/fictions/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  },

  getTopFictions: async (limit = 10): Promise<ApiResponse<Fiction[]>> => {
    const response = await api.get(`/fictions/top?limit=${limit}`);
    return response.data;
  },

  getPopularFictions: async (limit = 10): Promise<ApiResponse<Fiction[]>> => {
    const response = await api.get(`/fictions/popular?limit=${limit}`);
    return response.data;
  },
};

// UserFiction API
export const userFictionAPI = {
  getUserFictions: async (page = 1, limit = 20): Promise<ApiResponse<{ userFictions: UserFiction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> => {
    const response = await api.get(`/userFictions?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUserFictionsByStatus: async (status: string, page = 1, limit = 20): Promise<ApiResponse<{ userFictions: UserFiction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> => {
    const response = await api.get(`/userFictions/status/${status}?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUserFavorites: async (page = 1, limit = 20): Promise<ApiResponse<{ userFictions: UserFiction[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> => {
    const response = await api.get(`/userFictions/favorites?page=${page}&limit=${limit}`);
    return response.data;
  },

  getAllUserFictions: async (): Promise<ApiResponse<UserFiction[]>> => {
    const response = await api.get('/userFictions/all');
    return response.data;
  },

  getUserReadingStats: async (): Promise<ApiResponse<{ totalFictions: number; reading: number; completed: number; onHold: number; dropped: number; planToRead: number; favorites: number }>> => {
    const response = await api.get('/userFictions/stats');
    return response.data;
  },

  createUserFiction: async (fictionId: number, status = 'plan_to_read'): Promise<ApiResponse<UserFiction>> => {
    const response = await api.post('/userFictions', { fiction_id: fictionId, status });
    return response.data;
  },

  updateUserFiction: async (fictionId: number, data: any): Promise<ApiResponse<UserFiction>> => {
    const response = await api.put(`/userFictions/${fictionId}`, data);
    return response.data;
  },

  deleteUserFiction: async (fictionId: number): Promise<ApiResponse> => {
    const response = await api.delete(`/userFictions/${fictionId}`);
    return response.data;
  },

  toggleFavorite: async (fictionId: number): Promise<ApiResponse<UserFiction>> => {
    const response = await api.post(`/userFictions/${fictionId}/favorite`);
    return response.data;
  },

  removeFiction: async (fictionId: number): Promise<ApiResponse> => {
    const response = await api.delete(`/userFictions/${fictionId}`);
    return response.data;
  },

  updateReadingProgress: async (fictionId: number, currentChapter: number, totalChapters?: number): Promise<ApiResponse<UserFiction>> => {
    const response = await api.put(`/userFictions/${fictionId}/progress`, { currentChapter, totalChapters });
    return response.data;
  },

  reorderFavorites: async (fictionIds: number[]): Promise<ApiResponse> => {
    const response = await api.post('/userFictions/favorites/reorder', { fictionIds });
    return response.data;
  },
};

// RoyalRoad API
export const royalroadAPI = {
  getPopularFictions: async (): Promise<ApiResponse<RoyalRoadFiction[]>> => {
    const response = await api.get('/royalroad/popular');
    return response.data;
  },

  getFiction: async (id: string): Promise<ApiResponse<RoyalRoadFiction>> => {
    const response = await api.get(`/royalroad/fiction/${id}`);
    return response.data;
  },

  addFictionByUrl: async (url: string): Promise<ApiResponse<RoyalRoadFiction>> => {
    const response = await api.post('/royalroad/add-fiction', { url });
    return response.data;
  },

  getUserProfile: async (username: string): Promise<ApiResponse<RoyalRoadUser>> => {
    const response = await api.get(`/royalroad/user/${username}`);
    return response.data;
  },
};

// Rising Stars API
export const risingStarsAPI = {
  getRisingStars: async (genre?: string, startDate?: string, endDate?: string): Promise<ApiResponse<any[]>> => {
    const params = new URLSearchParams();
    if (genre) params.append('genre', genre);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/rising-stars?${params.toString()}`);
    return response.data;
  },

  getLatestRisingStars: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/rising-stars/latest');
    return response.data;
  },

  getRisingStarsForFiction: async (fictionId: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/rising-stars/fiction/${fictionId}`);
    return response.data;
  },
};

// Stripe API
export const stripeAPI = {
  createSponsorshipPayment: async (fictionId: number): Promise<ApiResponse<{ clientSecret: string; paymentIntentId: string }>> => {
    const response = await api.post('/stripe/create-payment', { fictionId });
    return response.data;
  },

  getPaymentStatus: async (paymentIntentId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/stripe/payment-status?paymentIntentId=${paymentIntentId}`);
    return response.data;
  },
};

// Health check
export const healthAPI = {
  check: async (): Promise<ApiResponse> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api; 