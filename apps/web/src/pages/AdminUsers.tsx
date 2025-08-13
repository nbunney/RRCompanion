import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';

interface UserStats {
  id: number;
  name: string;
  email: string;
  admin: boolean;
  created_at: string;
  fiction_count: number;
  favorites_count: number;
  sponsored_count: number;
}

const AdminUsers: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect non-admin users
    if (isAuthenticated && user && !user.admin) {
      navigate('/dashboard');
      return;
    }

    if (isAuthenticated && user?.admin) {
      loadUsers();
    }
  }, [isAuthenticated, user, navigate]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showUserInfo={false} showAboutLink={true} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user?.admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showUserInfo={true} showAboutLink={true} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to access this page.</p>
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard')}
              className="mt-4"
            >
              Go to Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showUserInfo={true} showAboutLink={true} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showUserInfo={true} showAboutLink={true} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              variant="primary"
              onClick={loadUsers}
              className="mr-2"
            >
              Retry
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
            >
              Back to Admin
            </Button>
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
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-2">View and manage all registered users</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/admin')}
              >
                ← Back to Admin
              </Button>
            </div>
          </div>

          {/* Users List */}
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fictions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Favorites
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sponsored
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member Since
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userStats) => (
                    <tr key={userStats.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {userStats.name || 'No Name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userStats.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userStats.admin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userStats.fiction_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userStats.favorites_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userStats.sponsored_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(userStats.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found.</p>
              </div>
            )}
          </Card>

          {/* Summary Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Users</h3>
              <div className="text-3xl font-bold text-blue-600">
                {users.length.toLocaleString()}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Admins</h3>
              <div className="text-3xl font-bold text-purple-600">
                {users.filter(u => u.admin).length.toLocaleString()}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Fictions</h3>
              <div className="text-3xl font-bold text-green-600">
                {users.reduce((sum, u) => sum + u.fiction_count, 0).toLocaleString()}
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Total Sponsored</h3>
              <div className="text-3xl font-bold text-orange-600">
                {users.reduce((sum, u) => sum + u.sponsored_count, 0).toLocaleString()}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminUsers;
