import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Footer from '@/components/Footer';

const OAuthError: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Authentication Failed
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {error || 'An error occurred during authentication. Please try again.'}
            </p>
          </div>
          <div className="text-center space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Back to Login
            </button>
            <div>
              <button
                onClick={() => navigate('/register')}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Create a new account
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OAuthError; 