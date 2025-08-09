import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fictionAPI } from '../services/api';
import { Fiction } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Logo from '../components/Logo';

const Sponsor: React.FC = () => {
  console.log('🔗 Sponsor component rendered');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fiction, setFiction] = useState<Fiction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFiction = async () => {
      console.log('🔗 Sponsor page received ID:', id);
      if (!id) {
        setError('No fiction ID provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🔗 Calling fictionAPI.getFictionByRoyalRoadId with:', parseInt(id));
        const response = await fictionAPI.getFictionByRoyalRoadId(parseInt(id));
        console.log('🔗 API response:', response);
        if (response.success && response.data) {
          setFiction(response.data);
        } else {
          setError('Fiction not found');
        }
      } catch (err) {
        console.error('Error loading fiction:', err);
        setError('Failed to load fiction');
      } finally {
        setLoading(false);
      }
    };

    loadFiction();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !fiction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Fiction not found'}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Logo />
              <h1 className="text-2xl font-bold text-gray-900">
                Sponsor {fiction.title}
              </h1>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)}>
              ← Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fiction Info */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  About {fiction.title}
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Author</h3>
                    <p className="text-gray-600">{fiction.author}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {fiction.description || 'No description available'}
                    </p>
                  </div>

                  {fiction.tags && fiction.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {fiction.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Followers</h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {typeof fiction.followers === 'number' ? fiction.followers.toLocaleString() : '0'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Score</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {typeof fiction.score === 'number' ? fiction.score.toFixed(1) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sponsorship Info */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Sponsorship Information
                </h2>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">
                      Why Sponsor?
                    </h3>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      Sponsoring a fiction helps support the author and increases visibility for their work.
                      Sponsored fictions receive special placement and promotion across our platform.
                    </p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-green-900 mb-2">
                      Benefits
                    </h3>
                    <ul className="text-green-800 text-sm space-y-1">
                      <li>• Featured placement in fiction listings</li>
                      <li>• Special "Sponsored" badge</li>
                      <li>• Increased visibility to readers</li>
                      <li>• Support for the author</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-yellow-900 mb-2">
                      How It Works
                    </h3>
                    <p className="text-yellow-800 text-sm leading-relaxed">
                      Sponsorship is currently in development. Please check back soon for more information
                      about how to sponsor this fiction and support its author.
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      // TODO: Implement sponsorship functionality
                      alert('Sponsorship functionality coming soon!');
                    }}
                  >
                    Learn More About Sponsorship
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sponsor; 