import React, { useState, useEffect } from 'react';
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
import { formatLocalDate } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';


const FictionDetail: React.FC = () => {
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
  const { checkAuth, isAuthenticated } = useAuth();
  const [fiction, setFiction] = useState<RoyalRoadFiction | null>(null);
  const [fictionWithHistory, setFictionWithHistory] = useState<Fiction | null>(null);
  const [userFiction, setUserFiction] = useState<UserFiction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);

  const [showUnfavoriteConfirm, setShowUnfavoriteConfirm] = useState(false);
  const [risingStarsData, setRisingStarsData] = useState<any[]>([]);




  // Initialize lastRefreshTime from the most recent fictionHistory entry




  // Check authentication when component mounts
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (id) {
      loadFiction();
      // Only load user fiction data for authenticated users
      if (isAuthenticated) {
        loadUserFiction();
      }
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (fictionWithHistory?.id && isAuthenticated) {
      loadRisingStarsData();
    }
  }, [fictionWithHistory?.id, isAuthenticated]);

  const loadFiction = async () => {
    try {
      setIsLoading(true);

      // First, try to load from our database (only for authenticated users)
      if (isAuthenticated) {
        try {
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
            return; // Successfully loaded from database
          }
        } catch (dbErr: any) {
          // If database call fails (e.g., 401), fall back to Royal Road API
          console.log('🔗 Database call failed, falling back to Royal Road API:', dbErr.message);
        }
      }

      // Fall back to Royal Road API (for non-authenticated users or when database fails)
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



  const getRoyalRoadUrl = () => {
    if (!fiction) return '#';
    return `https://www.royalroad.com/fiction/${fiction.id}`;
  };

  const handleDownloadCSV = async () => {
    if (!fictionWithHistory) return;

    try {
      const response = await fetch(`/api/fictions/${fictionWithHistory.id}/csv`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Get filename from server's Content-Disposition header, fallback to default if not available
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `${fictionWithHistory.title.replace(/[^a-zA-Z0-9]/g, '_')}_data.zip`; // Default fallback

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        console.log('ZIP file downloaded successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to download data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to download data');
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
            <Button onClick={() => navigate('/')}>
              Back to Home
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
                  <a
                    href={getRoyalRoadUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={fiction.image}
                      alt={fiction.title}
                      className="w-48 h-72 object-cover rounded-lg shadow-md"
                    />
                  </a>
                </div>
              )}

              {/* Fiction Details */}
              <div className="flex-1">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      <a
                        href={getRoyalRoadUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {fiction.title}
                      </a>
                    </h1>
                    <p className="text-lg text-gray-600 mb-3">
                      by{' '}
                      <a
                        href={`https://www.royalroad.com/profile/${fiction.author.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {fiction.author.name}
                      </a>
                    </p>

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
                        onClick={handleDownloadCSV}
                        disabled={false}
                        variant="outline"
                      >
                        📦 Data
                      </Button>
                    </div>

                    {/* Buy Nate Coffee Button */}
                    <div className="mt-2">
                      <Button
                        onClick={() => navigate('/coffee')}
                        variant="outline"
                        className="w-full"
                      >
                        ☕ Buy Nate Coffee
                      </Button>
                    </div>

                  </div>
                </div>

                {/* Current Stats Section - Always Visible */}
                {fictionWithHistory && (
                  <CurrentStats
                    latestHistory={fictionWithHistory.history && fictionWithHistory.history.length > 0 ? fictionWithHistory.history[0] : undefined}
                  />
                )}

                {/* Current Charts Section */}
                {fictionWithHistory?.history && fictionWithHistory.history.length > 0 && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      📈 Current Charts
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        (as of {formatLocalDate(fictionWithHistory.history[0].captured_at)})
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