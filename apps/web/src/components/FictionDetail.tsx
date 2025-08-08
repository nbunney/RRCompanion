import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { royalroadAPI, userFictionAPI, fictionAPI } from '@/services/api';
import type { RoyalRoadFiction, UserFiction } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Footer from '@/components/Footer';

const FictionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fiction, setFiction] = useState<RoyalRoadFiction | null>(null);
  const [userFiction, setUserFiction] = useState<UserFiction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [refreshMessage, setRefreshMessage] = useState('');

  useEffect(() => {
    if (id) {
      loadFiction();
      loadUserFiction();
      checkRefreshStatus();
    }
  }, [id]);

  const checkRefreshStatus = () => {
    const lastRefresh = localStorage.getItem(`fiction_refresh_${id}`);
    if (lastRefresh) {
      const lastRefreshDate = new Date(lastRefresh);
      const now = new Date();
      const timeDiff = now.getTime() - lastRefreshDate.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        setLastRefreshTime(lastRefreshDate);
        const remainingHours = Math.floor(24 - hoursDiff);
        const hoursAgo = Math.floor(hoursDiff);

        if (hoursAgo === 0) {
          setRefreshMessage(`Refreshed recently. Can refresh again in ${remainingHours} hours.`);
        } else if (hoursAgo === 1) {
          setRefreshMessage(`Refreshed 1 hour ago. Can refresh again in ${remainingHours} hours.`);
        } else {
          setRefreshMessage(`Refreshed ${hoursAgo} hours ago. Can refresh again in ${remainingHours} hours.`);
        }
      }
    }
  };

  const canRefresh = () => {
    if (!lastRefreshTime) return true;
    const now = new Date();
    const timeDiff = now.getTime() - lastRefreshTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    return hoursDiff >= 24;
  };

  const loadFiction = async () => {
    try {
      setIsLoading(true);

      // First, try to load from our database
      let fictionResponse = await fictionAPI.getFictionByRoyalRoadId(id!);

      if (fictionResponse.success && fictionResponse.data) {
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
            score: fictionResponse.data.score || 0,
          },
          chapters: [],
        };
        setFiction(fiction);
      } else {
        // If not in our database, try to load from Royal Road API
        const royalroadResponse = await royalroadAPI.getFiction(id!);
        if (royalroadResponse.success && royalroadResponse.data) {
          setFiction(royalroadResponse.data);
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
            score: response.data.score || 0,
          },
          chapters: [],
        };
        setFiction(updatedFiction);

        // Update refresh status
        const now = new Date();
        localStorage.setItem(`fiction_refresh_${id}`, now.toISOString());
        setLastRefreshTime(now);
        setRefreshMessage('✅ Fiction refreshed successfully!');

        // Clear the message after 3 seconds
        setTimeout(() => {
          setRefreshMessage('');
        }, 3000);
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
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                ← Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 ml-4">
                Fiction Details
              </h1>
            </div>
          </div>
        </div>
      </nav>

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
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{fiction.title}</h1>
                    <p className="text-lg text-gray-600 mb-4">by {fiction.author.name}</p>
                  </div>
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
                      disabled={isRefreshing || !canRefresh()}
                      variant="outline"
                    >
                      {isRefreshing ? 'Refreshing...' : '🔄 Refresh'}
                    </Button>
                  </div>
                </div>

                {/* Refresh Message */}
                {refreshMessage && !canRefresh() && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-gray-600 text-sm flex items-center">
                      <span className="mr-2">⏰</span>
                      {refreshMessage}
                    </p>
                  </div>
                )}

                {/* Description */}
                {fiction.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{fiction.description}</div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {typeof fiction.stats.followers === 'number' ? fiction.stats.followers.toLocaleString() : '0'}
                    </div>
                    <div className="text-sm text-gray-500">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {typeof fiction.stats.score === 'number' ? fiction.stats.score.toFixed(1) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {typeof fiction.stats.views === 'number' ? fiction.stats.views.toLocaleString() : '0'}
                    </div>
                    <div className="text-sm text-gray-500">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {typeof fiction.stats.pages === 'number' ? fiction.stats.pages.toLocaleString() : '0'}
                    </div>
                    <div className="text-sm text-gray-500">Pages</div>
                  </div>
                </div>

                {/* Tags */}
                {fiction.tags && fiction.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {fiction.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {fiction.warnings && fiction.warnings.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Warnings</h3>
                    <div className="flex flex-wrap gap-2">
                      {fiction.warnings
                        .filter((warning) => warning && warning.trim() !== '')
                        .map((warning, index) => (
                          <span
                            key={`warning-${index}-${warning}`}
                            className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full"
                          >
                            {warning}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Status and Type */}
                <div className="flex space-x-4 text-sm text-gray-600">
                  <span>Status: <span className="font-semibold">{fiction.status}</span></span>
                  <span>Type: <span className="font-semibold">{fiction.type}</span></span>
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

export default FictionDetail; 