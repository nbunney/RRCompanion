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
}

const RisingStarsPositionCalculator: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [position, setPosition] = useState<RisingStarsPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
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
    setRateLimited(false);

    try {
      const response = await api.get(`/rising-stars-position/${fictionId}`);
      const data = response.data;

      if (data.success) {
        setPosition(data.data);
      } else {
        setError(data.error || 'Failed to calculate position');
      }
    } catch (err: any) {
      if (err.response?.data?.error?.includes('Rate limited')) {
        setRateLimited(true);
        const match = err.response.data.error.match(/(\d+) seconds/);
        if (match) {
          setRemainingTime(parseInt(match[1]));
          startCountdown(parseInt(match[1]));
        }
        setError('Analysis in progress. Please wait before requesting again.');
      } else if (err.response?.data?.error?.includes('not currently on any Rising Stars genre list')) {
        setError(err.response.data.error);
      } else {
        setError(err.response?.data?.error || 'Network error occurred');
      }
      console.error('Error fetching position:', err);
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = (seconds: number) => {
    setRemainingTime(seconds);
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setRateLimited(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
        <Header title="Rising Stars Position Calculator" />
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
        <Header title="Rising Stars Position Calculator" />
        <main className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                {rateLimited ? (
                  <>
                    <div className="text-yellow-600 text-6xl mb-4">⏳</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Analysis in Progress</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <p className="text-yellow-800 font-medium">
                        Please wait {remainingTime} seconds before requesting again
                      </p>
                    </div>
                    <button
                      onClick={() => id && fetchPosition(parseInt(id))}
                      disabled={rateLimited}
                      className="bg-gray-400 text-white px-6 py-2 rounded-lg cursor-not-allowed"
                    >
                      Analysis in Progress...
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                      onClick={() => id && fetchPosition(parseInt(id))}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </>
                )}
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
        <Header title="Rising Stars Position Calculator" />
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
      <Header title="Rising Stars Position Calculator" />
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
                    <span className="font-medium text-gray-900">{formatDate(position.lastUpdated)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RisingStarsPositionCalculator;
