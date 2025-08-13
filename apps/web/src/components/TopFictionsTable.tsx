import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fictionAPI, risingStarsAPI } from '@/services/api';
import { createFictionSlug } from '@/utils';

interface TopFiction {
  id: number;
  title: string;
  author_name: string;
  royalroad_id: string;
  followers?: number;
  user_count?: number;
  position?: number;
  genre?: string;
  captured_at?: string; // Added for timestamp
}

const TopFictionsTable: React.FC = () => {
  const [topRisingStars, setTopRisingStars] = useState<TopFiction[]>([]);
  const [popularFictions, setPopularFictions] = useState<TopFiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [royalRoadDataTimestamp, setRoyalRoadDataTimestamp] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch top 5 Rising Stars
        const risingStarsResponse = await risingStarsAPI.getTopRisingStars(5);
        if (risingStarsResponse.success && risingStarsResponse.data) {
          setTopRisingStars(risingStarsResponse.data);

          // Extract the timestamp from the Rising Stars data
          if (risingStarsResponse.data.length > 0) {
            const capturedAt = risingStarsResponse.data[0].captured_at;
            if (capturedAt) {
              setRoyalRoadDataTimestamp(new Date(capturedAt));
            }
          }
        }

        // Fetch top 5 popular fictions
        const popularResponse = await fictionAPI.getPopularFictionsBySiteUsers(5);
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
            {royalRoadDataTimestamp && (
              <span className="text-sm text-gray-500 font-normal ml-2">
                (as of: {royalRoadDataTimestamp.toLocaleString()})
              </span>
            )}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                </tr>
              </thead>
              <tbody>
                {topRisingStars.map((fiction, index) => (
                  <tr key={fiction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-sm text-gray-600 font-medium">#{fiction.position || index + 1}</td>
                    <td className="py-2 px-2 text-sm">
                      <Link to={`/fiction/${fiction.royalroad_id}/${createFictionSlug(fiction.title)}`} className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                        {fiction.title}
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-sm text-gray-600">{fiction.author_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 Popular Fictions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            📚 Most Popular on Site
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="py-2 px-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                </tr>
              </thead>
              <tbody>
                {popularFictions.map((fiction, index) => (
                  <tr key={fiction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 text-sm text-gray-600 font-medium">#{index + 1}</td>
                    <td className="py-2 px-2 text-sm">
                      <Link to={`/fiction/${fiction.royalroad_id}/${createFictionSlug(fiction.title)}`} className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                        {fiction.title}
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-sm text-gray-600">{fiction.author_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Last Updated Info */}
      <div className="mt-4 text-center text-sm text-gray-500 space-y-1">
        {royalRoadDataTimestamp && (
          <div>
            As of: {royalRoadDataTimestamp.toLocaleString()} (local time)
          </div>
        )}
        {lastUpdated && (
          <div>
            Frontend refreshed: {lastUpdated.toLocaleTimeString()} •
            Data refreshes every 10 minutes
          </div>
        )}
      </div>
    </div>
  );
};

export default TopFictionsTable;
