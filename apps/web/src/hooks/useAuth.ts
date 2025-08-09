import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/services/api';
import type { AuthState, User, LoginForm, RegisterForm, UpdateProfileForm } from '@/types';

interface AuthStore extends AuthState {
  login: (data: LoginForm) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileForm) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (data: LoginForm) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login(data);
          if (response.success && response.data) {
            const { user, token } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.error || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterForm) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.register(data);
          if (response.success && response.data) {
            const { user, token } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.error || 'Registration failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateProfile: async (data: UpdateProfileForm) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.updateProfile(data);
          if (response.success && response.data) {
            const updatedUser = response.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            set({
              user: updatedUser,
              isLoading: false,
            });
          } else {
            throw new Error(response.error || 'Profile update failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      checkAuth: async () => {
        console.log('🔐 checkAuth - Starting authentication check...');
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        console.log('🔐 checkAuth - Token exists:', !!token);
        console.log('🔐 checkAuth - User string exists:', !!userStr);

        if (!token || !userStr) {
          console.log('🔐 checkAuth - Missing token or user, clearing auth state');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        try {
          const user: User = JSON.parse(userStr);
          console.log('🔐 checkAuth - Parsed user:', user);
          
          console.log('🔐 checkAuth - Setting authentication state...');
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          console.log('🔐 checkAuth - Authentication state set successfully');

          // Verify token is still valid
          console.log('🔐 checkAuth - Verifying token with getProfile()...');
          await authAPI.getProfile();
          console.log('🔐 checkAuth - Token verification successful');
        } catch (error) {
          console.error('🔐 checkAuth - Token verification failed:', error);
          // Token is invalid, clear auth state
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 