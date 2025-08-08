import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Footer from '@/components/Footer';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    if (token) {
      // Store the token
      localStorage.setItem('token', token);
      
      // Check authentication status
      checkAuth().then(() => {
        navigate('/dashboard');
      }).catch((err) => {
        setError('Authentication failed. Please try again.');
      });
    } else {
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