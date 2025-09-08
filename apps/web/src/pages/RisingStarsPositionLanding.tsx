import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import api from '@/services/api';

interface UserFiction {
  id: number;
  fiction_id: number;
  is_favorite: boolean;
  fiction: {
    id: number;
    royalroad_id: string;
    title: string;
    author_name: string;
  };
}

const RisingStarsPositionLanding: React.FC = () => {
  const [fictionId, setFictionId] = useState('');
  const [royalroadUrl, setRoyalroadUrl] = useState('');
  const [inputMethod, setInputMethod] = useState<'id' | 'url' | 'favorite'>('url');
  const [favorites, setFavorites] = useState<UserFiction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  useEffect(() => {
    // If user has favorites, default to favorites method
    if (user && favorites.length > 0 && inputMethod === 'url') {
      setInputMethod('favorite');
    }
  }, [user, favorites, inputMethod]);

  const fetchFavorites = async () => {
    try {
      const response = await api.get('/userFictions/favorites');

      if (response.data.success) {
        setFavorites(response.data.data.userFictions);
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  const extractFictionIdFromUrl = (url: string): string | null => {
    // Handle various Royal Road URL formats
    const patterns = [
      /royalroad\.com\/fiction\/(\d+)/,
      /royalroad\.com\/fiction\/(\d+)\/.*/,
      /www\.royalroad\.com\/fiction\/(\d+)/,
      /www\.royalroad\.com\/fiction\/(\d+)\/.*/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let finalFictionId = '';

      if (inputMethod === 'url') {
        const extractedId = extractFictionIdFromUrl(royalroadUrl);
        if (!extractedId) {
          setError('Invalid Royal Road URL. Please make sure it contains a fiction ID.');
          return;
        }
        finalFictionId = extractedId;
      } else if (inputMethod === 'favorite') {
        finalFictionId = fictionId;
      } else {
        finalFictionId = fictionId.trim();
      }

      if (!finalFictionId) {
        setError('Please enter a fiction ID or URL');
        return;
      }

      // Validate that the fiction exists (only for logged-in users)
      if (user) {
        try {
          const response = await api.get(`/fictions/${finalFictionId}/exists`);
          const data = response.data;

          if (!data.success || !data.data.exists) {
            setError('Fiction not found. Please check your ID or URL.');
            return;
          }
        } catch (err) {
          setError('Error validating fiction. Please check your ID or URL.');
          return;
        }
      }

      navigate(`/rising-stars-position/${finalFictionId}`);
    } catch (err) {
      setError('Network error occurred. Please try again.');
      console.error('Error validating fiction:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteSelect = (favorite: UserFiction) => {
    setFictionId(favorite.fiction.royalroad_id);
    setInputMethod('favorite');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Rising Stars Position Calculator" />

      <main className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Rising Stars Position Calculator
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Calculate how close your fiction is to making it to Rising Stars Main page
            </p>
          </div>

          {/* Input Method Selection */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              {user && favorites.length > 0 && (
                <button
                  type="button"
                  onClick={() => setInputMethod('favorite')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${inputMethod === 'favorite'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  ⭐ Choose from Favorites
                </button>
              )}
              <button
                type="button"
                onClick={() => setInputMethod('url')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${inputMethod === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                🔗 Enter Royal Road URL
              </button>
              <button
                type="button"
                onClick={() => setInputMethod('id')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${inputMethod === 'id'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                📝 Enter Fiction ID
              </button>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {inputMethod === 'id' && (
              <div>
                <label htmlFor="fictionId" className="block text-sm font-medium text-gray-700 mb-2">
                  Fiction ID
                </label>
                <input
                  type="text"
                  id="fictionId"
                  value={fictionId}
                  onChange={(e) => setFictionId(e.target.value)}
                  placeholder="Enter your fiction's Royal Road ID (e.g., 12345)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  You can find your fiction ID in the URL of your fiction page on Royal Road
                </p>
              </div>
            )}

            {inputMethod === 'url' && (
              <div>
                <label htmlFor="royalroadUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Royal Road URL
                </label>
                <input
                  type="url"
                  id="royalroadUrl"
                  value={royalroadUrl}
                  onChange={(e) => setRoyalroadUrl(e.target.value)}
                  placeholder="https://www.royalroad.com/fiction/12345/your-fiction-title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Paste the full URL from your fiction page on Royal Road
                </p>
              </div>
            )}

            {inputMethod === 'favorite' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select from Your Favorites
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-4">
                  {favorites.map((favorite) => (
                    <button
                      key={favorite.id}
                      type="button"
                      onClick={() => handleFavoriteSelect(favorite)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${fictionId === favorite.fiction.royalroad_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="font-medium text-gray-900">{favorite.fiction.title}</div>
                      <div className="text-sm text-gray-600">by {favorite.fiction.author_name}</div>
                      <div className="text-xs text-gray-500">ID: {favorite.fiction.royalroad_id}</div>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Click on a fiction to select it for position calculation
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (inputMethod === 'favorite' && !fictionId)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Validating...' : 'Calculate Position'}
            </button>
          </form>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works:</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Analyzes your fiction's position across all Rising Stars genres</li>
              <li>• Calculates how many fictions are ahead of you</li>
              <li>• Shows exactly how many positions you need to climb to reach Main</li>
              <li>• Uses the most recent Rising Stars data (updated every 15 minutes)</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Data is updated every 15 minutes at 1 minute past each quarter hour
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RisingStarsPositionLanding;
