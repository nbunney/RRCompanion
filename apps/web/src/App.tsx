import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import OAuthCallback from '@/pages/OAuthCallback';
import OAuthError from '@/pages/OAuthError';
import RoyalRoad from '@/pages/RoyalRoad';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import About from '@/pages/About';
import Home from '@/pages/Home';

import Coffee from '@/pages/Coffee';
import Admin from '@/pages/Admin';
import AdminUsers from '@/pages/AdminUsers';
import FictionDetail from '@/components/FictionDetail';
import RisingStarsAnimation from '@/pages/RisingStarsAnimation';
import RisingStarsPositionCalculator from '@/pages/RisingStarsPositionCalculator';
import RisingStarsPositionLanding from '@/pages/RisingStarsPositionLanding';
import RisingStarsMain from '@/pages/RisingStarsMain';

// Route change tracker component
const RouteTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.log('🛣️ Route changed to:', location.pathname);
    console.log('🛣️ Route change time:', new Date().toISOString());
  }, [location]);

  return null;
};

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Debug current location
  useEffect(() => {
    console.log('🔗 Current location:', window.location.pathname);
  }, []);

  return (
    <>
      <RouteTracker />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/oauth/error" element={<OAuthError />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route path="/coffee" element={<Coffee />} />
        <Route path="/rising-stars-animation" element={<RisingStarsAnimation />} />
        <Route path="/rising-stars-main" element={<RisingStarsMain />} />
        <Route path="/rising-stars-position" element={<RisingStarsPositionLanding />} />
        <Route path="/rising-stars-position/:id" element={<RisingStarsPositionCalculator />} />
        <Route
          path="/fiction/:id/:slug?"
          element={<FictionDetail />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/royalroad" element={<RoyalRoad />} />
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

export default App; 