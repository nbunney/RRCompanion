import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createFictionUrl } from '@/utils';
import { royalroadAPI, userFictionAPI, fictionAPI, risingStarsAPI } from '@/services/api';
import type { RoyalRoadFiction, UserFiction, Fiction } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Footer from '@/components/Footer';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const FictionDetail: React.FC = () => {
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
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
  const [showCurrentCharts, setShowCurrentCharts] = useState(false);
  const [showUnfavoriteConfirm, setShowUnfavoriteConfirm] = useState(false);
  const [risingStarsData, setRisingStarsData] = useState<any[]>([]);
  const [isLoadingRisingStars, setIsLoadingRisingStars] = useState(false);

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
      const mostRecentEntry = fictionWithHistory.history[0]; // History is ordered by captured_at DESC
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
      setIsLoadingRisingStars(true);
      const response = await risingStarsAPI.getRisingStarsForFiction(fictionWithHistory.id);
      if (response.success && response.data) {
        setRisingStarsData(response.data);
      }
    } catch (err) {
      console.error('Error loading Rising Stars data:', err);
    } finally {
      setIsLoadingRisingStars(false);
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

        // Update refresh status
        setLastRefreshTime(new Date());
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
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{fiction.title}</h1>
                    <p className="text-lg text-gray-600 mb-3">by {fiction.author.name}</p>
                    {/* Current Charts Toggle Button - positioned under author name on mobile, to the right on desktop */}
                    {fictionWithHistory?.history && fictionWithHistory.history.length > 0 && (
                      <div className="lg:hidden mb-4">
                        <Button
                          onClick={() => setShowCurrentCharts(!showCurrentCharts)}
                          variant="outline"
                          size="sm"
                          className="w-fit"
                        >
                          {showCurrentCharts ? '📈 Hide Current Charts' : '📈 Show Current Charts'}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    {/* Current Charts Toggle Button - desktop version */}
                    {fictionWithHistory?.history && fictionWithHistory.history.length > 0 && (
                      <div className="hidden lg:block mb-2">
                        <Button
                          onClick={() => setShowCurrentCharts(!showCurrentCharts)}
                          variant="outline"
                          size="sm"
                          className="w-fit"
                        >
                          {showCurrentCharts ? '📈 Hide Current Charts' : '📈 Show Current Charts'}
                        </Button>
                      </div>
                    )}
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
                      <div className="flex items-center space-x-2">
                        {fictionWithHistory?.sponsored ? (
                          <div
                            className="w-4 h-4 border-2 border-green-500 bg-green-500 rounded flex items-center justify-center cursor-help"
                            title="This fiction has been sponsored."
                          >
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <button
                            className="w-4 h-4 bg-red-500 hover:bg-red-600 rounded text-white text-xs font-medium transition-colors cursor-pointer"
                            title="If you would like to sponsor this fiction please click here to find out more."
                            onClick={() => {
                              console.log('🔗 Navigating to sponsor page for fiction:', fictionWithHistory?.royalroad_id);
                              console.log('🔗 Current URL before navigation:', window.location.pathname);
                              navigate(`/sponsor/${fictionWithHistory?.royalroad_id}`);
                              console.log('🔗 Navigation called, new URL should be:', `/sponsor/${fictionWithHistory?.royalroad_id}`);
                            }}
                          >
                            S
                          </button>
                        )}
                        <span className="text-sm text-gray-600">
                          {fictionWithHistory?.sponsored ? 'Sponsored' : 'Not Sponsored'}
                        </span>
                      </div>
                    </div>

                    {/* Last refresh time and countdown - inline with buttons */}
                    {lastRefreshTime && (
                      <div className="text-xs text-gray-500 mt-1">
                        <span>Last refreshed: {lastRefreshTime.toLocaleDateString()} at {lastRefreshTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {!canRefresh && remainingHours !== null && (
                          <span className="ml-2">
                            {remainingHours <= 0 ? (
                              <span className="text-green-600 font-medium">• Can refresh now!</span>
                            ) : remainingHours < 1 ? (
                              <span>• Can refresh in {Math.ceil(remainingHours * 60)} minutes</span>
                            ) : (
                              <span>• Can refresh in {Math.floor(remainingHours)} hours {Math.ceil((remainingHours % 1) * 60)} minutes</span>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Charts Section */}
                {showCurrentCharts && fictionWithHistory?.history && fictionWithHistory.history.length > 0 && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      📈 Current Charts
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        (as of {fictionWithHistory.history[0].captured_at ? new Date(fictionWithHistory.history[0].captured_at).toLocaleDateString() : 'Unknown Date'})
                      </span>
                    </h3>

                    {/* Chart 1: Engagement & Growth Metrics */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-700 mb-3">Engagement & Growth Metrics</h4>
                      <div className="w-full h-64 bg-white border border-gray-200 rounded-lg p-4">
                        {fictionWithHistory.history && fictionWithHistory.history.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={fictionWithHistory.history
                              .sort((a, b) => new Date(a.captured_at!).getTime() - new Date(b.captured_at!).getTime())
                              .map(entry => ({
                                date: new Date(entry.captured_at!).toLocaleDateString(),
                                pages: entry.pages,
                                followers: entry.followers,
                                totalViews: entry.total_views,
                                averageViews: entry.average_views,
                              }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis yAxisId="left" />
                              <YAxis yAxisId="right" orientation="right" />
                              <Tooltip />
                              <Legend />
                              <Line yAxisId="left" type="monotone" dataKey="pages" stroke="#8884d8" name="Pages" />
                              <Line yAxisId="left" type="monotone" dataKey="followers" stroke="#82ca9d" name="Followers" />
                              <Line yAxisId="right" type="monotone" dataKey="totalViews" stroke="#ffc658" name="Total Views" />
                              <Line yAxisId="right" type="monotone" dataKey="averageViews" stroke="#ff7300" name="Average Views" />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <div className="text-2xl mb-2">📈</div>
                              <div>No data available</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chart 2: Rating & Quality Metrics */}
                    <div>
                      <h4 className="text-md font-medium text-gray-700 mb-3">Rating & Quality Metrics</h4>
                      <div className="w-full h-64 bg-white border border-gray-200 rounded-lg p-4">
                        {fictionWithHistory.history && fictionWithHistory.history.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={fictionWithHistory.history
                              .sort((a, b) => new Date(a.captured_at!).getTime() - new Date(b.captured_at!).getTime())
                              .map(entry => ({
                                date: new Date(entry.captured_at!).toLocaleDateString(),
                                overallScore: entry.overall_score,
                                styleScore: entry.style_score,
                                storyScore: entry.story_score,
                                grammarScore: entry.grammar_score,
                                characterScore: entry.character_score,
                                score: entry.overall_score,
                                ratings: entry.ratings,
                              }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis yAxisId="left" domain={[0, 5]} />
                              <YAxis yAxisId="right" orientation="right" domain={[0, 'dataMax > 10 ? dataMax : 10']} />
                              <Tooltip />
                              <Legend />
                              <Line yAxisId="left" type="monotone" dataKey="overallScore" stroke="#8884d8" name="Overall Score" />
                              <Line yAxisId="left" type="monotone" dataKey="styleScore" stroke="#82ca9d" name="Style Score" />
                              <Line yAxisId="left" type="monotone" dataKey="storyScore" stroke="#ffc658" name="Story Score" />
                              <Line yAxisId="left" type="monotone" dataKey="grammarScore" stroke="#ff7300" name="Grammar Score" />
                              <Line yAxisId="left" type="monotone" dataKey="characterScore" stroke="#ff0000" name="Character Score" />
                              <Line yAxisId="left" type="monotone" dataKey="score" stroke="#8B4513" name="Overall Score" />
                              <Line yAxisId="right" type="monotone" dataKey="ratings" stroke="#000000" name="Ratings" />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <div className="text-2xl mb-2">⭐</div>
                              <div>No data available</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rising Stars Chart */}
                {isLoadingRisingStars ? (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      ⭐ Rising Stars Performance
                    </h3>
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                        <div>Loading Rising Stars data...</div>
                      </div>
                    </div>
                  </div>
                ) : risingStarsData.length > 0 ? (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      ⭐ Rising Stars Performance
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        (Position 1 = Top, 50 = Bottom)
                      </span>
                    </h3>
                    
                    <div className="w-full h-80 bg-white border border-gray-200 rounded-lg p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={risingStarsData
                          .sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime())
                          .map(entry => ({
                            date: new Date(entry.captured_at).toLocaleDateString(),
                            position: entry.position,
                            genre: entry.genre,
                          }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis 
                            domain={[1, 50]} 
                            reversed={true}
                            tickCount={6}
                            tickFormatter={(value) => `${value}`}
                          />
                          <Tooltip 
                            formatter={(value: any, name: any) => [
                              `Position ${value}`,
                              name === 'position' ? 'Position' : name
                            ]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Legend />
                          
                          {/* Create a line for each genre */}
                          {Array.from(new Set(risingStarsData.map(entry => entry.genre))).map((genre, index) => {
                            const genreData = risingStarsData
                              .filter(entry => entry.genre === genre)
                              .sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime());
                            
                            const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#8B4513', '#000000'];
                            const color = colors[index % colors.length];
                            
                            return (
                              <Line
                                key={genre}
                                type="monotone"
                                dataKey="position"
                                data={genreData.map(entry => ({
                                  date: new Date(entry.captured_at).toLocaleDateString(),
                                  position: entry.position,
                                  genre: entry.genre,
                                }))}
                                stroke={color}
                                name={genre === 'main' ? 'Main' : genre.charAt(0).toUpperCase() + genre.slice(1)}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                connectNulls={false}
                              />
                            );
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Legend with genre breakdown */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {Array.from(new Set(risingStarsData.map(entry => entry.genre))).map((genre, index) => {
                        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#8B4513', '#000000'];
                        const color = colors[index % colors.length];
                        const latestEntry = risingStarsData
                          .filter(entry => entry.genre === genre)
                          .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime())[0];
                        
                        return (
                          <div key={genre} className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: color }}
                            />
                            <span className="font-medium">
                              {genre === 'main' ? 'Main' : genre.charAt(0).toUpperCase() + genre.slice(1)}:
                            </span>
                            <span className="text-gray-600">
                              Position {latestEntry?.position || 'N/A'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Description */}
                {fiction.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">{fiction.description}</div>
                  </div>
                )}

                {/* Current Stats Section - Always Visible */}
                {fictionWithHistory?.history && fictionWithHistory.history.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      📊 Current Stats
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        (as of {fictionWithHistory.history[0].captured_at ? new Date(fictionWithHistory.history[0].captured_at).toLocaleDateString() : 'Unknown Date'})
                      </span>
                    </h3>

                    {/* Primary Stats - Large Display */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {typeof fictionWithHistory.history[0].pages === 'number' ? fictionWithHistory.history[0].pages.toLocaleString() : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">Pages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {typeof fictionWithHistory.history[0].overall_score === 'number' ? fictionWithHistory.history[0].overall_score.toFixed(1) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">Overall Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {typeof fictionWithHistory.history[0].followers === 'number' ? fictionWithHistory.history[0].followers.toLocaleString() : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {typeof fictionWithHistory.history[0].views === 'number' ? fictionWithHistory.history[0].views.toLocaleString() : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">Views</div>
                      </div>
                    </div>

                    {/* All Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Ratings:</span>
                        <span className="text-gray-900">{typeof fictionWithHistory.history[0].ratings === 'number' ? fictionWithHistory.history[0].ratings.toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Favorites:</span>
                        <span className="text-gray-900">{typeof fictionWithHistory.history[0].favorites === 'number' ? fictionWithHistory.history[0].favorites.toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Overall Score:</span>
                        <span className="text-gray-900">{typeof fictionWithHistory.history[0].overall_score === 'number' ? fictionWithHistory.history[0].overall_score.toFixed(1) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Style Score:</span>
                        <span className="text-gray-900">{typeof fictionWithHistory.history[0].style_score === 'number' ? fictionWithHistory.history[0].style_score.toFixed(1) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Story Score:</span>
                        <span className="text-gray-900">{typeof fictionWithHistory.history[0].story_score === 'number' ? fictionWithHistory.history[0].story_score.toFixed(1) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Grammar Score:</span>
                        <span className="text-gray-900">{typeof fictionWithHistory.history[0].grammar_score === 'number' ? fictionWithHistory.history[0].grammar_score.toFixed(1) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Character Score:</span>
                        <span className="text-gray-900">{typeof fictionWithHistory.history[0].character_score === 'number' ? fictionWithHistory.history[0].character_score.toFixed(1) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Total Views:</span>
                        <span className="text-gray-900">{typeof fictionWithHistory.history[0].total_views === 'number' ? fictionWithHistory.history[0].total_views.toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Average Views:</span>
                        <span className="text-gray-900">{typeof fictionWithHistory.history[0].average_views === 'number' ? fictionWithHistory.history[0].average_views.toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Metadata */}
                    {(fictionWithHistory.history[0].status || fictionWithHistory.history[0].type || fictionWithHistory.history[0].tags || fictionWithHistory.history[0].warnings) && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <h4 className="font-medium text-gray-700 mb-2">Additional Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {fictionWithHistory.history[0].status && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600">Status:</span>
                              <span className="text-gray-900">{fictionWithHistory.history[0].status}</span>
                            </div>
                          )}
                          {fictionWithHistory.history[0].type && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-600">Type:</span>
                              <span className="text-gray-900">{fictionWithHistory.history[0].type}</span>
                            </div>
                          )}
                          {fictionWithHistory.history[0].tags && Array.isArray(fictionWithHistory.history[0].tags) && fictionWithHistory.history[0].tags.length > 0 && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-600">Tags:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {fictionWithHistory.history[0].tags.map((tag, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {fictionWithHistory.history[0].warnings && Array.isArray(fictionWithHistory.history[0].warnings) && fictionWithHistory.history[0].warnings.length > 0 && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-600">Warnings:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {fictionWithHistory.history[0].warnings.map((warning, index) => (
                                  <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                    {warning}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

                {/* Status and Type - only show if they have values */}
                {(fiction.status || fiction.type) && (
                  <div className="flex space-x-4 text-sm text-gray-600">
                    {fiction.status && (
                      <span>Status: <span className="font-semibold">{fiction.status}</span></span>
                    )}
                    {fiction.type && (
                      <span>Type: <span className="font-semibold">{fiction.type}</span></span>
                    )}
                  </div>
                )}
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