import React, { useEffect, useState } from 'react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo/Title and Back Button */}
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

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-4">
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

            <Link
              to="/rising-stars-animation"
              className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              📈 Rising Stars Animation
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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
              aria-label="Toggle mobile menu"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Close icon */}
              <svg
                className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
            {/* Navigation Links */}
            {showAboutLink && (
              <Link
                to="/about"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={closeMobileMenu}
              >
                About
              </Link>
            )}

            {user && (
              <Link
                to="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>
            )}

            <Link
              to="/coffee"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              onClick={closeMobileMenu}
            >
              ☕ Coffee
            </Link>

            <Link
              to="/rising-stars-animation"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              onClick={closeMobileMenu}
            >
              📈 Rising Stars Animation
            </Link>

            {user?.admin && (
              <Link
                to="/admin"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={closeMobileMenu}
              >
                Admin
              </Link>
            )}

            {/* User Authentication Section */}
            {user ? (
              // User is logged in
              <div className="pt-4 pb-3 border-t border-gray-200">
                {showUserInfo && (
                  <div className="px-3 py-2 text-sm text-gray-700">
                    Welcome, {user?.name || user?.email}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-center"
                >
                  Logout
                </Button>
              </div>
            ) : (
              // User is not logged in
              <div className="pt-4 pb-3 border-t border-gray-200 space-y-2">
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={closeMobileMenu}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={closeMobileMenu}
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
