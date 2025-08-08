import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userFictionAPI } from '@/services/api';
import type { UserFiction } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';

const FavoritesList: React.FC = () => {
  const [favorites, setFavorites] = useState<UserFiction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

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

  const handleFictionClick = (fiction: UserFiction) => {
    if (fiction.fiction?.royalroad_id) {
      navigate(`/fiction/${fiction.fiction.royalroad_id}`);
    }
  };

  const handleRemoveFavorite = async (fictionId: number) => {
    try {
      const response = await userFictionAPI.toggleFavorite(fictionId);
      if (response.success) {
        // Remove from local state
        setFavorites(prev => prev.filter(fav => fav.fiction_id !== fictionId));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove from favorites');
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleRemoveFavorite(userFiction.fiction_id);
                      }}
                      className="ml-2"
                    >
                      ❌
                    </Button>
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
    </div>
  );
};

export default FavoritesList; 