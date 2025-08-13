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

  // Create chart data with all dates, filling in missing values
  const chartData = allDates.map(date => {
    const dataPoint: any = {
      date: date // Keep date in UTC format (YYYY-MM-DD)
    };
    // Find entries for this date and add genre positions
    risingStarsData.forEach(entry => {
      if (entry.captured_at === date) {
        dataPoint[entry.genre] = entry.position;
      }
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

  // Get unique genres
  const genres = Array.from(new Set(risingStarsData.map(entry => entry.genre)));
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
                `Position ${value}`,
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
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        {genres.map((genre, index) => {
          const color = colors[index % colors.length];
          const latestEntry = risingStarsData
            .filter(entry => entry.genre === genre)[0];
          const isVisible = visibleLines.has(genre);

          return (
            <div 
              key={genre} 
              className={`flex items-center space-x-2 cursor-pointer transition-opacity duration-200 ${
                isVisible ? 'opacity-100' : 'opacity-40'
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
                Position {latestEntry?.position || 'N/A'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RisingStarsChart; 