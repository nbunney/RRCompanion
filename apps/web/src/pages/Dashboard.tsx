import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Card from '@/components/Card';
import FavoritesList from '@/components/FavoritesList';
import AddFiction from '@/components/AddFiction';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import type { RoyalRoadFiction } from '@/types';
import { formatLocalDate } from '@/utils/dateUtils';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [showAddFiction, setShowAddFiction] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debug logging
  console.log('🔐 Dashboard - Component rendered');
  console.log('🔐 Dashboard - User state:', { user: user ? { id: user.id, email: user.email, admin: user.admin, adminType: typeof user.admin } : 'null' });

  const handleFictionAdded = (fiction: RoyalRoadFiction) => {
    // Refresh the favorites list by incrementing the refresh key
    console.log('Fiction added:', fiction);
    setRefreshKey(prev => prev + 1);
    setShowAddFiction(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUserInfo={true} showAboutLink={true} />

      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Actions */}
          <div className="mb-8">
            <Card className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-4">
                <Button
                  variant="primary"
                  onClick={() => setShowAddFiction(!showAddFiction)}
                >
                  {showAddFiction ? 'Hide Add Fiction' : 'Add Fiction'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Add Fiction Section */}
          {showAddFiction && (
            <div className="mb-8">
              <AddFiction onFictionAdded={handleFictionAdded} />
            </div>
          )}

          {/* Favorites Section */}
          <div className="mb-8">
            <Card className="p-6">
              <FavoritesList key={refreshKey} />
            </Card>
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Profile Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900">{user?.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Member since</label>
                  <p className="text-sm text-gray-900">
                    {formatLocalDate(user?.created_at)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Welcome to RRCompanion
              </h2>
              <p className="text-gray-600 mb-4">
                This is your dashboard. You can add fictions from RoyalRoad by URL and manage your favorites.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  • Add fictions using the "Add Fiction" button above
                </p>
                <p className="text-sm text-gray-500">
                  • Click on any fiction to view details
                </p>
                <p className="text-sm text-gray-500">
                  • Add fictions to your favorites for easy access
                </p>

              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard; 