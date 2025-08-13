import React, { useEffect } from 'react';
import type { RoyalRoadFiction } from '@/types';
import Card from '@/components/Card';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import OAuthButton from '@/components/OAuthButton';
import { useOAuth } from '@/hooks/useOAuth';

interface PublicFictionViewProps {
  fiction: RoyalRoadFiction;
}

const PublicFictionView: React.FC<PublicFictionViewProps> = ({ fiction }) => {
  const { providers, getProviders, initiateOAuth } = useOAuth();

  useEffect(() => {
    getProviders();
  }, [getProviders]);

  const handleOAuthLogin = async (providerName: string) => {
    try {
      // Pass the fiction ID so it can be added to the user's account after login
      await initiateOAuth(providerName, fiction.id);
    } catch (err: any) {
      console.error('OAuth login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        title="Fiction Details"
        showBackButton={true}
        backUrl="/"
        showUserInfo={false}
        showAboutLink={true}
      />

      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-8">
              {/* Fiction Image */}
              {fiction.image && (
                <div className="flex-shrink-0">
                  <img
                    src={fiction.image}
                    alt={fiction.title}
                    className="w-48 h-72 object-cover rounded-lg shadow-md"
                  />
                </div>
              )}

              {/* Fiction Details */}
              <div className="flex-1">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{fiction.title}</h1>
                  <p className="text-lg text-gray-600 mb-4">by {fiction.author.name}</p>

                  {/* Call to Action */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-blue-900 mb-3">
                      📊 Want detailed stats and insights for this fiction?
                    </h2>
                    <p className="text-blue-800 mb-4">
                      Sign in to access comprehensive analytics, growth charts, Rising Stars rankings,
                      and track your favorite fictions with automatic updates.
                    </p>

                    <div className="space-y-3">
                      <p className="text-sm text-blue-700 font-medium">Choose your login method:</p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        {providers.map((provider) => (
                          <OAuthButton
                            key={provider.name}
                            provider={provider}
                            onClick={() => handleOAuthLogin(provider.name)}
                            className="flex-1"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Basic Fiction Info */}
                  {fiction.description && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {fiction.description}
                      </div>
                    </div>
                  )}

                  {/* Basic Stats Preview */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <p className="font-medium text-gray-900">{fiction.status || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <p className="font-medium text-gray-900">{fiction.type || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Pages:</span>
                        <p className="font-medium text-gray-900">{fiction.stats?.pages?.toLocaleString() || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Rating:</span>
                        <p className="font-medium text-gray-900">{fiction.stats?.score?.toFixed(1) || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {fiction.tags && fiction.tags.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {fiction.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Login Reminder */}
                  <div className="text-center border-t pt-6">
                    <p className="text-gray-600 mb-3">
                      Ready to dive deeper into the data?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {providers.map((provider) => (
                        <OAuthButton
                          key={provider.name}
                          provider={provider}
                          onClick={() => handleOAuthLogin(provider.name)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicFictionView;
