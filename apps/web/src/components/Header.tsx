import React from 'react';
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
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            ) : (
              <Link to="/dashboard">
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
