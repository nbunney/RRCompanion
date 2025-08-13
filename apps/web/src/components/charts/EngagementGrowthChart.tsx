import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { FictionHistoryEntry } from '@/types';

interface EngagementGrowthChartProps {
  history: FictionHistoryEntry[];
}

const EngagementGrowthChart: React.FC<EngagementGrowthChartProps> = ({ history }) => {
  const [visibleLines, setVisibleLines] = useState<Set<string>>(new Set());

  // Initialize all lines as visible when component mounts or data changes
  useEffect(() => {
    const lines = ['pages', 'followers', 'totalViews', 'averageViews', 'ratings'];
    setVisibleLines(new Set(lines));
  }, [history]);

  if (!history || history.length === 0) {
    return (
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">Engagement & Growth Metrics</h4>
        <div className="w-full h-64 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <div>No data available</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle legend item click to toggle line visibility
  const handleLegendClick = (lineKey: string) => {
    setVisibleLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineKey)) {
        newSet.delete(lineKey);
      } else {
        newSet.add(lineKey);
      }
      return newSet;
    });
  };

  const chartData = history
    .filter(entry => entry.captured_at)
    .sort((a, b) => new Date(a.captured_at!).getTime() - new Date(b.captured_at!).getTime())
    .reduce((acc: any[], entry) => {
      const date = entry.captured_at!.split('T')[0];
      const existingDataPoint = acc.find(dp => dp.date === date);
      
      if (existingDataPoint) {
        // Update existing data point with latest values for this date
        existingDataPoint.pages = entry.pages;
        existingDataPoint.followers = entry.followers;
        existingDataPoint.totalViews = entry.total_views;
        existingDataPoint.averageViews = entry.average_views;
        existingDataPoint.ratings = entry.ratings;
      } else {
        // Create new data point for this date
        acc.push({
          date: date,
          pages: entry.pages,
          followers: entry.followers,
          totalViews: entry.total_views,
          averageViews: entry.average_views,
          ratings: entry.ratings,
        });
      }
      
      return acc;
    }, []);

  const lineConfigs = [
    { key: 'pages', name: 'Pages', stroke: '#8884d8', yAxisId: 'left' },
    { key: 'followers', name: 'Followers', stroke: '#82ca9d', yAxisId: 'left' },
    { key: 'ratings', name: 'Ratings', stroke: '#9c27b0', yAxisId: 'left' },
    { key: 'totalViews', name: 'Total Views', stroke: '#ffc658', yAxisId: 'right' },
    { key: 'averageViews', name: 'Average Views', stroke: '#ff7300', yAxisId: 'right' },
  ];

  return (
    <div className="mb-6">
      <h4 className="text-md font-medium text-gray-700 mb-3">Engagement & Growth Metrics</h4>
      <div className="w-full h-64 bg-white border border-gray-200 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            
            {/* Create lines only for visible metrics */}
            {lineConfigs.map(config => {
              if (!visibleLines.has(config.key)) return null;
              
              return (
                <Line 
                  key={config.key}
                  yAxisId={config.yAxisId as 'left' | 'right'} 
                  type="monotone" 
                  dataKey={config.key} 
                  stroke={config.stroke} 
                  name={config.name} 
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Clickable Legend */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
        {lineConfigs.map(config => {
          const isVisible = visibleLines.has(config.key);
          
          return (
            <div 
              key={config.key}
              className={`flex items-center space-x-2 cursor-pointer transition-opacity duration-200 ${
                isVisible ? 'opacity-100' : 'opacity-40'
              }`}
              onClick={() => handleLegendClick(config.key)}
              title={`Click to ${isVisible ? 'hide' : 'show'} ${config.name}`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.stroke }}
              />
              <span className="font-medium">{config.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EngagementGrowthChart; 