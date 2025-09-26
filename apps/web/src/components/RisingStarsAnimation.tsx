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
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(2000);
  const [selectedGenre, setSelectedGenre] = useState('main');
  const [followedFiction, setFollowedFiction] = useState<number | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'start' | 'sliding' | 'end'>('start');
  const [isLoading, setIsLoading] = useState(true);
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
  // Removed unused shouldStopAnimation state - using shouldStopAnimationRef.current instead
  const [showNewPosition, setShowNewPosition] = useState(false);
  const animationIntervalRef = useRef<number | null>(null);
  const shouldStopAnimationRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  console.log('🎬 Component mounted - shouldStopAnimationRef.current initial value:', shouldStopAnimationRef.current);

  // Load URL parameters on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const genre = searchParams.get('genre');
    const speed = searchParams.get('speed');
    const follow = searchParams.get('follow');

    console.log('🔗 URL Parameters processed:', { genre, speed, follow });

    if (genre) setSelectedGenre(genre);
    if (speed) setAnimationSpeed(Number(speed));
    if (follow) setFollowedFiction(Number(follow));
    setUrlParamsProcessed(true); // Mark URL parameters as processed
  }, [location.search]);

  // Load Rising Stars data after URL parameters are processed
  useEffect(() => {
    console.log('📊 Data loading effect triggered:', { selectedGenre, followedFiction, urlParamsProcessed });
    // Only load when URL parameters have been processed and we have a genre
    if (urlParamsProcessed && selectedGenre) {
      loadRisingStarsData();
    }
  }, [urlParamsProcessed, selectedGenre, followedFiction]); // Depend on URL processing flag

  const loadRisingStarsData = async () => {
    try {
      console.log('🚀 Starting loadRisingStarsData with:', { selectedGenre, followedFiction });

      let startDate: string;
      let endDate: string;

      if (followedFiction) {
        try {
          console.log('🎯 Getting date range for followed fiction:', followedFiction);
          const dateRangeResponse = await risingStarsAPI.getFictionDateRange(followedFiction, selectedGenre);
          console.log('📅 Date range response:', dateRangeResponse);

          if (dateRangeResponse.success && dateRangeResponse.data) {
            const { firstDate, lastDate } = dateRangeResponse.data;

            // Use the full date range from the backend
            startDate = firstDate;
            // Ensure end date covers the entire day by setting it to end of day
            const endDateObj = new Date(lastDate);
            endDateObj.setHours(23, 59, 59, 999);
            endDate = endDateObj.toISOString();

            console.log('📅 Fiction', followedFiction, 'appears from', startDate, 'to', endDate);
          } else {
            throw new Error('Failed to get date range');
          }
        } catch (error) {
          console.warn('⚠️ Could not get date range for followed fiction, using default range:', error);
          // Fall back to default 10-day range
          const end = new Date();
          const start = new Date();
          start.setDate(start.getDate() - 9);
          startDate = start.toISOString().split('T')[0];
          endDate = end.toISOString().split('T')[0];
        }
      } else {
        // Default 10-day range
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 9);
        startDate = start.toISOString().split('T')[0];
        endDate = end.toISOString().split('T')[0];
      }

      console.log('📅 Using date range:', { startDate, endDate, selectedGenre });

      const response = await risingStarsAPI.getRisingStars(selectedGenre, startDate, endDate);
      console.log('📡 API response:', response);

      if (response.success && response.data) {
        console.log('✅ Rising Stars data loaded successfully:', response.data.length, 'entries');
        const grouped = groupDataByDate(response.data);
        console.log('📊 Grouped data result:', grouped);
        setDailyRankings(grouped);
        setCurrentDayIndex(grouped.length - 1); // Start on the last day
        console.log('📊 Grouped data:', grouped.length, 'days');
        setIsLoading(false);
      } else {
        console.error('❌ Failed to load Rising Stars data:', response.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Error loading Rising Stars data:', error);
      setIsLoading(false);
    }
  };

  const groupDataByDate = (data: any[]): DailyRanking[] => {
    console.log('🔍 groupDataByDate called with:', data.length, 'entries');
    const rankings: DailyRanking[] = [];

    // Group data by date
    const groupedByDate: { [key: string]: any[] } = {};
    data.forEach(entry => {
      const entryDate = new Date(entry.captured_at).toISOString().split('T')[0];
      if (!groupedByDate[entryDate]) {
        groupedByDate[entryDate] = [];
      }
      groupedByDate[entryDate].push(entry);
    });

    console.log('📅 Grouped by date:', Object.keys(groupedByDate).length, 'dates:', Object.keys(groupedByDate));

    // Sort dates chronologically and process each day
    const sortedDates = Object.keys(groupedByDate).sort();
    sortedDates.forEach(dateStr => {
      const dayData = groupedByDate[dateStr].filter(entry => entry.genre === selectedGenre);
      console.log('🎭 Date', dateStr, 'has', dayData.length, 'entries for genre', selectedGenre);

      // Group by fiction_id and take the best (lowest position) entry for each fiction
      const fictionMap = new Map();
      dayData.forEach(entry => {
        const existing = fictionMap.get(entry.fiction_id);
        if (!existing || entry.position < existing.position) {
          fictionMap.set(entry.fiction_id, entry);
        }
      });

      // Convert back to array, sort by position, and take top 50
      const uniqueDayData = Array.from(fictionMap.values());
      const top50 = uniqueDayData
        .sort((a, b) => a.position - b.position)
        .slice(0, 50);

      console.log('📊 Date', dateStr, 'processed:', uniqueDayData.length, 'unique fictions, top 50:', top50.length);

      // Only add days that have data
      if (top50.length > 0) {
        rankings.push({
          date: dateStr,
          rankings: top50
        });
      }
    });

    console.log('🏁 Final rankings result:', rankings.length, 'days with data');
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
        // Followed fiction found - show 25 entries in memory but only display 13 centered on it
        const followedPosition = followedEntry.position;
        const startIndex = Math.max(0, followedPosition - 12);
        const endIndex = Math.min(currentRankings.length, followedPosition + 12);

        const visibleRankings = currentRankings.slice(startIndex, endIndex);
        console.log('🎯 Focused view - centered on fiction:', followedFiction, 'position:', followedPosition, 'showing entries:', startIndex, 'to', endIndex, 'total:', visibleRankings.length);

        // For focused view, only show current rankings, no dropped fictions
        const allEntries = visibleRankings.map(entry => ({
          ...entry,
          currentPosition: entry.position,
          previousPosition: previousRankings?.find(r => r.fiction_id === entry.fiction_id)?.position,
          isNew: !previousRankings?.find(r => r.fiction_id === entry.fiction_id),
          isDropped: false
        }));

        // Only return 13 entries centered on the followed fiction for display
        const centerIndex = allEntries.findIndex(entry => entry.fiction_id === followedFiction);

        // Always try to center the followed fiction in the middle of the 13 visible entries
        // This means it should be at position 6 (0-indexed) in our display array
        let displayStart: number;
        let displayEnd: number;

        // Calculate the ideal center position (6th position out of 13)
        const idealCenterIndex = 6;

        // Calculate how many entries we can show above and below
        const entriesAbove = Math.min(idealCenterIndex, centerIndex);
        const entriesBelow = Math.min(13 - idealCenterIndex - 1, allEntries.length - centerIndex - 1);

        // Calculate the actual start and end indices
        displayStart = centerIndex - entriesAbove;
        displayEnd = centerIndex + entriesBelow + 1;

        // Ensure we always show exactly 13 entries if possible
        if (displayEnd - displayStart < 13 && allEntries.length >= 13) {
          if (displayStart === 0) {
            // At the top, extend downward
            displayEnd = Math.min(allEntries.length, 13);
          } else if (displayEnd === allEntries.length) {
            // At the bottom, extend upward
            displayStart = Math.max(0, allEntries.length - 13);
          } else {
            // In the middle, try to balance both sides
            const remaining = 13 - (displayEnd - displayStart);
            const extendUp = Math.min(Math.floor(remaining / 2), displayStart);
            const extendDown = Math.min(remaining - extendUp, allEntries.length - displayEnd);

            displayStart -= extendUp;
            displayEnd += extendDown;
          }
        }

        const displayEntries = allEntries.slice(displayStart, displayEnd);

        console.log('🎯 Focused view result:', allEntries.length, 'total entries,', displayEntries.length, 'displayed');
        console.log('🎯 Display range:', displayStart, 'to', displayEnd, 'centerIndex:', centerIndex, 'entriesAbove:', entriesAbove, 'entriesBelow:', entriesBelow);
        return displayEntries;
      } else {
        // Followed fiction not found - show bottom 13 entries
        const bottomRankings = currentRankings.slice(-13);
        console.log('🎯 Focused view - fiction not found, showing bottom 13 entries');

        // For focused view, only show current rankings, no dropped fictions
        const result = bottomRankings.map(entry => ({
          ...entry,
          currentPosition: entry.position,
          previousPosition: previousRankings?.find(r => r.fiction_id === entry.fiction_id)?.position,
          isNew: !previousRankings?.find(r => r.fiction_id === entry.fiction_id),
          isDropped: false
        }));

        console.log('🎯 Bottom 13 result:', result.length, 'entries');
        return result;
      }
    }

    // No followed fiction - show all entries with full movement data
    console.log('📊 Full view - showing all', currentRankings.length, 'entries');
    return getFictionMovement(currentRankings, previousRankings);
  };

  const getFictionMovement = (currentRankings: RisingStarsEntry[], previousRankings?: RisingStarsEntry[]): FictionMovement[] => {
    if (!previousRankings) {
      // First day - all fictions are green but not marked as new
      return currentRankings.map(entry => ({
        ...entry,
        currentPosition: entry.position,
        isNew: false, // Don't show NEW badge on first day
        isDropped: false
      }));
    }

    const movements: FictionMovement[] = [];
    const previousMap = new Map(previousRankings.map(r => [r.fiction_id, r]));

    // Process current rankings
    currentRankings.forEach(entry => {
      const previous = previousMap.get(entry.fiction_id);
      if (previous) {
        // Fiction was in previous rankings - calculate position change
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
        previousPosition: entry.position,
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

  // Calculate the sliding offset for smooth animations between days
  const calculateSlidingOffset = (entry: FictionMovement): number => {
    if (animationPhase !== 'sliding' || currentDayIndex === 0) return 0;

    console.log('🎬 Calculating movement for fiction:', entry.fiction_id, 'title:', entry.title, 'currentPosition:', entry.currentPosition, 'previousPosition:', entry.previousPosition);

    const previousDay = dailyRankings[currentDayIndex - 1];
    const currentDay = dailyRankings[currentDayIndex];
    if (!previousDay || !currentDay) return 0;

    // Find this fiction in the previous day's rankings
    const previousEntry = previousDay.rankings.find(r => r.fiction_id === entry.fiction_id);

    if (!previousEntry) {
      // Fiction is new, no movement needed
      console.log('🎬 Fiction is new, no movement needed:', entry.fiction_id);
      return 0;
    }

    // If the fiction has no position (0) or is outside our visible range, it should disappear
    if (entry.currentPosition === 0 || entry.currentPosition > 50) {
      console.log('🎬 Fiction has no position or is outside range, should disappear:', entry.fiction_id, 'position:', entry.currentPosition);
      return 0;
    }

    // Calculate the position change: how many positions did this item move?
    const positionChange = previousEntry.position - entry.currentPosition;

    if (positionChange === 0) {
      console.log('🎬 No position change for fiction:', entry.fiction_id);
      return 0;
    }

    // Only move "Magical Girl of Despair" with 66px per position
    if (entry.title === 'Magical Girl of Despair') {
      const movementOffset = positionChange * 66;

      console.log('%c🔍 MAGICAL GIRL OF DESPAIR - DETAILED MOVEMENT LOG 🔍', 'background: #FF6B6B; color: white; font-size: 16px; font-weight: bold; padding: 5px; border-radius: 5px;');
      console.log('%c📊 MOVEMENT DATA:', 'background: #4ECDC4; color: white; font-weight: bold;', {
        fictionId: entry.fiction_id,
        title: entry.title,
        previousPosition: previousEntry.position,
        currentPosition: entry.currentPosition,
        positionChange: positionChange,
        movementOffset: movementOffset,
        dayIndex: currentDayIndex,
        animationPhase: animationPhase,
        timestamp: new Date().toISOString(),
        functionCall: 'calculateSlidingOffset'
      });

      console.log('%c🧮 CALCULATION BREAKDOWN:', 'background: #45B7D1; color: white; font-weight: bold;', {
        previousPosition: previousEntry.position,
        currentPosition: entry.currentPosition,
        calculation: `${previousEntry.position} - ${entry.currentPosition} = ${positionChange}`,
        pixelCalculation: `${positionChange} × 66px = ${movementOffset}px`,
        direction: positionChange > 0 ? 'DOWN' : positionChange < 0 ? 'UP' : 'NO MOVEMENT'
      });

      return movementOffset;
    }

    // All other fictions get no movement
    console.log('🎬 Fiction not moving (not Magical Girl of Despair):', entry.fiction_id, 'title:', entry.title);
    return 0;
  };

  // Removed unused calculateScrollOffset function

  const startAnimation = () => {
    if (dailyRankings.length === 0) return;

    console.log('🎬 startAnimation called with dailyRankings.length:', dailyRankings.length);
    console.log('🎬 Current shouldStopAnimationRef.current:', shouldStopAnimationRef.current);
    console.log('🎬 Current isPlaying:', isPlaying);

    // Reset the stop flag when starting animation
    shouldStopAnimationRef.current = false;
    console.log('🎬 Reset shouldStopAnimationRef.current to false');

    setIsPlaying(true);

    // If we have a followed fiction, find the first day it appears
    let startDayIndex = 0;
    if (followedFiction) {
      for (let i = 0; i < dailyRankings.length; i++) {
        const day = dailyRankings[i];
        if (day.rankings.find(r => r.fiction_id === followedFiction)) {
          startDayIndex = i;
          break;
        }
      }
    }

    console.log('🎬 Starting animation from day index:', startDayIndex);
    setCurrentDayIndex(startDayIndex);
    setAnimationPhase('start');

    // Start the animation loop using recursive setTimeout for proper sequencing
    const animateNextDay = (dayIndex: number) => {
      console.log('🎬 animateNextDay called with dayIndex:', dayIndex, 'total days:', dailyRankings.length);

      if (shouldStopAnimationRef.current) {
        console.log('🎬 Animation stopped by user - shouldStopAnimationRef.current is true');
        return;
      }

      if (dayIndex >= dailyRankings.length - 1) {
        // Animation complete - stay on the last day
        console.log('🎬 Animation complete - reached last day');
        setIsPlaying(false);
        setAnimationPhase('end');
        setShowNewPosition(false);
        shouldStopAnimationRef.current = false;
        console.log('🎬 Reset shouldStopAnimationRef.current to false');
        return;
      }

      // Phase 1: Start sliding animation with OLD position numbers visible
      setShowNewPosition(false);
      setAnimationPhase('sliding');
      console.log('🎬 Animation phase: SLIDING for day', dayIndex + 1);

      // Phase 2: After sliding animation completes, show NEW positions and pause for 3 seconds
      setTimeout(() => {
        if (shouldStopAnimationRef.current) return;

        // Show new positions immediately when movement completes
        setShowNewPosition(true);
        setAnimationPhase('start');
        console.log('🎬 Animation phase: COMPLETED - showing NEW positions for day', dayIndex + 1);

        // Pause for 3 seconds to let users see the new positions
        setTimeout(() => {
          if (shouldStopAnimationRef.current) return;

          // Reset and move to next day
          setAnimationPhase('start');
          setShowNewPosition(false);
          console.log('🎬 Moving to next day:', dayIndex + 2);
          setCurrentDayIndex(dayIndex + 1);

          // Schedule the next day's animation
          setTimeout(() => {
            if (!shouldStopAnimationRef.current) {
              console.log('🎬 Scheduling next day animation for day', dayIndex + 2);
              animateNextDay(dayIndex + 1);
            }
          }, 500); // Small delay before starting next day
        }, 3000); // 3 second pause to show new positions
      }, 3000); // 3 second sliding animation
    };

    // Start the first day's animation
    animateNextDay(startDayIndex);
  };

  const stopAnimation = () => {
    console.log('🛑 stopAnimation called');
    setIsPlaying(false);
    // Don't reset currentDayIndex - stay on the current day
    setAnimationPhase('start');
    setShowNewPosition(false);
    shouldStopAnimationRef.current = true;
    console.log('🛑 Set shouldStopAnimationRef.current to true');
    // Clear any pending timeouts by setting a flag
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    console.log('🧹 useEffect cleanup setup - component mounted');
    return () => {
      console.log('🧹 useEffect cleanup running - component unmounting');
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
  const displayRankings = visibleRankings;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Rising Stars Animation</h1>


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
            className={`h-2 rounded-full transition-all duration-300 ease-out ${showNewPosition ? 'bg-yellow-500' :
              animationPhase === 'sliding' ? 'bg-green-500' :
                'bg-blue-600'
              }`}
            style={{ width: `${((currentDayIndex + 1) / dailyRankings.length) * 100}%` }}
          />
        </div>
        {/* Animation Phase Indicator */}
        <div className="text-center text-xs text-gray-500">
          {showNewPosition ? '📊 POSITION UPDATE - Numbers changing before movement' :
            animationPhase === 'sliding' ? '🎬 MOVEMENT - Fictions sliding to new positions' :
              '⏸️ Ready for next animation'}
        </div>
      </div>

      {/* Focused View Indicator */}
      {followedFiction && (
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
        <div
          className="space-y-1 w-full max-w-4xl mx-auto px-4 sm:px-6"
        >
          {(() => {
            return displayRankings.map((entry) => {
              const isFollowed = followedFiction === entry.fiction_id;
              const positionChange = entry.previousPosition ? entry.previousPosition - entry.currentPosition : 0;
              const isRising = positionChange > 0;
              const isFalling = positionChange < 0;

              return (
                <div
                  key={entry.fiction_id}
                  className={`flex items-center p-2 rounded-lg border min-w-[800px] transition-all duration-500 ${isFollowed
                    ? showNewPosition ? 'bg-yellow-300 border-yellow-500 shadow-2xl ring-2 ring-yellow-400' : 'bg-yellow-100 border-yellow-300 shadow-lg'
                    : entry.isNew
                      ? 'bg-green-50 border-green-200'
                      : isRising
                        ? 'bg-green-50 border-green-200'
                        : isFalling
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  style={{
                    transform: (() => {
                      const offset = calculateSlidingOffset(entry);
                      if (entry.title === 'Magical Girl of Despair') {
                        console.log('%c🎯 MAGICAL GIRL OF DESPAIR - TRANSFORM APPLIED 🎯', 'background: #FFD93D; color: black; font-size: 16px; font-weight: bold; padding: 5px; border-radius: 5px;');
                        console.log('%c⚡ TRANSFORM DATA:', 'background: #FF8E53; color: white; font-weight: bold;', {
                          fictionId: entry.fiction_id,
                          title: entry.title,
                          animationPhase,
                          offset,
                          transform: `translateY(${offset}px)`,
                          timestamp: new Date().toISOString()
                        });
                      }
                      return animationPhase === 'sliding'
                        ? `translateY(${offset}px)`
                        : 'translateY(0px)';
                    })(),
                    transition: animationPhase === 'sliding'
                      ? 'transform 1s ease-in-out'
                      : 'all 0.5s ease-out'
                  }}
                  onClick={(event) => {
                    const offset = calculateSlidingOffset(entry);
                    const target = event.currentTarget as HTMLElement;
                    console.log('🎬 Entry clicked:', {
                      fictionId: entry.fiction_id,
                      title: entry.title,
                      currentPosition: entry.currentPosition,
                      previousPosition: entry.previousPosition,
                      animationPhase,
                      slidingOffset: offset,
                      transform: `translateY(${offset}px)`,
                      // Get the actual DOM element position
                      domElement: target,
                      rect: target.getBoundingClientRect()
                    });
                  }}
                >
                  {/* Position with change indicator */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mr-4 relative">
                    <div className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-500 ${entry.isNew
                      ? 'bg-green-600 text-white'
                      : isRising
                        ? 'bg-green-600 text-white'
                        : isFalling
                          ? 'bg-yellow-600 text-white'
                          : 'bg-blue-600 text-white'
                      } ${showNewPosition ? 'scale-125 shadow-xl ring-4 ring-yellow-300' : ''}`}>
                      {/* Show new position during the pause phase, current position otherwise */}
                      {showNewPosition && currentDayIndex < dailyRankings.length - 1 ?
                        (() => {
                          const nextDay = dailyRankings[currentDayIndex + 1];
                          if (nextDay) {
                            const nextDayEntry = nextDay.rankings.find(r => r.fiction_id === entry.fiction_id);
                            if (nextDayEntry && nextDayEntry.position !== entry.currentPosition) {
                              // Position is changing - show the new position with dramatic styling
                              return (
                                <span className="text-white font-bold text-2xl">
                                  {nextDayEntry.position}
                                </span>
                              );
                            }
                            return nextDayEntry ? nextDayEntry.position : entry.currentPosition;
                          }
                          return entry.currentPosition;
                        })() :
                        entry.currentPosition
                      }
                    </div>
                    {!entry.isNew && positionChange !== 0 && !showNewPosition && (
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
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {entry.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {entry.author_name}
                    </p>
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