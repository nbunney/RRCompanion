import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BenefitsSection from '@/components/BenefitsSection';

interface RisingStarsPosition {
  fictionId: number;
  title: string;
  authorName: string;
  royalroadId: string;
  imageUrl?: string;
  isOnMain: boolean;
  mainPosition?: number;
  estimatedPosition: number;
  fictionsAhead: number;
  fictionsToClimb: number;
  lastUpdated: string;
  genrePositions: { genre: string; position: number | null; isOnList: boolean; lastScraped: string | null }[];
  fictionsAheadDetails?: { fictionId: number; title: string; authorName: string; royalroadId: string; imageUrl?: string }[];
}

const RisingStarsPositionCalculator: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
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
            <div className="mb-6 flex items-start space-x-4">
              {position.imageUrl && (
                <a
                  href={`/fiction/${position.royalroadId}`}
                  className="flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={position.imageUrl}
                    alt={position.title}
                    className="w-20 h-28 object-cover rounded-lg shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </a>
              )}
              <div className="flex-1">
                <a
                  href={`/fiction/${position.royalroadId}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{position.title}</h2>
                </a>
                <p className="text-gray-600">by {position.authorName}</p>
                <p className="text-sm text-gray-500">Royal Road ID: {position.royalroadId}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Position Display */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  #{position.isOnMain ? position.mainPosition : position.estimatedPosition}
                </div>
                <div className="text-sm text-gray-600">
                  {position.isOnMain ? 'Rising Stars Main Position' : 'Estimated Position'}
                </div>
              </div>

              {/* Status Display */}
              <div className={`text-center p-4 rounded-lg ${position.isOnMain ? 'bg-green-50' : (position.fictionsToClimb === 0 ? 'bg-green-50' : 'bg-red-50')}`}>
                <div className={`text-3xl font-bold mb-2 ${position.isOnMain ? 'text-green-600' : getPositionColor(position.fictionsToClimb)}`}>
                  {position.isOnMain ? '🎉' : position.fictionsToClimb}
                </div>
                <div className="text-sm text-gray-600">
                  {position.isOnMain ? 'Already on Main!' : 'To Reach Main'}
                </div>
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
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Genre Positions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {position.genrePositions
                  .sort((a, b) => {
                    // First, put red X's (not on list) at the front
                    if (!a.isOnList && b.isOnList) return -1;
                    if (a.isOnList && !b.isOnList) return 1;

                    // If both are on list, sort by position (highest to lowest)
                    if (a.isOnList && b.isOnList) {
                      return (b.position || 0) - (a.position || 0);
                    }

                    // If both are not on list, sort alphabetically by genre name
                    return a.genre.localeCompare(b.genre);
                  })
                  .map((genrePos, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-gray-700 capitalize text-xs">
                          {genrePos.genre.replace(/_/g, ' ')}
                        </span>
                        {genrePos.isOnList ? (
                          <>
                            <span className="text-green-600 text-sm">✓</span>
                            <span className="text-xs font-semibold text-green-600">
                              #{genrePos.position}
                            </span>
                          </>
                        ) : (
                          <span className="text-red-600 text-sm">✗</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Fictions Ahead - Only show if within 10 spots of main and not already on main */}
          {!position.isOnMain && position.fictionsToClimb <= 10 && position.fictionsAheadDetails && position.fictionsAheadDetails.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Fictions Ahead of You</h3>
              <p className="text-sm text-gray-600 mb-4">
                You're within {position.fictionsToClimb} spots of Rising Stars Main! Here are some of the fictions ahead of you (excluding those already on Main):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {position.fictionsAheadDetails.slice(0, 20).map((fiction, index) => (
                  <div key={fiction.fictionId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded text-sm hover:bg-gray-100 transition-colors">
                    {fiction.imageUrl && (
                      <a
                        href={`/fiction/${fiction.royalroadId}`}
                        className="flex-shrink-0 hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={fiction.imageUrl}
                          alt={fiction.title}
                          className="w-12 h-16 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </a>
                    )}
                    <div className="flex-1 min-w-0">
                      <a
                        href={`/fiction/${fiction.royalroadId}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        <div className="font-medium text-gray-900 truncate" title={fiction.title}>
                          {fiction.title}
                        </div>
                      </a>
                      <div className="text-xs text-gray-500">
                        by {fiction.authorName}
                      </div>
                    </div>
                    <div className="ml-2 text-xs text-gray-400 flex-shrink-0">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
              {position.fictionsAheadDetails.length > 20 && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Showing first 20 of {position.fictionsAhead} fictions ahead
                </p>
              )}

              {/* Explanatory note */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> If you are at position 52 (for example) you should see 1 fiction listed here.
                  When you are at position 51 then there will be no fictions that are not on RS main ahead of you.
                </p>
              </div>
            </div>
          )}

          {/* Data Freshness */}
          {latestScrape && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Information</h3>
              <div className="text-sm text-gray-600">
                <p>Analysis based on Rising Stars data from: <span className="font-medium">{formatDate(latestScrape)}</span></p>
                <p className="mt-2">Data is updated every 15 minutes a little past each quarter hour.</p>
              </div>
            </div>
          )}

          {/* Benefits to Creating an Account - Only show for non-logged-in users */}
          {!isAuthenticated && <BenefitsSection />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RisingStarsPositionCalculator;
