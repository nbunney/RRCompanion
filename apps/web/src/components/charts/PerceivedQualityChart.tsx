import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { FictionHistoryEntry } from '@/types';

interface PerceivedQualityChartProps {
  history: FictionHistoryEntry[];
}

const PerceivedQualityChart: React.FC<PerceivedQualityChartProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">Perceived Quality Metrics</h4>
        <div className="w-full h-64 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div>No data available</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-md font-medium text-gray-700 mb-3">Perceived Quality Metrics</h4>
      <div className="w-full h-64 bg-white border border-gray-200 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history
            .filter(entry => entry.captured_at)
            .sort((a, b) => new Date(a.captured_at!).getTime() - new Date(b.captured_at!).getTime())
            .map(entry => ({
              date: entry.captured_at!.split('T')[0], // Keep date in UTC format (YYYY-MM-DD)
              overallScore: entry.overall_score,
              styleScore: entry.style_score,
              storyScore: entry.story_score,
              grammarScore: entry.grammar_score,
              characterScore: entry.character_score,
            }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
            />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="overallScore" stroke="#8884d8" name="Overall Score" />
            <Line type="monotone" dataKey="styleScore" stroke="#82ca9d" name="Style Score" />
            <Line type="monotone" dataKey="storyScore" stroke="#ffc658" name="Story Score" />
            <Line type="monotone" dataKey="grammarScore" stroke="#ff7300" name="Grammar Score" />
            <Line type="monotone" dataKey="characterScore" stroke="#ff0000" name="Character Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerceivedQualityChart; 