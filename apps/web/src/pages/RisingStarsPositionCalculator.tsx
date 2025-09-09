import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/services/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface RisingStarsPosition {
  fictionId: number;
  title: string;
  authorName: string;
  royalroadId: string;
  isOnMain: boolean;
  mainPosition?: number;
  estimatedPosition: number;
  fictionsAhead: number;
  fictionsToClimb: number;
  lastUpdated: string;
  genrePositions: { genre: string; position: number | null; isOnList: boolean }[];
}

const RisingStarsPositionCalculator: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [position, setPosition] = useState<RisingStarsPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestScrape, setLatestScrape] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPosition(parseInt(id));
    }
  }, [id]);

  useEffect(() => {
    fetchLatestScrape();
  }, []);

  const fetchLatestScrape = async () => {
    try {
      const response = await fetch('/api/rising-stars-position/latest-scrape');
      const data = await response.json();
      if (data.success) {
        setLatestScrape(data.data.latestScrape);
      }
    } catch (err) {
      console.error('Error fetching latest scrape:', err);
    }
  };

  const fetchPosition = async (fictionId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/rising-stars-position/${fictionId}`);
      const data = response.data;

      if (data.success) {
        setPosition(data.data);
      } else {
        setError(data.error || 'Failed to calculate position');
      }
    } catch (err: any) {
      if (err.response?.data?.error?.includes('not currently on any Rising Stars genre list')) {
        setError(err.response.data.error);
      } else {
        setError(err.response?.data?.error || 'Network error occurred');
      }
      console.error('Error fetching position:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // The dateString from the database is in UTC format (e.g., "2025-09-08T21:17:49.000Z")
    // We need to explicitly parse it as UTC and then convert to local timezone
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getPositionColor = (fictionsToClimb: number) => {
    if (fictionsToClimb === 0) return 'text-green-600';
    if (fictionsToClimb <= 10) return 'text-yellow-600';
    if (fictionsToClimb <= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPositionMessage = (position: RisingStarsPosition) => {
    if (position.isOnMain) {
      return `🎉 Congratulations! Your fiction is already on Rising Stars Main at position #${position.mainPosition}!`;
    }

    if (position.fictionsToClimb === 0) {
      return `🎯 You're right on the edge! Your fiction is at position #${position.estimatedPosition}, just outside the top 50.`;
    }

    return `📈 Your fiction is estimated at position #${position.estimatedPosition}. You need to climb ${position.fictionsToClimb} positions to reach Rising Stars Main.`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Rising Stars Position Calculator" showUserInfo={true} />
        <main className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Rising Stars Data</h2>
                <p className="text-gray-600 mb-4">Processing genre rankings and calculating your fiction's position...</p>
                <div className="flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Rising Stars Position Calculator" showUserInfo={true} />
        <main className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <div className="text-red-600 text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => id && fetchPosition(parseInt(id))}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!position) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Rising Stars Position Calculator" showUserInfo={true} />
        <main className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Rising Stars Position Calculator</h1>
                <p className="text-gray-600">No fiction ID provided or fiction not found.</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Rising Stars Position Calculator" showUserInfo={true} />
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Rising Stars Position Calculator</h1>
            <p className="text-gray-600">Calculate how close your fiction is to making it to Rising Stars Main</p>
          </div>

          {/* Main Results */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{position.title}</h2>
              <p className="text-gray-600">by {position.authorName}</p>
              <p className="text-sm text-gray-500">Royal Road ID: {position.royalroadId}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Estimated Position */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">#{position.estimatedPosition}</div>
                <div className="text-sm text-gray-600">Estimated Position</div>
              </div>

              {/* Fictions Ahead */}
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 mb-2">{position.fictionsAhead}</div>
                <div className="text-sm text-gray-600">Fictions Ahead</div>
              </div>

              {/* Fictions to Climb */}
              <div className={`text-center p-4 rounded-lg ${position.fictionsToClimb === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className={`text-3xl font-bold mb-2 ${getPositionColor(position.fictionsToClimb)}`}>
                  {position.fictionsToClimb}
                </div>
                <div className="text-sm text-gray-600">To Reach Main</div>
              </div>
            </div>

            {/* Status Message */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-lg font-medium text-gray-800">
                {getPositionMessage(position)}
              </p>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Analysis Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${position.isOnMain ? 'text-green-600' : 'text-blue-600'}`}>
                      {position.isOnMain ? 'On Rising Stars Main' : 'Not on Rising Stars Main'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium text-gray-900">{latestScrape ? formatDate(latestScrape) : formatDate(position.lastUpdated)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Genre Positions */}
          {position.genrePositions && position.genrePositions.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Genre Positions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {position.genrePositions.map((genrePos, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {genrePos.genre.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      {genrePos.isOnList ? (
                        <>
                          <span className="text-green-600 text-lg">✓</span>
                          <span className="text-sm font-semibold text-green-600">
                            #{genrePos.position}
                          </span>
                        </>
                      ) : (
                        <span className="text-red-600 text-lg">✗</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Freshness */}
          {latestScrape && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Information</h3>
              <div className="text-sm text-gray-600">
                <p>Analysis based on Rising Stars data from: <span className="font-medium">{formatDate(latestScrape)}</span></p>
                <p className="mt-2">Data is updated every 15 minutes at 1 minute past each quarter hour.</p>
              </div>
            </div>
          )}

          {/* Benefits to Creating an Account */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Benefits to Creating an Account</h3>
              <p className="text-gray-600">Unlock additional features and get the most out of RRCompanion</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-semibold">⭐</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Favorite Fictions</h4>
                    <p className="text-sm text-gray-600">Save your favorite fictions and quickly access them for position calculations</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm font-semibold">📈</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Personal Dashboard</h4>
                    <p className="text-sm text-gray-600">Get personalized insights and recommendations based on your reading habits</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm font-semibold">⚡</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Faster Access</h4>
                    <p className="text-sm text-gray-600">Quick access to position calculations with your saved fictions</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 text-sm font-semibold">🎯</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Advanced Analytics</h4>
                    <p className="text-sm text-gray-600">Access detailed analytics and trends for your favorite fictions</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/register"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Free Account
                </a>
                <a
                  href="/login"
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium border border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Sign In
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-4">Free to join • No credit card required • Cancel anytime</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RisingStarsPositionCalculator;
