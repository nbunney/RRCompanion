import React, { useState, useEffect, useRef } from 'react';
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
  const [animationSpeed, setAnimationSpeed] = useState(2000);
  const animationRef = useRef<HTMLDivElement>(null);
  const animationIntervalRef = useRef<number | null>(null);

  // Load Rising Stars data for the last 10 days
  useEffect(() => {
    loadRisingStarsData();
  }, []);

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
        undefined, // no genre filter
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
        return entryDate === dateStr;
      });

      // Sort by position and take top 20
      const top20 = dayData
        .sort((a, b) => a.position - b.position)
        .slice(0, 20);

      rankings.push({
        date: dateStr,
        rankings: top20
      });
    }

    return rankings;
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

  const startAnimation = () => {
    if (dailyRankings.length === 0) return;

    setIsPlaying(true);
    setCurrentDayIndex(0);

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

  const resetAnimation = () => {
    stopAnimation();
    setCurrentDayIndex(0);
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

  const currentRankings = dailyRankings[currentDayIndex]?.rankings || [];
  const previousRankings = currentDayIndex > 0 ? dailyRankings[currentDayIndex - 1]?.rankings : undefined;
  const currentDate = dailyRankings[currentDayIndex]?.date || '';
  const fictionMovements = getFictionMovement(currentRankings, previousRankings);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-900">Rising Stars Animation</h2>
          <p className="text-gray-600">Watch the top 20 fictions move through the rankings over the last 10 days</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {!isPlaying ? (
            <Button
              onClick={startAnimation}
              variant="primary"
              className="px-6"
            >
              ▶️ Play Animation
            </Button>
          ) : (
            <Button
              onClick={stopAnimation}
              variant="outline"
              className="px-6"
            >
              ⏸️ Pause
            </Button>
          )}

          <Button
            onClick={resetAnimation}
            variant="outline"
            className="px-6"
          >
            🔄 Reset
          </Button>
        </div>
      </div>

      {/* Animation Speed Control */}
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
        <label className="text-sm font-medium text-gray-700">Animation Speed:</label>
        <select
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(Number(e.target.value))}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          disabled={isPlaying}
        >
          <option value={1000}>Fast (1s)</option>
          <option value={2000}>Normal (2s)</option>
          <option value={3000}>Slow (3s)</option>
        </select>
      </div>

      {/* Progress Bar */}
      {isPlaying && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${((currentDayIndex + 1) / dailyRankings.length) * 100}%`
            }}
          />
        </div>
      )}

      {/* Date Display */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700">
          {currentDate ? new Date(currentDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Loading...'}
        </p>
        <p className="text-sm text-gray-500">
          Day {currentDayIndex + 1} of {dailyRankings.length}
        </p>
      </div>

      {/* Rankings Display */}
      <Card className="p-6">
        <div className="space-y-2" ref={animationRef}>
          {fictionMovements.map((entry) => {
            if (entry.isDropped) {
              return (
                <div
                  key={`dropped-${entry.fiction_id}-${currentDayIndex}`}
                  className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200 transition-all duration-500 ease-out opacity-60"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-lg mr-4">
                    ↓
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {entry.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {entry.author_name}
                    </p>
                    <p className="text-sm text-red-600 font-medium">
                      Dropped from position {entry.previousPosition}
                    </p>
                  </div>
                </div>
              );
            }

            const positionChange = entry.previousPosition
              ? entry.previousPosition - entry.currentPosition
              : 0;
            const isRising = positionChange > 0;
            const isFalling = positionChange < 0;

            return (
              <div
                key={`${entry.fiction_id}-${currentDayIndex}`}
                className={`flex items-center p-3 rounded-lg border transition-all duration-500 ease-out ${entry.isNew
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
          })}
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
