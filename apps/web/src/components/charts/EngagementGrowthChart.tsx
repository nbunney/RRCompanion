import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { FictionHistoryEntry } from '@/types';

interface EngagementGrowthChartProps {
  history: FictionHistoryEntry[];
}

const EngagementGrowthChart: React.FC<EngagementGrowthChartProps> = ({ history }) => {
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

  return (
    <div className="mb-6">
      <h4 className="text-md font-medium text-gray-700 mb-3">Engagement & Growth Metrics</h4>
      <div className="w-full h-64 bg-white border border-gray-200 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history
            .filter(entry => entry.captured_at)
            .sort((a, b) => new Date(a.captured_at!).getTime() - new Date(b.captured_at!).getTime())
            .map(entry => ({
              date: entry.captured_at!.split('T')[0], // Keep date in UTC format (YYYY-MM-DD)
              pages: entry.pages,
              followers: entry.followers,
              totalViews: entry.total_views,
              averageViews: entry.average_views,
              ratings: entry.ratings,
            }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="pages" stroke="#8884d8" name="Pages" />
            <Line yAxisId="left" type="monotone" dataKey="followers" stroke="#82ca9d" name="Followers" />
            <Line yAxisId="left" type="monotone" dataKey="ratings" stroke="#9c27b0" name="Ratings" />
            <Line yAxisId="right" type="monotone" dataKey="totalViews" stroke="#ffc658" name="Total Views" />
            <Line yAxisId="right" type="monotone" dataKey="averageViews" stroke="#ff7300" name="Average Views" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EngagementGrowthChart; 