import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Footer from '@/components/Footer';

interface SiteStatistics {
  users: {
    total: number;
    active: number;
  };
  fiction: {
    total: number;
  };
  coffee_donations: {
    count: number;
    total_revenue: number;
    average_per_day: number;
  };
  recent_activity: {
    new_fictions: number;
    active_users: number;
  };
}

const Admin: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<SiteStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Redirect if not admin
  if (!isAuthenticated || !user?.admin) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load site statistics
      const statsResponse = await fetch('/api/admin/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin data...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUserInfo={true} showAboutLink={true} />

      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name || user?.email}</p>
        </div>

        {/* Site Statistics */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Site Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <h3
                  className="text-lg font-medium text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => navigate('/admin/users')}
                  title="Click to manage users"
                >
                  Users
                </h3>
                <div className="text-3xl font-bold text-blue-600">{stats.users.total.toLocaleString()}</div>
                <p className="text-sm text-gray-500">Active: {stats.users.active.toLocaleString()}</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Fiction</h3>
                <div className="text-3xl font-bold text-green-600">{stats.fiction.total.toLocaleString()}</div>
                <p className="text-sm text-gray-500">Total fictions</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Coffee Donations</h3>
                <div className="text-3xl font-bold text-purple-600">${stats.coffee_donations.total_revenue.toFixed(2)}</div>
                <p className="text-sm text-gray-500">{stats.coffee_donations.count} donations</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Activity (7d)</h3>
                <div className="text-3xl font-bold text-orange-600">{stats.recent_activity.new_fictions}</div>
                <p className="text-sm text-gray-500">New fictions</p>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
