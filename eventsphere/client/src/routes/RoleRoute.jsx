import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export const RoleRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null; // Handled by PrivateRoute loading state

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  const isAuthorized = allowedRoles.includes(user.role);

  if (!isAuthorized) {
    // Reroute them to their appropriate workspace dashboard
    const dashboardRoutes = {
      organizer: '/dashboard/organizer',
      participant: '/dashboard/participant',
      volunteer: '/dashboard/volunteer',
      sponsor: '/dashboard/sponsor',
      admin: '/dashboard/admin'
    };

    const targetRoute = dashboardRoutes[user.role] || '/dashboard/profile';
    return <Navigate to={targetRoute} replace />;
  }

  return <Outlet />;
};
