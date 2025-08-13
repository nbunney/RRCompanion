import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fictionAPI, risingStarsAPI } from '@/services/api';

interface TopFiction {
  id: number;
  title: string;
  author_name: string;
  royalroad_id: string;
  slug?: string;
  followers?: number;
  position?: number;
  genre?: string;
}

const TopFictionsTable: React.FC = () => {
  const [topRisingStars, setTopRisingStars] = useState<TopFiction[]>([]);
  const [popularFictions, setPopularFictions] = useState<TopFiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch top 5 Rising Stars
        const risingStarsResponse = await risingStarsAPI.getTopRisingStars(5);
        if (risingStarsResponse.success && risingStarsResponse.data) {
          setTopRisingStars(risingStarsResponse.data);
        }
        
        // Fetch top 5 popular fictions
        const popularResponse = await fictionAPI.getPopularFictions(5);
        if (popularResponse.success && popularResponse.data) {
          setPopularFictions(popularResponse.data);
        }
        
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching top fictions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 10 minutes (600,000 ms)
    const interval = setInterval(fetchData, 600000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Top Fictions
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Top Fictions
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Rising Stars */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            ⭐ Top 5 Rising Stars
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Rank</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Title</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Author</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Genre</th>
                </tr>
              </thead>
              <tbody>
                {topRisingStars.map((fiction, index) => (
                  <tr key={fiction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-sm text-gray-600 font-medium">
                      #{fiction.position || index + 1}
                    </td>
                    <td className="py-2 px-2 text-sm">
                      <Link
                        to={`/fiction/${fiction.royalroad_id}/${fiction.slug || ''}`}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        {fiction.title}
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-sm text-gray-600">
                      {fiction.author_name}
                    </td>
                    <td className="py-2 px-2 text-sm text-gray-600 capitalize">
                      {fiction.genre}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Popular Fictions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            📚 Most Popular Fictions
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Rank</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Title</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Author</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Followers</th>
                </tr>
              </thead>
              <tbody>
                {popularFictions.map((fiction, index) => (
                  <tr key={fiction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-sm text-gray-600 font-medium">
                      #{index + 1}
                    </td>
                    <td className="py-2 px-2 text-sm">
                      <Link
                        to={`/fiction/${fiction.royalroad_id}/${fiction.slug || ''}`}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        {fiction.title}
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-sm text-gray-600">
                      {fiction.author_name}
                    </td>
                    <td className="py-2 px-2 text-sm text-gray-600">
                      {fiction.followers ? formatNumber(fiction.followers) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Last Updated Info */}
      {lastUpdated && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()} • 
          Data refreshes every 10 minutes
        </div>
      )}
    </div>
  );
};

export default TopFictionsTable;
