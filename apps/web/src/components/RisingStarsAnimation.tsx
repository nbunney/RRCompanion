import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { risingStarsAPI } from '@/services/api';
import Button from '@/components/Button';
import Card from '@/components/Card';

interface RisingStarsEntry {
  fiction_id: number;
  royalroad_id: string;
  title: string;
  author_name: string;
  genre: string;
  position: number;
  captured_at: string;
}

interface DailyRanking {
  date: string;
  rankings: RisingStarsEntry[];
}

interface FictionMovement {
  fiction_id: number;
  royalroad_id: string;
  title: string;
  author_name: string;
  genre: string;
  currentPosition: number;
  previousPosition?: number;
  isNew: boolean;
  isDropped: boolean;
}

const RisingStarsAnimation: React.FC = () => {
  const [dailyRankings, setDailyRankings] = useState<DailyRanking[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [animationSpeed, setAnimationSpeed] = useState(5000); // 5 seconds default
  const animationIntervalRef = useRef<number | null>(null);
  const [followedFiction, setFollowedFiction] = useState<number | null>(null); // Track which fiction to follow
  const [selectedGenre, setSelectedGenre] = useState<string>('main'); // Default to main genre
  const [isMoving, setIsMoving] = useState(false); // Track if we're in movement phase
  const [movementData, setMovementData] = useState<FictionMovement[]>([]); // Store movement data
  const location = useLocation();
  const navigate = useNavigate();

  // Load Rising Stars data for the last 10 days
  useEffect(() => {
    loadRisingStarsData();
  }, []);

  // Load URL parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const genre = searchParams.get('genre');
    const speed = searchParams.get('speed');
    const follow = searchParams.get('follow');

    if (genre) setSelectedGenre(genre);
    if (speed) setAnimationSpeed(Number(speed));
    if (follow) setFollowedFiction(Number(follow));
  }, [location.search]);

  // Reload data when genre changes
  useEffect(() => {
    if (dailyRankings.length > 0) {
      loadRisingStarsData();
    }
  }, [selectedGenre]);

  const loadRisingStarsData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Calculate date range for the last 10 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 9);

      // Get Rising Stars data for the last 10 days
      const response = await risingStarsAPI.getRisingStars(
        selectedGenre, // Use selected genre instead of undefined
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (response.success && response.data) {
        // Group data by date and get top 20 for each day
        const groupedData = groupDataByDate(response.data);
        setDailyRankings(groupedData);
      } else {
        setError('Failed to load Rising Stars data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const groupDataByDate = (data: any[]): DailyRanking[] => {
    const today = new Date();
    const rankings: DailyRanking[] = [];

    // Create entries for the last 10 days
    for (let i = 9; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Filter data for this date and get top 20
      const dayData = data.filter(entry => {
        const entryDate = new Date(entry.captured_at).toISOString().split('T')[0];
        return entryDate === dateStr && entry.genre === selectedGenre;
      });

      // Group by fiction_id and take the latest entry for each fiction
      const fictionMap = new Map();
      dayData.forEach(entry => {
        const existing = fictionMap.get(entry.fiction_id);
        if (!existing || new Date(entry.captured_at) > new Date(existing.captured_at)) {
          fictionMap.set(entry.fiction_id, entry);
        }
      });

      // Convert back to array, sort by position, and take top 20
      const uniqueDayData = Array.from(fictionMap.values());
      const top20 = uniqueDayData
        .sort((a, b) => a.position - b.position)
        .slice(0, 20);

      // Only add days that have data
      if (top20.length > 0) {
        rankings.push({
          date: dateStr,
          rankings: top20
        });
      }
    }

    return rankings;
  };

  const handleFollowFiction = (fictionId: number) => {
    if (followedFiction === fictionId) {
      // Unfollow
      setFollowedFiction(null);
    } else {
      // Follow new fiction
      setFollowedFiction(fictionId);
    }
  };

  // Update URL when parameters change
  const updateURL = () => {
    const searchParams = new URLSearchParams();
    if (selectedGenre !== 'main') searchParams.set('genre', selectedGenre);
    if (animationSpeed !== 5000) searchParams.set('speed', animationSpeed.toString());
    if (followedFiction) searchParams.set('follow', followedFiction.toString());

    const newURL = searchParams.toString() ? `?${searchParams.toString()}` : '';
    navigate(newURL, { replace: true });
  };

  // Update URL when parameters change
  useEffect(() => {
    updateURL();
  }, [selectedGenre, animationSpeed, followedFiction]);

  // Get the visible rankings based on whether a fiction is followed
  const getVisibleRankings = (currentDayIndex: number): FictionMovement[] => {
    const currentDayData = dailyRankings[currentDayIndex];
    if (!currentDayData) return [];

    const currentRankings = currentDayData.rankings || [];
    const previousRankings = currentDayIndex > 0 ? dailyRankings[currentDayIndex - 1]?.rankings : undefined;

    // If we have a followed fiction, show focused view
    if (followedFiction && currentDayIndex >= 0) {
      const followedEntry = currentRankings.find((entry: RisingStarsEntry) => entry.fiction_id === followedFiction);

      if (followedEntry) {
        // Followed fiction found - show 13 entries centered on it
        const followedPosition = followedEntry.position;
        const startIndex = Math.max(0, followedPosition - 7);
        const endIndex = Math.min(currentRankings.length, followedPosition + 6);

        const visibleRankings = currentRankings.slice(startIndex, endIndex);
        return getFictionMovement(visibleRankings, previousRankings);
      } else {
        // Followed fiction not found - show bottom 13 entries
        const bottomRankings = currentRankings.slice(-13);
        return getFictionMovement(bottomRankings, previousRankings);
      }
    }

    // No followed fiction - show all entries
    return getFictionMovement(currentRankings, previousRankings);
  };

  const getFictionMovement = (currentRankings: RisingStarsEntry[], previousRankings?: RisingStarsEntry[]): FictionMovement[] => {
    if (!previousRankings) {
      // First day - all fictions are new
      return currentRankings.map(entry => ({
        ...entry,
        currentPosition: entry.position,
        isNew: true,
        isDropped: false
      }));
    }

    const movements: FictionMovement[] = [];
    const previousMap = new Map(previousRankings.map(r => [r.fiction_id, r]));

    // Process current rankings
    currentRankings.forEach(entry => {
      const previous = previousMap.get(entry.fiction_id);
      if (previous) {
        // Fiction was in previous rankings
        movements.push({
          ...entry,
          currentPosition: entry.position,
          previousPosition: previous.position,
          isNew: false,
          isDropped: false
        });
        previousMap.delete(entry.fiction_id);
      } else {
        // New fiction
        movements.push({
          ...entry,
          currentPosition: entry.position,
          isNew: true,
          isDropped: false
        });
      }
    });

    // Add dropped fictions
    previousMap.forEach(entry => {
      movements.push({
        ...entry,
        currentPosition: 0,
        isNew: false,
        isDropped: true
      });
    });

    // Sort by current position (dropped fictions go to the end)
    return movements.sort((a, b) => {
      if (a.isDropped && !b.isDropped) return 1;
      if (!a.isDropped && b.isDropped) return -1;
      return a.currentPosition - b.currentPosition;
    });
  };

  // Calculate movement path for followed fiction
  const getMovementPath = (currentDayIndex: number): FictionMovement[] => {
    if (!followedFiction || currentDayIndex >= dailyRankings.length - 1) return [];
    
    const currentDay = dailyRankings[currentDayIndex];
    const nextDay = dailyRankings[currentDayIndex + 1];
    
    if (!currentDay || !nextDay) return [];
    
    const currentEntry = currentDay.rankings.find(r => r.fiction_id === followedFiction);
    const nextEntry = nextDay.rankings.find(r => r.fiction_id === followedFiction);
    
    if (!currentEntry || !nextEntry) return [];
    
    // Create a list that shows the followed fiction moving to its new position
    const movements: FictionMovement[] = [];
    
    // Add current rankings
    currentDay.rankings.forEach(entry => {
      if (entry.fiction_id === followedFiction) {
        // This is the followed fiction - mark it for movement
        movements.push({
          ...entry,
          currentPosition: entry.position,
          previousPosition: entry.position,
          isNew: false,
          isDropped: false
        });
      } else {
        // Regular entry
        movements.push({
          ...entry,
          currentPosition: entry.position,
          previousPosition: entry.position,
          isNew: false,
          isDropped: false
        });
      }
    });
    
    // Sort by current position
    return movements.sort((a, b) => a.currentPosition - b.currentPosition);
  };

  const startAnimation = () => {
    if (dailyRankings.length === 0) return;

    setIsPlaying(true);
    setCurrentDayIndex(0);
    setIsMoving(false);

    // Start the animation loop
    animationIntervalRef.current = setInterval(() => {
      setCurrentDayIndex(prev => {
        if (prev >= dailyRankings.length - 1) {
          // Animation complete
          setIsPlaying(false);
          if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current);
          }
          return 0;
        }

        // Check if we need to show movement animation for followed fiction
        if (followedFiction && prev < dailyRankings.length - 1) {
          const currentDay = dailyRankings[prev];
          const nextDay = dailyRankings[prev + 1];
          
          if (currentDay && nextDay) {
            const currentEntry = currentDay.rankings.find(r => r.fiction_id === followedFiction);
            const nextEntry = nextDay.rankings.find(r => r.fiction_id === followedFiction);
            
            if (currentEntry && nextEntry && currentEntry.position !== nextEntry.position) {
              // Show movement animation
              setIsMoving(true);
              const movementPath = getMovementPath(prev);
              setMovementData(movementPath);
              
              // After movement animation, continue to next day
              setTimeout(() => {
                setIsMoving(false);
                setCurrentDayIndex(prev + 1);
              }, 2000); // 2 second movement animation
              
              return prev; // Stay on current day during movement
            }
          }
        }

        return prev + 1;
      });
    }, animationSpeed);
  };

  const stopAnimation = () => {
    setIsPlaying(false);
    setCurrentDayIndex(0);
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Rising Stars data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadRisingStarsData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (dailyRankings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">No Rising Stars data available</p>
        <Button onClick={loadRisingStarsData} variant="outline">
          Refresh
        </Button>
      </div>
    );
  }

  const visibleRankings = getVisibleRankings(currentDayIndex);

  // If we're showing movement animation, use movement data
  const displayRankings = isMoving ? movementData : visibleRankings;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Rising Stars Animation</h1>
        <p className="text-lg text-gray-600 mb-6">
          Watch the top 20 fictions move through the {selectedGenre} rankings over the last 10 days
        </p>

        {/* Controls moved here */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <button
            onClick={isPlaying ? stopAnimation : startAnimation}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            {isPlaying ? '❚❚ Pause' : '▶ Play'}
          </button>

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="main">Main</option>
            <option value="fantasy">Fantasy</option>
            <option value="sci-fi">Sci-Fi</option>
            <option value="romance">Romance</option>
            <option value="mystery">Mystery</option>
            <option value="horror">Horror</option>
            <option value="adventure">Adventure</option>
            <option value="comedy">Comedy</option>
            <option value="drama">Drama</option>
            <option value="tragedy">Tragedy</option>
          </select>

          <select
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={3000}>3s (Fast)</option>
            <option value={5000}>5s (Normal)</option>
            <option value={7000}>7s (Slow)</option>
          </select>

          <button
            onClick={() => {
              const currentURL = window.location.href;
              navigator.clipboard.writeText(currentURL);
              // Could add a toast notification here
            }}
            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            title="Copy current view link"
          >
            📋 Copy Link
          </button>
        </div>
      </div>

      {/* Movement Animation Indicator */}
      {isMoving && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 text-center">
            🎬 <strong>Movement Animation:</strong> Watch your followed fiction move to its new position...
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Day {currentDayIndex + 1} of {dailyRankings.length}</span>
          <span>
            {dailyRankings[currentDayIndex]?.date}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentDayIndex + 1) / dailyRankings.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Focused View Indicator */}
      {followedFiction && !isMoving && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            📍 <strong>Focused View:</strong> Showing fictions centered on your followed fiction.
            <button
              onClick={() => handleFollowFiction(followedFiction)}
              className="ml-2 text-yellow-600 hover:text-yellow-800 underline"
            >
              Show all 50
            </button>
          </p>
        </div>
      )}

      {/* Rankings Display */}
      <Card className="p-6">
        <div className="space-y-2 w-full max-w-4xl mx-auto px-4 sm:px-6">
          {(() => {
            return displayRankings.map((entry) => {
              const isFollowed = followedFiction === entry.fiction_id;
              const positionChange = entry.previousPosition ? entry.previousPosition - entry.currentPosition : 0;
              const isRising = positionChange > 0;
              const isFalling = positionChange < 0;

              return (
                <div
                  key={`${entry.fiction_id}-${currentDayIndex}`}
                  className={`flex items-center p-3 rounded-lg border transition-all duration-500 ease-out min-w-[800px] ${entry.isNew
                    ? 'bg-green-50 border-green-200'
                    : isRising
                      ? 'bg-green-50 border-green-200'
                      : isFalling
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  {/* Position with change indicator */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-4 relative">
                    <div className={`w-full h-full rounded-full flex items-center justify-center ${entry.isNew
                      ? 'bg-green-600 text-white'
                      : isRising
                        ? 'bg-green-600 text-white'
                        : isFalling
                          ? 'bg-yellow-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                      {entry.currentPosition}
                    </div>
                    {!entry.isNew && positionChange !== 0 && (
                      <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isRising ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                        }`}>
                        {isRising ? '+' : ''}{positionChange}
                      </div>
                    )}
                    {entry.isNew && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                        NEW
                      </div>
                    )}
                  </div>

                  {/* Fiction Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {entry.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {entry.author_name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {entry.genre}
                      </span>
                      {!entry.isNew && positionChange !== 0 && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isRising ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {isRising ? '↗' : '↘'} {Math.abs(positionChange)} positions
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Follow Button */}
                  <div className="flex flex-col items-end space-y-1 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowFiction(entry.fiction_id);
                      }}
                      className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${isFollowed
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      title={isFollowed ? 'Unfollow' : 'Follow this fiction'}
                    >
                      {isFollowed ? '⭐ Following' : '👁️ Follow'}
                    </button>
                  </div>

                  {/* Royal Road Link */}
                  <div className="flex-shrink-0 ml-4">
                    <a
                      href={`https://www.royalroad.com/fiction/${entry.royalroad_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View on RR →
                    </a>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </Card>

      {/* Legend */}
      <div className="text-center text-sm text-gray-500 space-y-2">
        <p>Watch how fictions move up and down the Rising Stars rankings over time</p>
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <span className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span>Rising</span>
          </span>
          <span className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
            <span>Falling</span>
          </span>
          <span className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>Stable</span>
          </span>
          <span className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Dropped</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default RisingStarsAnimation;
