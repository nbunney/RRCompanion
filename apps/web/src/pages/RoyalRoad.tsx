import React, { useState, useEffect } from 'react';
import { royalroadAPI } from '@/services/api';
import type { RoyalRoadFiction } from '@/types';
import Card from '@/components/Card';
import Footer from '@/components/Footer';

const RoyalRoad: React.FC = () => {
  const [popularFictions, setPopularFictions] = useState<RoyalRoadFiction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPopularFictions();
  }, []);

  const loadPopularFictions = async () => {
    try {
      setIsLoading(true);
      const response = await royalroadAPI.getPopularFictions();
      if (response.success && response.data) {
        setPopularFictions(response.data);
      } else {
        setError(response.message || 'Failed to load popular fictions');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load popular fictions');
    } finally {
      setIsLoading(false);
    }
  };

  const FictionCard: React.FC<{ fiction: RoyalRoadFiction }> = ({ fiction }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex space-x-4">
        {fiction.image && (
          <img
            src={fiction.image}
            alt={fiction.title}
            className="w-16 h-24 object-cover rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {fiction.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            by {fiction.author.name}
          </p>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {fiction.description}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Status: {fiction.status}</span>
            <span>Followers: {fiction.stats.followers.toLocaleString()}</span>
            <span>Score: {fiction.stats.score.toFixed(1)}</span>
          </div>
          {fiction.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {fiction.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                RoyalRoad Companion
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Popular Fictions */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Popular Fictions
            </h2>
            {isLoading && popularFictions.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading popular fictions...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {popularFictions.map((fiction) => (
                  <FictionCard key={fiction.id} fiction={fiction} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RoyalRoad; 