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
    if (isAuthenticated && user?.admin) {
      loadUsers();
    }
  }, [isAuthenticated, user]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.data);
        }
      }
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.admin) {
    navigate('/dashboard');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showUserInfo={true} showAboutLink={true} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <Button variant="outline" onClick={() => navigate('/admin')} className="mt-4">
              ← Back to Admin
            </Button>
          </div>

          <Card className="p-6">
            {users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fictions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Favorites</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sponsored</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Since</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userStats) => (
                    <tr key={userStats.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{userStats.name || 'No Name'}</div>
                        <div className="text-sm text-gray-500">{userStats.email}</div>
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4 text-sm text-gray-900">{userStats.fiction_count}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{userStats.favorites_count}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{userStats.sponsored_count}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(userStats.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminUsers;
