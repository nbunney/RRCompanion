import React from 'react';
import { formatLocalDate } from '@/utils/dateUtils';

interface FictionHistoryEntry {
  pages: number;
  overall_score: string | number;
  followers: number;
  views: number;
  ratings: number;
  favorites: number;
  style_score: string | number;
  story_score: string | number;
  grammar_score: string | number;
  character_score: string | number;
  total_views: number;
  average_views: number;
  captured_at?: string;
}

interface CurrentStatsProps {
  latestHistory?: FictionHistoryEntry;
}

const CurrentStats: React.FC<CurrentStatsProps> = ({ latestHistory }) => {
  console.log('🔗 Latest history:', latestHistory);
  if (!latestHistory) {
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
            {typeof latestHistory.pages === 'number' ? latestHistory.pages.toLocaleString() : 'N/A'}
          </div>
          <div className="text-sm text-gray-500">Pages</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {latestHistory.overall_score && latestHistory.overall_score !== '' ? latestHistory.overall_score : 'N/A'}
          </div>
          <div className="text-sm text-gray-500">Overall Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {typeof latestHistory.followers === 'number' ? latestHistory.followers.toLocaleString() : 'N/A'}
          </div>
          <div className="text-sm text-gray-500">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {typeof latestHistory.total_views === 'number' ? latestHistory.total_views.toLocaleString() : 'N/A'}
          </div>
          <div className="text-sm text-gray-500">Views</div>
        </div>
      </div>

      {/* All Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Ratings:</span>
          <span className="text-gray-900">{typeof latestHistory.ratings === 'number' ? latestHistory.ratings.toLocaleString() : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Favorites:</span>
          <span className="text-gray-900">{typeof latestHistory.favorites === 'number' ? latestHistory.favorites.toLocaleString() : 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Overall Score:</span>
          <span className="text-gray-900">{latestHistory.overall_score && latestHistory.overall_score !== '' ? latestHistory.overall_score : 'N/A'}</span>
        </div>
        {/* Only show score fields if they have non-zero values */}
        {latestHistory?.style_score && latestHistory.style_score !== '' && latestHistory.style_score !== '0.00' && latestHistory.style_score !== 0 && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Style Score:</span>
            <span className="text-gray-900">{latestHistory.style_score}</span>
          </div>
        )}
        {latestHistory?.story_score && latestHistory.story_score !== '' && latestHistory.story_score !== '0.00' && latestHistory.story_score !== 0 && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Story Score:</span>
            <span className="text-gray-900">{latestHistory.story_score}</span>
          </div>
        )}
        {latestHistory?.grammar_score && latestHistory.grammar_score !== '' && latestHistory.grammar_score !== '0.00' && latestHistory.grammar_score !== 0 && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Grammar Score:</span>
            <span className="text-gray-900">{latestHistory.grammar_score}</span>
          </div>
        )}
        {latestHistory?.character_score && latestHistory.character_score !== '' && latestHistory.character_score !== '0.00' && latestHistory.character_score !== 0 && (
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Character Score:</span>
            <span className="text-gray-900">{latestHistory.character_score}</span>
          </div>
        )}
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