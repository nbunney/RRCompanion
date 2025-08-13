import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userFictionAPI } from '@/services/api';
import type { UserFiction } from '@/types';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ConfirmationDialog from '@/components/ConfirmationDialog';

const AllFictionsList: React.FC = () => {
  const navigate = useNavigate();
  const [allFictions, setAllFictions] = useState<UserFiction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [fictionToRemove, setFictionToRemove] = useState<UserFiction | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);

  useEffect(() => {
    loadAllFictions();
  }, []);

  const loadAllFictions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await userFictionAPI.getAllUserFictions();
      if (response.success && response.data) {
        // Sort: favorites first, then by date added (newest first)
        const sorted = response.data.sort((a, b) => {
          if (a.is_favorite && !b.is_favorite) return -1;
          if (!a.is_favorite && b.is_favorite) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setAllFictions(sorted);
      } else {
        setError('Failed to load fictions');
      }
    } catch (err: any) {
      console.error('Error loading fictions:', err);
      setError('Failed to load fictions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFictionClick = (fiction: UserFiction) => {
    if (fiction.fiction?.royalroad_id) {
      navigate(`/fiction/${fiction.fiction.royalroad_id}`);
    }
  };

  const handleToggleFavorite = async (userFiction: UserFiction) => {
    try {
      setIsUpdatingFavorite(true);
      const response = await userFictionAPI.toggleFavorite(userFiction.fiction_id);
      if (response.success) {
        // Update local state
        setAllFictions(prev => prev.map(f =>
          f.id === userFiction.id
            ? { ...f, is_favorite: !f.is_favorite }
            : f
        ));
      } else {
        setError('Failed to update favorite status');
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite status');
    } finally {
      setIsUpdatingFavorite(false);
    }
  };

  const handleRemoveFiction = (userFiction: UserFiction) => {
    if (userFiction.is_favorite) {
      setError('Cannot remove favorite fictions. Please remove from favorites first.');
      return;
    }
    setFictionToRemove(userFiction);
    setShowRemoveConfirm(true);
  };

  const performRemoveFiction = async () => {
    if (!fictionToRemove) return;

    try {
      setIsRemoving(true);
      const response = await userFictionAPI.removeFiction(fictionToRemove.fiction_id);
      if (response.success) {
        // Remove from local state
        setAllFictions(prev => prev.filter(f => f.id !== fictionToRemove.id));
        setShowRemoveConfirm(false);
        setFictionToRemove(null);
      } else {
        setError('Failed to remove fiction');
      }
    } catch (err: any) {
      console.error('Error removing fiction:', err);
      setError('Failed to remove fiction');
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
          <p className="mt-2 text-gray-600">Loading fictions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadAllFictions}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (allFictions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">You haven't added any fictions yet.</p>
        <p className="text-sm text-gray-400">
          Use the "Add Fiction" button above to add fictions from RoyalRoad by URL.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          All Your Fictions ({allFictions.length})
        </h2>
        <div className="text-sm text-gray-500">
          {allFictions.filter(f => f.is_favorite).length} favorites
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {allFictions.map((userFiction) => (
          <div
            key={userFiction.id}
            className="cursor-pointer"
            onClick={() => handleFictionClick(userFiction)}
          >
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex space-x-4">
                {userFiction.fiction?.image_url && (
                  <img
                    src={userFiction.fiction.image_url}
                    alt={userFiction.fiction.title}
                    className="w-20 h-28 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {userFiction.fiction?.title || 'Unknown Title'}
                        </h3>
                        {userFiction.is_favorite && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⭐ Favorite
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 truncate">
                        by {userFiction.fiction?.author_name || 'Unknown Author'}
                      </p>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                        {userFiction.fiction?.description || 'No description available'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                      <Button
                        variant={userFiction.is_favorite ? "outline" : "primary"}
                        size="sm"
                        onClick={() => {
                          handleToggleFavorite(userFiction);
                        }}
                        disabled={isUpdatingFavorite}
                      >
                        {userFiction.is_favorite ? '❤️ Favorited' : '🤍 Add to Favorites'}
                      </Button>
                      {!userFiction.is_favorite && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleRemoveFiction(userFiction);
                          }}
                          disabled={isRemoving}
                        >
                          🗑️ Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Remove Fiction Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showRemoveConfirm}
        title="Remove Fiction?"
        message={`Are you sure you want to remove "${fictionToRemove?.fiction?.title}" from your list? This action cannot be undone.`}
        confirmText="Remove"
        onConfirm={performRemoveFiction}
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

export default AllFictionsList;
