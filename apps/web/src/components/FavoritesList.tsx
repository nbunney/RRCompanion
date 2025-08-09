import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFictionUrl } from '@/utils';
import { analyzeRisingStarsData, getTrendIcon, getTrendColor } from '@/utils/risingStars';
import { userFictionAPI, risingStarsAPI } from '@/services/api';
import type { UserFiction } from '@/types';
import type { RisingStarEntry } from '@/utils/risingStars';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ConfirmationDialog from '@/components/ConfirmationDialog';

const FavoritesList: React.FC = () => {
  const [favorites, setFavorites] = useState<UserFiction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [fictionToRemove, setFictionToRemove] = useState<UserFiction | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [risingStarsData, setRisingStarsData] = useState<RisingStarEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    if (favorites.length > 0) {
      loadRisingStarsData();
    }
  }, [favorites]);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const response = await userFictionAPI.getUserFavorites();
      if (response.success && response.data) {
        setFavorites(response.data.userFictions);
      } else {
        setError(response.message || 'Failed to load favorites');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRisingStarsData = async () => {
    try {
      // Get all unique fiction IDs from favorites
      const fictionIds = favorites
        .map(fav => fav.fiction?.id)
        .filter(id => id !== undefined) as number[];

      // Fetch Rising Stars data for each fiction
      const allRisingStarsData: RisingStarEntry[] = [];

      for (const fictionId of fictionIds) {
        try {
          const response = await risingStarsAPI.getRisingStarsForFiction(fictionId);
          if (response.success && response.data) {
            allRisingStarsData.push(...response.data);
          }
        } catch (err) {
          // Silently fail for individual fictions
          console.warn(`Failed to load Rising Stars data for fiction ${fictionId}:`, err);
        }
      }

      setRisingStarsData(allRisingStarsData);
    } catch (err: any) {
      console.error('Failed to load Rising Stars data:', err);
    }
  };

  const handleFictionClick = (fiction: UserFiction) => {
    if (fiction.fiction?.royalroad_id && fiction.fiction.title) {
      navigate(createFictionUrl(fiction.fiction.title, fiction.fiction.royalroad_id));
    }
  };

  const handleRemoveFavorite = (userFiction: UserFiction) => {
    setFictionToRemove(userFiction);
    setShowRemoveConfirm(true);
  };

  const performRemoveFavorite = async () => {
    if (!fictionToRemove) return;

    try {
      setIsRemoving(true);
      const response = await userFictionAPI.toggleFavorite(fictionToRemove.fiction_id);
      if (response.success) {
        // Remove from local state
        setFavorites(prev => prev.filter(fav => fav.fiction_id !== fictionToRemove.fiction_id));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove from favorites');
    } finally {
      setIsRemoving(false);
      setShowRemoveConfirm(false);
      setFictionToRemove(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading favorites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">You haven't added any favorites yet.</p>
        <p className="text-sm text-gray-400">
          Use the "Add Fiction" button above to add fictions from RoyalRoad by URL.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Your Favorites ({favorites.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {favorites.map((userFiction) => (
          <div
            key={userFiction.id}
            className="cursor-pointer"
            onClick={(e) => {
              // Don't navigate if clicking on the remove button
              if ((e.target as HTMLElement).closest('button')) {
                return;
              }
              handleFictionClick(userFiction);
            }}
          >
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex space-x-4">
                {userFiction.fiction?.image_url && (
                  <img
                    src={userFiction.fiction.image_url}
                    alt={userFiction.fiction.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {userFiction.fiction?.title || 'Unknown Title'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        by {userFiction.fiction?.author_name || 'Unknown Author'}
                      </p>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {userFiction.fiction?.description || 'No description available'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {/* Sponsored Indicator */}
                      <div className={`w-6 h-6 border-2 border-gray-300 rounded flex items-center justify-center ${userFiction.fiction?.sponsored ? 'border-green-500 bg-green-500' : 'bg-white'
                        }`}>
                        {userFiction.fiction?.sponsored && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleRemoveFavorite(userFiction);
                        }}
                      >
                        ❌
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Status: {userFiction.status}</span>
                    {userFiction.fiction && (
                      <>
                        <span>Followers: {typeof userFiction.fiction.followers === 'number' ? userFiction.fiction.followers.toLocaleString() : '0'}</span>
                        <span>Score: {typeof userFiction.fiction.score === 'number' ? userFiction.fiction.score.toFixed(1) : 'N/A'}</span>
                      </>
                    )}
                  </div>



                  {/* Rising Stars Indicator */}
                  {userFiction.fiction?.id && (() => {
                    const risingStarsInfo = analyzeRisingStarsData(userFiction.fiction.id, risingStarsData);
                    if (risingStarsInfo.genreTrends.length > 0) {
                      return (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1">Rising Stars:</div>
                          <div className="flex flex-wrap gap-1">
                            {risingStarsInfo.genreTrends.map((genreTrend) => (
                              <span
                                key={genreTrend.genre}
                                className={`px-2 py-1 text-xs rounded border ${genreTrend.genre === 'main'
                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                    : 'bg-gray-100 text-gray-800 border-gray-200'
                                  }`}
                              >
                                <span className="font-medium">
                                  {genreTrend.genre === 'main' ? 'MAIN' : genreTrend.genre.toUpperCase()}
                                </span>
                                <span className={`ml-1 ${getTrendColor(genreTrend.trend)}`}>
                                  {getTrendIcon(genreTrend.trend)}
                                </span>
                                {genreTrend.position && (
                                  <span className="ml-1 text-gray-600">
                                    #{genreTrend.position}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {userFiction.fiction?.tags && userFiction.fiction.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {userFiction.fiction.tags.slice(0, 2).map((tag) => (
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
          </div>
        ))}
      </div>

      {/* Remove from Favorites Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showRemoveConfirm}
        title="Remove from Favorites?"
        message={`Are you sure you want to remove "${fictionToRemove?.fiction?.title}" from your favorites? This action cannot be undone.`}
        confirmText="Remove"
        onConfirm={performRemoveFavorite}
        onCancel={() => {
          setShowRemoveConfirm(false);
          setFictionToRemove(null);
        }}
        isLoading={isRemoving}
        loadingText="Removing..."
        variant="danger"
      />
    </div>
  );
};

export default FavoritesList; 