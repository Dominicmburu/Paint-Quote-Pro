import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../common/Loading';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated and is an admin, but not on admin routes
    if (isAuthenticated && user && (user.role === 'admin' || user.role === 'super_admin')) {
      if (!location.pathname.startsWith('/admin') && !requireAdmin) {
        console.log('🔄 Admin user accessing regular route, redirecting to admin dashboard');
        navigate('/admin', { replace: true });
      }
    }
  }, [isAuthenticated, user, location.pathname, navigate, requireAdmin]);

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin access
  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'super_admin') {
    console.log('🚫 Non-admin user trying to access admin area, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Prevent regular users from accessing admin routes
  if (location.pathname.startsWith('/admin') && user?.role !== 'admin' && user?.role !== 'super_admin') {
    console.log('🚫 Regular user trying to access admin URL directly, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;