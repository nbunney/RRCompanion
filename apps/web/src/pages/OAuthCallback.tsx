import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { userFictionAPI, fictionAPI } from '@/services/api';
import Footer from '@/components/Footer';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const errorParam = searchParams.get('error');
    const fictionId = searchParams.get('fiction_id'); // Get fiction_id

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    if (token) {
      console.log('🔐 OAuth Callback - Token received:', token.substring(0, 20) + '...');
      console.log('🔐 OAuth Callback - Fiction ID:', fictionId);

      // Store the token
      localStorage.setItem('token', token);
      console.log('🔐 OAuth Callback - Token stored in localStorage');

      // Store user data if provided
      if (userParam) {
        try {
          const userData = JSON.parse(userParam);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('🔐 OAuth Callback - User data stored in localStorage:', userData);
        } catch (error) {
          console.error('🔐 OAuth Callback - Failed to parse user data:', error);
        }
      }

      // Check authentication status
      console.log('🔐 OAuth Callback - Calling checkAuth()...');
      checkAuth().then(async () => {
        console.log('🔐 OAuth Callback - checkAuth() succeeded');
        
        // If there's a fiction ID, add it to the user's account
        if (fictionId) {
          try {
            console.log('🔐 OAuth Callback - Looking up fiction by Royal Road ID:', fictionId);
            
            // First, look up the fiction by Royal Road ID to get the internal database ID
            const fictionResponse = await fictionAPI.getFictionByRoyalRoadId(fictionId);
            if (fictionResponse.success && fictionResponse.data) {
              const internalFictionId = fictionResponse.data.id;
              console.log('🔐 OAuth Callback - Found fiction in database, internal ID:', internalFictionId);
              
              try {
                // Try to create the user-fiction relationship using the internal ID
                await userFictionAPI.createUserFiction(internalFictionId, 'plan_to_read');
                console.log('🔐 OAuth Callback - Fiction added successfully to user account');
              } catch (addError: any) {
                // Check if the error is because the fiction is already on the user's list
                if (addError.response?.status === 409 || addError.response?.status === 400) {
                  console.log('🔐 OAuth Callback - Fiction already exists on user list, continuing...');
                } else {
                  console.error('🔐 OAuth Callback - Unexpected error adding fiction:', addError);
                }
              }
              
              // Always redirect back to the fiction page, regardless of whether it was newly added or already existed
              console.log('🔐 OAuth Callback - Redirecting to fiction page');
              navigate(`/fiction/${fictionId}`);
              return;
            } else {
              console.error('🔐 OAuth Callback - Fiction not found in database:', fictionResponse.message);
              // Continue to dashboard if fiction lookup fails
            }
          } catch (error) {
            console.error('🔐 OAuth Callback - Failed to process fiction:', error);
            // Continue to dashboard even if fiction processing fails
          }
        }
        
        // Default redirect to dashboard
        console.log('🔐 OAuth Callback - Navigating to dashboard');
        navigate('/dashboard');
      }).catch((error) => {
        console.error('🔐 OAuth Callback - checkAuth() failed:', error);
        setError('Authentication failed. Please try again.');
      });
    } else {
      console.error('🔐 OAuth Callback - No token received');
      setError('No authentication token received.');
    }
  }, [searchParams, navigate, checkAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Authentication Error
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {error}
              </p>
            </div>
            <div className="text-center">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Completing Authentication
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please wait while we complete your authentication...
            </p>
          </div>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OAuthCallback; 