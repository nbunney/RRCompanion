import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RisingStarEntry {
  captured_at: string;
  position: number;
  genre: string;
}

interface RisingStarsChartProps {
  risingStarsData: RisingStarEntry[];
}

const RisingStarsChart: React.FC<RisingStarsChartProps> = ({ risingStarsData }) => {
  const [visibleLines, setVisibleLines] = useState<Set<string>>(new Set());

  // Initialize all lines as visible when component mounts or data changes
  useEffect(() => {
    const genres = Array.from(new Set(risingStarsData.map(entry => entry.genre)));
    setVisibleLines(new Set(genres));
  }, [risingStarsData]);

  if (risingStarsData.length === 0) {
    return null;
  }

  // Create a continuous date range from earliest to latest date
  const dates = risingStarsData.map(entry => entry.captured_at);
  const earliestDate = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
  const latestDate = new Date(Math.max(...dates.map(d => new Date(d).getTime())));

  // Generate all dates in the range
  const allDates: string[] = [];
  const currentDate = new Date(earliestDate);
  while (currentDate <= latestDate) {
    allDates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Create chart data with all dates, handling multiple entries per day
  const chartData = allDates.map(date => {
    const dataPoint: any = {
      date: date // Keep date in UTC format (YYYY-MM-DD)
    };

    // Find all entries for this date and handle multiple entries per day
    const entriesForDate = risingStarsData.filter(entry =>
      entry.captured_at.startsWith(date)
    );

    // Group entries by genre and take the latest entry for each genre per day
    const genreMap = new Map<string, RisingStarEntry>();
    entriesForDate.forEach(entry => {
      const existing = genreMap.get(entry.genre);
      if (!existing || new Date(entry.captured_at) > new Date(existing.captured_at)) {
        genreMap.set(entry.genre, entry);
      }
    });

    // Add the latest position for each genre to the data point
    genreMap.forEach((entry, genre) => {
      dataPoint[genre] = entry.position;
    });

    return dataPoint;
  });

  // Handle legend item click to toggle line visibility
  const handleLegendClick = (genre: string) => {
    setVisibleLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genre)) {
        newSet.delete(genre);
      } else {
        newSet.add(genre);
      }
      return newSet;
    });
  };

  // Get unique genres, sort with Main first, then by best position
  const allGenres = Array.from(new Set(risingStarsData.map(entry => entry.genre)));
  const genres = allGenres.sort((a, b) => {
    // Always put 'main' first
    if (a === 'main') return -1;
    if (b === 'main') return 1;

    // For other genres, sort by highest position (lowest number)
    const aEntries = risingStarsData.filter(entry => entry.genre === a);
    const bEntries = risingStarsData.filter(entry => entry.genre === b);

    const aBestPosition = aEntries.length > 0 ? Math.min(...aEntries.map(entry => entry.position)) : 999;
    const bBestPosition = bEntries.length > 0 ? Math.min(...bEntries.map(entry => entry.position)) : 999;

    return aBestPosition - bBestPosition;
  });
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#8B4513', '#000000'];

  return (
    <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <h4 className="text-md font-medium text-gray-700 mb-3">⭐ Rising Stars Performance</h4>
      <div className="w-full h-64 bg-white border border-gray-200 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              domain={[1, 50]}
              reversed={true}
              ticks={[1, 10, 20, 30, 40, 50]}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              formatter={(value: any, name: any) => [
                `${value}`,
                name === 'main' ? 'Main' : name.charAt(0).toUpperCase() + name.slice(1)
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />

            {/* Create a line for each genre (only if visible) */}
            {genres.map((genre, index) => {
              if (!visibleLines.has(genre)) return null;

              const color = colors[index % colors.length];
              return (
                <Line
                  key={genre}
                  type="monotone"
                  dataKey={genre}
                  stroke={color}
                  name={genre === 'main' ? 'Main' : genre.charAt(0).toUpperCase() + genre.slice(1)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls={true}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Clickable Legend with genre breakdown */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        {genres.map((genre, index) => {
          const color = colors[index % colors.length];
          const genreEntries = risingStarsData.filter(entry => entry.genre === genre);
          const currentEntry = genreEntries
            .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime())[0];
          const highestPosition = genreEntries.length > 0
            ? Math.min(...genreEntries.map(entry => entry.position))
            : null;
          const isVisible = visibleLines.has(genre);

          return (
            <div
              key={genre}
              className={`flex items-center space-x-2 cursor-pointer transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-40'
                }`}
              onClick={() => handleLegendClick(genre)}
              title={`Click to ${isVisible ? 'hide' : 'show'} ${genre === 'main' ? 'Main' : genre.charAt(0).toUpperCase() + genre.slice(1)}`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium">
                {genre === 'main' ? 'Main' : genre.charAt(0).toUpperCase() + genre.slice(1)}:
              </span>
              <span className="text-gray-600">
                {currentEntry?.position ? `#${currentEntry.position}` : 'N/A'}
              </span>
              {highestPosition && (
                <span className="text-xs text-gray-500">
                  (best: #{highestPosition})
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RisingStarsChart; 