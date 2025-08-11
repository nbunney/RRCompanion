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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Fiction Item Component
interface SortableFictionItemProps {
  userFiction: UserFiction;
  risingStarsData: RisingStarEntry[];
  onFictionClick: (fiction: UserFiction) => void;
  onRemoveFavorite: (userFiction: UserFiction) => void;
  onSponsorClick: (e: React.MouseEvent, fiction: UserFiction) => void;
}

const SortableFictionItem: React.FC<SortableFictionItemProps> = ({
  userFiction,
  risingStarsData,
  onFictionClick,
  onRemoveFavorite,
  onSponsorClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: userFiction.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-pointer"
      onClick={(e) => {
        // Don't navigate if clicking on the remove button
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        onFictionClick(userFiction);
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
                {/* Drag Handle */}
                <div
                  {...attributes}
                  {...listeners}
                  className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center cursor-move transition-colors"
                  title="Drag to reorder"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                  </svg>
                </div>

                {/* Sponsored Indicator */}
                {userFiction.fiction?.sponsored ? (
                  <div
                    className="w-6 h-6 border-2 border-green-500 bg-green-500 rounded flex items-center justify-center cursor-help"
                    title="This fiction has been sponsored."
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <button
                    className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded text-white text-xs font-medium transition-colors cursor-pointer"
                    title="If you would like to sponsor this fiction please click here to find out more."
                    onClick={(e) => onSponsorClick(e, userFiction)}
                  >
                    S
                  </button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveFavorite(userFiction)}
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
  );
};

const FavoritesList: React.FC = () => {
  const [favorites, setFavorites] = useState<UserFiction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [fictionToRemove, setFictionToRemove] = useState<UserFiction | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [risingStarsData, setRisingStarsData] = useState<RisingStarEntry[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const navigate = useNavigate();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = favorites.findIndex(fav => fav.id === active.id);
      const newIndex = favorites.findIndex(fav => fav.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newFavorites = arrayMove(favorites, oldIndex, newIndex);
        setFavorites(newFavorites);

        // Save the new order to the backend
        try {
          setIsReordering(true);
          const fictionIds = newFavorites.map(fav => fav.fiction_id);
          await userFictionAPI.reorderFavorites(fictionIds);
        } catch (err: any) {
          console.error('Failed to save order:', err);
          // Revert to original order on error
          setFavorites(favorites);
          setError('Failed to save new order. Please try again.');
        } finally {
          setIsReordering(false);
        }
      }
    }
  };

  const handleSponsorClick = (e: React.MouseEvent, userFiction: UserFiction) => {
    e.stopPropagation();
    console.log('🔗 Navigating to sponsor page for fiction:', userFiction.fiction?.royalroad_id);
    console.log('🔗 Current URL before navigation:', window.location.pathname);
    const newUrl = `/sponsor/${userFiction.fiction?.royalroad_id}`;
    console.log('🔗 Navigation called, new URL should be:', newUrl);
    // Try direct navigation as fallback
    window.location.href = newUrl;
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
        {isReordering && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Saving order...</span>
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={favorites.map(fav => fav.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((userFiction) => (
              <SortableFictionItem
                key={userFiction.id}
                userFiction={userFiction}
                risingStarsData={risingStarsData}
                onFictionClick={handleFictionClick}
                onRemoveFavorite={handleRemoveFavorite}
                onSponsorClick={handleSponsorClick}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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