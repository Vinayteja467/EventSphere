import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Sparkles } from 'lucide-react';

export const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#0a0a0f] gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 animate-pulse">
          <Sparkles className="w-6 h-6 text-cyan-300 animate-spin" />
        </div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Syncing credentials...
        </p>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace />;
};
