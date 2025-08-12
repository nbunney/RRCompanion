import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createFictionUrl } from '@/utils';
import { royalroadAPI, userFictionAPI, fictionAPI, risingStarsAPI } from '@/services/api';
import type { RoyalRoadFiction, UserFiction, Fiction } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import Tags from '@/components/Tags';
import { RisingStarsChart, EngagementGrowthChart, PerceivedQualityChart, CurrentStats } from '@/components/charts';
import { formatLocalDate, formatLocalDateTime } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';

const FictionDetail: React.FC = () => {
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [fiction, setFiction] = useState<RoyalRoadFiction | null>(null);
  const [fictionWithHistory, setFictionWithHistory] = useState<Fiction | null>(null);
  const [userFiction, setUserFiction] = useState<UserFiction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [canRefresh, setCanRefresh] = useState(true);
  const [remainingHours, setRemainingHours] = useState<number | null>(null);
  const [showUnfavoriteConfirm, setShowUnfavoriteConfirm] = useState(false);
  const [risingStarsData, setRisingStarsData] = useState<any[]>([]);


  // Check refresh status every minute
  const checkRefreshStatus = useCallback(() => {
    if (!lastRefreshTime) {
      setCanRefresh(true);
      setRemainingHours(null);
      return;
    }

    const now = new Date();
    const timeDiff = now.getTime() - lastRefreshTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff >= 24) {
      setCanRefresh(true);
      setRemainingHours(0);
    } else {
      setCanRefresh(false);
      // Calculate remaining time more precisely
      const remainingTime = 24 - hoursDiff;
      setRemainingHours(remainingTime);
    }
  }, [lastRefreshTime]);

  // Initialize lastRefreshTime from the most recent fictionHistory entry
  useEffect(() => {
    if (fictionWithHistory?.history && fictionWithHistory.history.length > 0) {
      // Find the most recent entry by comparing dates
      const mostRecentEntry = fictionWithHistory.history.reduce((latest, current) => {
        if (!latest.captured_at) return current;
        if (!current.captured_at) return latest;
        return new Date(current.captured_at) > new Date(latest.captured_at) ? current : latest;
      });
      if (mostRecentEntry.captured_at) {
        setLastRefreshTime(new Date(mostRecentEntry.captured_at));
      }
    }
  }, [fictionWithHistory?.history]);

  // Set up interval to check refresh status every minute
  useEffect(() => {
    const interval = setInterval(checkRefreshStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkRefreshStatus]);

  // Initial check when component mounts
  useEffect(() => {
    checkRefreshStatus();
  }, [checkRefreshStatus]);

  // Check authentication when component mounts
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (id) {
      loadFiction();
      loadUserFiction();
    }
  }, [id]);

  useEffect(() => {
    if (fictionWithHistory?.id) {
      loadRisingStarsData();
    }
  }, [fictionWithHistory?.id]);

  const loadFiction = async () => {
    try {
      setIsLoading(true);

      // First, try to load from our database
      let fictionResponse = await fictionAPI.getFictionByRoyalRoadId(id!);

      if (fictionResponse.success && fictionResponse.data) {
        // Store the original response with history data
        console.log('🔗 Fiction response:', fictionResponse.data);
        setFictionWithHistory(fictionResponse.data);

        // Convert our Fiction type to RoyalRoadFiction type for display
        const fiction: RoyalRoadFiction = {
          id: fictionResponse.data.royalroad_id,
          title: fictionResponse.data.title,
          author: {
            name: fictionResponse.data.author_name,
            id: fictionResponse.data.author_id || '',
            avatar: fictionResponse.data.author_avatar,
          },
          description: fictionResponse.data.description || '',
          image: fictionResponse.data.image_url,
          status: fictionResponse.data.status || '',
          type: fictionResponse.data.type || '',
          tags: fictionResponse.data.tags || [],
          warnings: fictionResponse.data.warnings || [],
          stats: {
            pages: fictionResponse.data.pages || 0,
            ratings: fictionResponse.data.ratings || 0,
            followers: fictionResponse.data.followers || 0,
            favorites: fictionResponse.data.favorites || 0,
            views: fictionResponse.data.views || 0,
            score: fictionResponse.data.overall_score || 0,
          },
          chapters: [],
        };
        setFiction(fiction);

        // Redirect to the proper URL with slug if not already there
        const expectedSlug = createFictionUrl(fiction.title, fiction.id).split('/').pop();
        if (slug !== expectedSlug) {
          const properUrl = createFictionUrl(fiction.title, fiction.id);
          navigate(properUrl, { replace: true });
        }
      } else {
        // If not in our database, try to load from Royal Road API
        const royalroadResponse = await royalroadAPI.getFiction(id!);
        if (royalroadResponse.success && royalroadResponse.data) {
          setFiction(royalroadResponse.data);

          // Redirect to the proper URL with slug if not already there
          const expectedSlug = createFictionUrl(royalroadResponse.data.title, royalroadResponse.data.id).split('/').pop();
          if (slug !== expectedSlug) {
            const properUrl = createFictionUrl(royalroadResponse.data.title, royalroadResponse.data.id);
            navigate(properUrl, { replace: true });
          }
        } else {
          setError(royalroadResponse.message || 'Failed to load fiction');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load fiction');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserFiction = async () => {
    try {
      // Check if user has this fiction in their favorites
      const response = await userFictionAPI.getUserFavorites();
      if (response.success && response.data) {
        const userFic = response.data.userFictions.find(uf => uf.fiction?.royalroad_id === id);
        if (userFic) {
          setUserFiction(userFic);
        }
      }
    } catch (err) {
      // Silently fail - user might not have this fiction in their list
    }
  };

  const loadRisingStarsData = async () => {
    if (!fictionWithHistory?.id) return;

    try {
      const response = await risingStarsAPI.getRisingStarsForFiction(fictionWithHistory.id);
      if (response.success && response.data) {
        // Process the data to remove duplicates and simplify dates
        const processedData = processRisingStarsData(response.data);
        setRisingStarsData(processedData);
      }
    } catch (err) {
      console.error('Error loading Rising Stars data:', err);
    }
  };

  // Process Rising Stars data to remove duplicates and simplify dates
  const processRisingStarsData = (data: any[]) => {
    // Create a map to track the latest entry for each genre per day
    const dailyGenreMap = new Map<string, any>();

    data.forEach(entry => {
      // Convert datetime to date only (YYYY-MM-DD format)
      const dateOnly = new Date(entry.captured_at).toISOString().split('T')[0];
      const key = `${dateOnly}-${entry.genre}`;

      // If we already have an entry for this genre on this day, keep the latest one
      if (!dailyGenreMap.has(key) ||
        new Date(entry.captured_at) > new Date(dailyGenreMap.get(key).captured_at)) {
        dailyGenreMap.set(key, {
          ...entry,
          captured_at: dateOnly // Store just the date, not the full datetime
        });
      }
    });

    // Convert map values back to array and sort by date
    return Array.from(dailyGenreMap.values())
      .sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime());
  };

  const handleAddToFavorites = async () => {
    if (!fiction) return;

    try {
      setIsAddingToFavorites(true);

      // First, check if the fiction exists in our database
      let fictionId: number;

      try {
        // Try to get the fiction from our database
        const fictionResponse = await fictionAPI.getFictionByRoyalRoadId(fiction.id);
        if (fictionResponse.success && fictionResponse.data) {
          fictionId = fictionResponse.data.id;
        } else {
          // Fiction doesn't exist in our database, create it
          const createResponse = await fictionAPI.createFiction({
            royalroad_id: fiction.id,
            title: fiction.title,
            author_name: fiction.author.name,
            author_id: fiction.author.id,
            author_avatar: fiction.author.avatar,
            description: fiction.description,
            image_url: fiction.image,
            status: fiction.status,
            type: fiction.type,
            tags: fiction.tags,
            warnings: fiction.warnings,
            pages: fiction.stats.pages,
            ratings: fiction.stats.ratings,
            followers: fiction.stats.followers,
            favorites: fiction.stats.favorites,
            views: fiction.stats.views,
            score: fiction.stats.score,
          });

          if (createResponse.success && createResponse.data) {
            fictionId = createResponse.data.id;
          } else {
            throw new Error('Failed to create fiction');
          }
        }
      } catch (err) {
        throw new Error('Failed to process fiction');
      }

      // Now add to user's favorites
      const response = await userFictionAPI.createUserFiction(fictionId, 'plan_to_read');
      if (response.success && response.data) {
        setUserFiction(response.data);
        // Toggle to favorite
        const toggleResponse = await userFictionAPI.toggleFavorite(fictionId);
        if (toggleResponse.success && toggleResponse.data) {
          setUserFiction(toggleResponse.data);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add to favorites');
    } finally {
      setIsAddingToFavorites(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!userFiction) return;

    // If currently favorited, show confirmation dialog
    if (userFiction.is_favorite) {
      setShowUnfavoriteConfirm(true);
      return;
    }

    // If not favorited, add to favorites directly
    await performToggleFavorite();
  };

  const performToggleFavorite = async () => {
    if (!userFiction) return;

    try {
      setIsAddingToFavorites(true);
      const response = await userFictionAPI.toggleFavorite(userFiction.fiction_id);
      if (response.success && response.data) {
        setUserFiction(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to toggle favorite');
    } finally {
      setIsAddingToFavorites(false);
      setShowUnfavoriteConfirm(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError('');
      const response = await fictionAPI.refreshFiction(id!);
      if (response.success && response.data) {
        // Update the fiction with fresh data
        const updatedFiction: RoyalRoadFiction = {
          id: response.data.royalroad_id,
          title: response.data.title,
          author: {
            name: response.data.author_name,
            id: response.data.author_id || '',
            avatar: response.data.author_avatar,
          },
          description: response.data.description || '',
          image: response.data.image_url,
          status: response.data.status || '',
          type: response.data.type || '',
          tags: response.data.tags || [],
          warnings: response.data.warnings || [],
          stats: {
            pages: response.data.pages || 0,
            ratings: response.data.ratings || 0,
            followers: response.data.followers || 0,
            favorites: response.data.favorites || 0,
            views: response.data.views || 0,
            score: response.data.overall_score || 0,
          },
          chapters: [],
        };
        // Store the original response with history data
        setFictionWithHistory(response.data);
        setFiction(updatedFiction);

        // Update refresh status - use the most recent history entry time
        if (response.data.history && response.data.history.length > 0) {
          // Find the most recent entry by comparing dates
          const mostRecentEntry = response.data.history.reduce((latest, current) => {
            if (!latest.captured_at) return current;
            if (!current.captured_at) return latest;
            return new Date(current.captured_at) > new Date(latest.captured_at) ? current : latest;
          });
          if (mostRecentEntry.captured_at) {
            setLastRefreshTime(new Date(mostRecentEntry.captured_at));
          }
        }
      } else {
        setError(response.message || 'Failed to refresh fiction');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to refresh fiction');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading fiction...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !fiction) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Fiction not found'}</p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        title="Fiction Details"
        showBackButton={true}
        backUrl="/dashboard"
        showUserInfo={true}
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
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{fiction.title}</h1>
                    <p className="text-lg text-gray-600 mb-3">by {fiction.author.name}</p>

                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      {userFiction ? (
                        <Button
                          onClick={handleToggleFavorite}
                          disabled={isAddingToFavorites}
                          variant={userFiction.is_favorite ? "primary" : "outline"}
                        >
                          {isAddingToFavorites ? '...' : (userFiction.is_favorite ? '❤️ Favorited' : '🤍 Add to Favorites')}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleAddToFavorites}
                          disabled={isAddingToFavorites}
                          variant="outline"
                        >
                          {isAddingToFavorites ? 'Adding...' : '🤍 Add to Favorites'}
                        </Button>
                      )}
                      <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing || !canRefresh}
                        variant="outline"
                      >
                        {isRefreshing ? 'Refreshing...' : '🔄 Refresh'}
                      </Button>
                    </div>

                    {/* Sponsored Indicator */}
                    <div className="flex items-center space-x-2 mt-2">
                      {fictionWithHistory?.sponsored ? (
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 border-2 border-green-500 bg-green-500 rounded flex items-center justify-center cursor-help"
                            title="This fiction has been sponsored."
                          >
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600">Sponsored</span>
                        </div>
                      ) : (
                        <button
                          className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-colors cursor-pointer shadow-md hover:shadow-lg"
                          title="Click to sponsor this fiction and enable automatic updates"
                          onClick={() => {
                            console.log('🔗 Navigating to sponsor page for fiction:', fictionWithHistory?.royalroad_id);
                            console.log('🔗 Current URL before navigation:', window.location.pathname);
                            navigate(`/sponsor/${fictionWithHistory?.royalroad_id}`);
                            console.log('🔗 Navigation called, new URL should be:', `/sponsor/${fictionWithHistory?.royalroad_id}`);
                          }}
                        >
                          <span className="w-5 h-5 bg-white text-red-500 rounded-full flex items-center justify-center text-sm font-bold">S</span>
                          <span>Sponsor?</span>
                        </button>
                      )}
                    </div>

                    {/* Last refresh time and countdown - inline with buttons */}
                    {lastRefreshTime && (
                      <div className="text-xs text-gray-500 mt-1">
                        <div>Last refreshed: {formatLocalDateTime(lastRefreshTime, undefined, { hour: '2-digit', minute: '2-digit' })}</div>
                        {!canRefresh && remainingHours !== null && (
                          <div className="mt-1">
                            {remainingHours <= 0 ? (
                              <span className="text-green-600 font-medium">• Can refresh now!</span>
                            ) : remainingHours < 1 ? (
                              <span>• Can refresh in {Math.ceil(remainingHours * 60)} minutes</span>
                            ) : (
                              <span>• Can refresh in {Math.floor(remainingHours)} hours {Math.ceil((remainingHours % 1) * 60)} minutes</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Stats Section - Always Visible */}
                {fictionWithHistory && (
                  <CurrentStats
                    latestHistory={fictionWithHistory.history && fictionWithHistory.history.length > 0 ? fictionWithHistory.history[fictionWithHistory.history.length - 1] : undefined}
                  />
                )}

                {/* Current Charts Section */}
                {fictionWithHistory?.history && fictionWithHistory.history.length > 0 && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      📈 Current Charts
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        (as of {formatLocalDate(fictionWithHistory.history[fictionWithHistory.history.length - 1].captured_at)})
                      </span>
                    </h3>

                    {/* Rising Stars Chart - Only show if we have data */}
                    <RisingStarsChart risingStarsData={risingStarsData} />

                    {/* Chart 1: Engagement & Growth Metrics */}
                    <EngagementGrowthChart history={fictionWithHistory.history || []} />

                    {/* Chart 2: Perceived Quality Metrics */}
                    <PerceivedQualityChart history={fictionWithHistory.history || []} />
                  </div>
                )}

                {/* Description */}
                {fiction.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{fiction.description}</div>
                  </div>
                )}

                {/* Tags, Warnings, Status, and Type */}
                <Tags
                  tags={fiction.tags || []}
                  warnings={fiction.warnings || []}
                  status={fiction.status}
                  type={fiction.type}
                />
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Unfavorite Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showUnfavoriteConfirm}
        title="Remove from Favorites?"
        message={`Are you sure you want to remove "${fiction?.title}" from your favorites? This action cannot be undone.`}
        confirmText="Remove"
        onConfirm={performToggleFavorite}
        onCancel={() => setShowUnfavoriteConfirm(false)}
        isLoading={isAddingToFavorites}
        loadingText="Removing..."
        variant="danger"
      />

      <Footer />
    </div>
  );
};

export default FictionDetail; 