import { useState, useCallback } from 'react';
import { oauthAPI } from '@/services/api';
import type { OAuthProvider } from '@/types';

export const useOAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);

  const getProviders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await oauthAPI.getProviders();
      if (response.success && response.data) {
        // Filter out Facebook and Apple providers
        const filteredProviders = response.data.filter(
          provider => !['facebook', 'apple'].includes(provider.name.toLowerCase())
        );
        setProviders(filteredProviders);
      } else {
        // If OAuth is disabled, set empty providers array
        setProviders([]);
      }
      return response.data || [];
    } catch (error) {
      console.warn('OAuth providers not available (stubbed):', error);
      // Return empty array instead of throwing error
      setProviders([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initiateOAuth = useCallback(async (provider: string) => {
    try {
      setIsLoading(true);
      const response = await oauthAPI.initiateOAuth(provider);
      if (response.success && response.data) {
        // Redirect to OAuth provider
        window.location.href = response.data.authorizationUrl;
      } else {
        // OAuth is disabled, show message
        alert(`OAuth is currently disabled for ${provider}`);
      }
    } catch (error) {
      console.warn(`OAuth initiation not available for ${provider}:`, error);
      alert(`OAuth is currently disabled for ${provider}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    providers,
    isLoading,
    getProviders,
    initiateOAuth,
  };
}; 