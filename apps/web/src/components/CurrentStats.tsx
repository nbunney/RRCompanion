import React from 'react';
import { formatLocalDate } from '@/utils/dateUtils';

interface FictionData {
  pages: number;
  followers: number;
  views: number;
  ratings: number;
  favorites: number;
  overall_score: number;
}

interface FictionHistoryEntry {
  style_score: number;
  story_score: number;
  grammar_score: number;
  character_score: number;
  total_views: number;
  average_views: number;
  captured_at?: string;
}

interface CurrentStatsProps {
  fictionData: FictionData;
  latestHistory?: FictionHistoryEntry;
}

const CurrentStats: React.FC<CurrentStatsProps> = ({ fictionData, latestHistory }) => {
  if (!fictionData) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
        📊 Current Stats
        <span className="ml-2 text-sm font-normal text-gray-600">
          (as of {latestHistory?.captured_at ? formatLocalDate(latestHistory.captured_at) : 'Unknown Date'})
        </span>
      </h3>

      {/* Primary Stats - Large Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {typeof fictionData.pages === 'number' ? fictionData.pages.toLocaleString() : 'N/A'}
          </div>
          <div className="text-sm text-gray-500">Pages</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {typeof fictionData.overall_score === 'number' ? fictionData.overall_score.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-gray-500">Overall Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {typeof fictionData.followers === 'number' ? fictionData.followers.toLocaleString() : 'N/A'}
          </div>
          <div className="text-sm text-gray-500">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {typeof fictionData.views === 'number' ? fictionData.views.toLocaleString() : 'N/A'}
          </div>
          <div className="text-sm text-gray-500">Views</div>
        </div>
      </div>

      {/* All Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Ratings:</span>
          <span className="text-gray-900">{typeof fictionData.ratings === 'number' ? fictionData.ratings.toLocaleString() : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Favorites:</span>
          <span className="text-gray-900">{typeof fictionData.favorites === 'number' ? fictionData.favorites.toLocaleString() : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Overall Score:</span>
          <span className="text-gray-900">{typeof fictionData.overall_score === 'number' ? fictionData.overall_score.toFixed(1) : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Style Score:</span>
          <span className="text-gray-900">{typeof latestHistory?.style_score === 'number' ? latestHistory.style_score.toFixed(1) : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Story Score:</span>
          <span className="text-gray-900">{typeof latestHistory?.story_score === 'number' ? latestHistory.story_score.toFixed(1) : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Grammar Score:</span>
          <span className="text-gray-900">{typeof latestHistory?.grammar_score === 'number' ? latestHistory.grammar_score.toFixed(1) : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Character Score:</span>
          <span className="text-gray-900">{typeof latestHistory?.character_score === 'number' ? latestHistory.character_score.toFixed(1) : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Total Views:</span>
          <span className="text-gray-900">{typeof latestHistory?.total_views === 'number' ? latestHistory.total_views.toLocaleString() : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Average Views:</span>
          <span className="text-gray-900">{typeof latestHistory?.average_views === 'number' ? latestHistory.average_views.toLocaleString() : 'N/A'}</span>
        </div>
      </div>


    </div>
  );
};

export default CurrentStats; 