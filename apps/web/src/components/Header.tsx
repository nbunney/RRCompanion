import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
import Logo from '@/components/Logo';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
  showUserInfo?: boolean;
  showAboutLink?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  backUrl = '/dashboard',
  showUserInfo = false,
  showAboutLink = true
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Debug logging for admin link
  console.log('🔐 Header - Component rendered with props:', { title, showBackButton, backUrl, showUserInfo, showAboutLink });
  console.log('🔐 Header - Auth state:', { user: user ? { id: user.id, email: user.email, admin: user.admin, adminType: typeof user.admin } : 'null' });
  console.log('🔐 Header - Admin check result:', user?.admin);
  console.log('🔐 Header - Should show admin link:', user?.admin ? 'YES' : 'NO');
  console.log('🔐 Header - Complete user object:', user);
  console.log('🔐 Header - User keys:', user ? Object.keys(user) : 'null');

  // Log when user state changes
  useEffect(() => {
    console.log('🔐 Header - User state changed:', { user: user ? { id: user.id, email: user.email, admin: user.admin, adminType: typeof user.admin } : 'null' });
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {showBackButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(backUrl)}
                className="mr-4"
              >
                ← Back
              </Button>
            )}
            {title ? (
              <h1
                className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => navigate('/')}
                title="Click to go to home page"
              >
                {title}
              </h1>
            ) : (
              <Link to="/">
                <Logo size="md" />
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {showAboutLink && (
              <Link
                to="/about"
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                About
              </Link>
            )}

            {user && (
              <Link
                to="/dashboard"
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
            )}

            <Link
              to="/coffee"
              className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              ☕ Coffee
            </Link>

            {user?.admin && (
              <Link
                to="/admin"
                className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                Admin
              </Link>
            )}

            {user ? (
              // User is logged in - show user info if requested
              showUserInfo ? (
                <>
                  <span className="text-sm text-gray-700">
                    Welcome, {user?.name || user?.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : null
            ) : (
              // User is not logged in - show login/register links
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
