import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Footer from '@/components/Footer';

interface SiteStatistics {
  users: {
    total: number;
    active: number;
  };
  fiction: {
    total: number;
    sponsored: number;
    unsponsored: number;
  };
  sponsorships: {
    count: number;
    total_revenue: number;
    average_per_day: number;
  };
  recent_activity: {
    new_fictions: number;
    active_users: number;
  };
}

interface CouponCode {
  id: number;
  code: string;
  discount_percent: number;
  expires_at: string;
  created_at: string;
  used: boolean;
  used_by_user_id?: number;
  used_for_fiction_id?: number;
  used_at?: string;
  is_active: boolean;
  max_uses: number;
  current_uses: number;
}

const Admin: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<SiteStatistics | null>(null);
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCoupons, setGeneratingCoupons] = useState(false);
  const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [couponForm, setCouponForm] = useState({
    count: 1,
    expiresInDays: 30,
    maxUses: 1
  });
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

      // Load coupon codes
      const couponsResponse = await fetch('/api/admin/coupons', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const couponsData = await couponsResponse.json();

      if (couponsData.success) {
        setCoupons(couponsData.data);
      } else {
        console.error('❌ Failed to load coupons:', couponsData.error);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCoupons = async () => {
    try {
      setGeneratingCoupons(true);

      const response = await fetch('/api/admin/coupons/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          count: couponForm.count,
          expiresInDays: couponForm.expiresInDays,
          maxUses: couponForm.maxUses
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Generated ${data.data.coupons.length} coupon code(s)!`);
        loadData(); // Reload data to show new coupons
      } else {
        alert('Error generating coupons: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating coupons:', error);
      alert('Error generating coupons');
    } finally {
      setGeneratingCoupons(false);
    }
  };

  const deactivateCoupon = async (couponId: number) => {
    if (!confirm('Are you sure you want to deactivate this coupon code?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/coupons/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ couponId })
      });

      const data = await response.json();

      if (data.success) {
        alert('Coupon deactivated successfully!');
        loadData(); // Reload data
      } else {
        alert('Error deactivating coupon: ' + data.error);
      }
    } catch (error) {
      console.error('Error deactivating coupon:', error);
      alert('Error deactivating coupon');
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
                <p className="text-sm text-gray-500">Sponsored: {stats.fiction.sponsored.toLocaleString()}</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Revenue</h3>
                <div className="text-3xl font-bold text-purple-600">${stats.sponsorships.total_revenue.toFixed(2)}</div>
                <p className="text-sm text-gray-500">{stats.sponsorships.count} sponsorships</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Activity (7d)</h3>
                <div className="text-3xl font-bold text-orange-600">{stats.recent_activity.new_fictions}</div>
                <p className="text-sm text-gray-500">New fictions</p>
              </Card>
            </div>
          </div>
        )}

        {/* Coupon Code Management */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Coupon Code Management</h2>

          {/* Generate Coupons Form */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New Coupon Codes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Count</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={couponForm.count}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires In (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={couponForm.expiresInDays}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) || 30 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={couponForm.maxUses}
                  onChange={(e) => setCouponForm(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <Button
              onClick={generateCoupons}
              disabled={generatingCoupons}
              className="w-full md:w-auto"
            >
              {generatingCoupons ? 'Generating...' : 'Generate Coupon Codes'}
            </Button>
          </Card>

          {/* Existing Coupons */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Existing Coupon Codes</h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAllCoupons(!showAllCoupons)}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  {showAllCoupons ? '👁️ Show Active Only' : '👁️ Show All'}
                </Button>
                <Button
                  onClick={loadData}
                  variant="outline"
                  size="sm"
                  className="text-sm"
                >
                  🔄 Refresh
                </Button>
              </div>
            </div>

            {/* Summary Row */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">
                    {coupons.filter(c => c.is_active && (c.current_uses || 0) < (c.max_uses || 1) && new Date(c.expires_at) > new Date()).length} Active
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">
                    {coupons.filter(c => (c.current_uses || 0) >= (c.max_uses || 1)).length} Fully Used
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">
                    {coupons.filter(c => new Date(c.expires_at) <= new Date()).length} Expired
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
                  <span className="text-gray-700">
                    {coupons.filter(c => !c.is_active).length} Deactivated
                  </span>
                </div>
                {!showAllCoupons && (
                  <div className="flex items-center ml-auto">
                    <span className="text-gray-600 font-medium">
                      Toggle to see all {coupons.length} coupons
                    </span>
                  </div>
                )}
              </div>
            </div>

            {coupons.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No coupon codes found</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="mb-3 text-sm text-gray-600">
                  {showAllCoupons
                    ? `Showing all ${coupons.length} coupons`
                    : `Showing ${coupons.filter(c => c.is_active && (c.current_uses || 0) < (c.max_uses || 1) && new Date(c.expires_at) > new Date()).length} active coupons (${coupons.length} total)`
                  }
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(showAllCoupons ? coupons : coupons.filter(c =>
                      c.is_active &&
                      (c.current_uses || 0) < (c.max_uses || 1) &&
                      new Date(c.expires_at) > new Date()
                    )).map((coupon) => (
                      <tr key={coupon.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{coupon.code}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {coupon.discount_percent}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className={`font-medium ${(coupon.current_uses || 0) >= (coupon.max_uses || 1)
                              ? 'text-red-600'
                              : 'text-gray-900'
                              }`}>
                              {(coupon.current_uses || 0)} / {(coupon.max_uses || 1)}
                            </span>
                            {(coupon.max_uses || 1) > 1 && (
                              <span className={`text-xs ${(coupon.current_uses || 0) >= (coupon.max_uses || 1)
                                ? 'text-red-500'
                                : 'text-gray-500'
                                }`}>
                                {(coupon.max_uses || 1) - (coupon.current_uses || 0)} remaining
                              </span>
                            )}
                            {(coupon.current_uses || 0) >= (coupon.max_uses || 1) && (
                              <span className="text-xs text-red-500 font-medium">Fully Used</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(coupon.expires_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${coupon.is_active &&
                              (coupon.current_uses || 0) < (coupon.max_uses || 1) &&
                              new Date(coupon.expires_at) > new Date()
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {coupon.is_active &&
                                (coupon.current_uses || 0) < (coupon.max_uses || 1) &&
                                new Date(coupon.expires_at) > new Date()
                                ? 'Active'
                                : 'Inactive'
                              }
                            </span>
                            {!coupon.is_active && (
                              <span className="text-xs text-gray-500 mt-1">Deactivated</span>
                            )}
                            {coupon.is_active && (coupon.current_uses || 0) >= (coupon.max_uses || 1) && (
                              <span className="text-xs text-gray-500 mt-1">Fully Used</span>
                            )}
                            {coupon.is_active && new Date(coupon.expires_at) <= new Date() && (
                              <span className="text-xs text-gray-500 mt-1">Expired</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {coupon.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deactivateCoupon(coupon.id)}
                            >
                              Deactivate
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Coupon Statistics */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Coupon Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{coupons.length}</div>
                <div className="text-sm text-gray-500">Total Coupons</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {coupons.filter(c => c.is_active && (c.current_uses || 0) < (c.max_uses || 1) && new Date(c.expires_at) > new Date()).length}
                </div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {coupons.filter(c => new Date(c.expires_at) <= new Date()).length}
                </div>
                <div className="text-sm text-gray-500">Expired</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {coupons.filter(c => (c.current_uses || 0) >= (c.max_uses || 1)).length}
                </div>
                <div className="text-sm text-gray-500">Fully Used</div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
