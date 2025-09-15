import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import api from '@/services/api';

interface RisingStarsMainEntry {
  position: number;
  fictionId: number;
  title: string;
  authorName: string;
  royalroadId: string;
  imageUrl?: string;
  daysOnList: number;
  lastMove: 'up' | 'down' | 'same' | 'new';
  lastPosition?: number;
  lastMoveDate?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

const RisingStarsMain: React.FC = () => {
  const {
    data: response,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['rising-stars-main'],
    queryFn: async () => {
      const response = await api.get('/rising-stars-main');
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to fetch Rising Stars Main data');
      }
    },
    staleTime: 60 * 1000, // 1 minute - data is fresh for 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 minutes
    refetchInterval: 60 * 1000, // Refetch every 1 minute
    retry: 3,
    retryDelay: 1000
  });

  const entries = response?.data || [];
  const lastUpdated = response ? new Date().toISOString() : null;

  const getMovementIcon = (lastMove: string) => {
    switch (lastMove) {
      case 'up':
        return <span className="text-green-600 font-bold">↑</span>;
      case 'down':
        return <span className="text-red-600 font-bold">↓</span>;
      case 'same':
        return <span className="text-gray-500">—</span>;
      case 'new':
        return <span className="text-blue-600 font-bold">NEW</span>;
      default:
        return <span className="text-gray-500">—</span>;
    }
  };

  const getMovementText = (lastMove: string, lastPosition?: number) => {
    switch (lastMove) {
      case 'up':
        return `Moved up<br />from #${lastPosition}`;
      case 'down':
        return `Moved down<br />from #${lastPosition}`;
      case 'same':
        return 'No change';
      case 'new':
        return 'New to Rising Stars Main';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();

    // Handle negative time (future dates) - likely timezone issue
    if (diffInMs < 0) {
      // If the difference is more than 1 hour in the future, it's likely a timezone issue
      // In that case, treat it as "Just now" since the movement just happened
      const absDiffInHours = Math.abs(diffInMs) / (1000 * 60 * 60);
      if (absDiffInHours > 1) {
        console.warn('Large timezone difference detected:', {
          dateString,
          now: now.toISOString(),
          date: date.toISOString(),
          diffInHours: absDiffInHours
        });
        return 'Just now';
      }
    }

    const diffInMinutes = Math.floor(Math.abs(diffInMs) / (1000 * 60));
    const diffInHours = Math.floor(Math.abs(diffInMs) / (1000 * 60 * 60));
    const diffInDays = Math.floor(Math.abs(diffInMs) / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Rising Stars Main" showUserInfo={true} />
        <main className="py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Rising Stars Main</h2>
                <p className="text-gray-600">Fetching the latest Rising Stars Main list...</p>
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
        <Header title="Rising Stars Main" showUserInfo={true} />
        <main className="py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <div className="text-red-600 text-6xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
                <p className="text-gray-600 mb-6">{error?.message || 'An error occurred'}</p>
                <button
                  onClick={() => refetch()}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Rising Stars Main" showUserInfo={true} />
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Rising Stars Main</h1>
            <p className="text-gray-600 mb-4">
              The top 50 fictions currently featured on Royal Road's Rising Stars Main page
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {formatDate(lastUpdated)}
              </p>
            )}
          </div>

          {/* Rising Stars Main List */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Current Rising Stars Main List</h2>
            </div>

            {/* Column Headers */}
            <div className="px-6 py-3 bg-gray-100 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 text-center">
                  <div className="text-sm font-semibold text-gray-700">Position</div>
                </div>
                <div className="flex-shrink-0">
                  <div className="text-sm font-semibold text-gray-700">Fiction</div>
                </div>
                <div className="flex-1"></div>
                <div className="w-20 text-center">
                  <div className="text-sm font-semibold text-gray-700">Days</div>
                </div>
                <div className="w-32 text-center">
                  <div className="text-sm font-semibold text-gray-700">Movement</div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {entries.map((entry: RisingStarsMainEntry) => (
                <div key={entry.fictionId} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    {/* Position */}
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        #{entry.position}
                      </div>
                    </div>

                    {/* Image */}
                    <div className="flex-shrink-0">
                      <a
                        href={`https://www.royalroad.com/fiction/${entry.royalroadId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-80 transition-opacity"
                      >
                        {entry.imageUrl ? (
                          <img
                            src={entry.imageUrl}
                            alt={entry.title}
                            className="w-16 h-20 object-cover rounded-lg shadow-md"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-20 bg-gray-200 rounded-lg shadow-md flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </a>
                    </div>

                    {/* Title and Author */}
                    <div className="flex-1 min-w-0">
                      <a
                        href={`https://www.royalroad.com/fiction/${entry.royalroadId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {entry.title}
                        </h3>
                      </a>
                      <p className="text-sm text-gray-600">by {entry.authorName}</p>
                    </div>

                    {/* Days on List */}
                    <div className="w-20 text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {entry.daysOnList}
                      </div>
                    </div>

                    {/* Movement */}
                    <div className="w-32 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <div className="flex items-center justify-center space-x-1">
                          {getMovementIcon(entry.lastMove)}
                          <span
                            className="text-xs text-gray-600"
                            dangerouslySetInnerHTML={{ __html: getMovementText(entry.lastMove, entry.lastPosition) }}
                          />
                        </div>
                        {entry.lastMoveDate && entry.lastMove !== 'new' && (
                          <div className="text-xs text-gray-400">
                            {getTimeAgo(entry.lastMoveDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {entries.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No Rising Stars Main data available
              </div>
            )}
          </div>

          {/* Data Information */}
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Data</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• Data is updated every 15 minutes at 1 minute past each quarter hour</p>
              <p>• Movement arrows show changes from the previous day</p>
              <p>• "Days on List" counts consecutive days on Rising Stars Main</p>
              <p>• Click on any fiction to visit its Royal Road page</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RisingStarsMain;
