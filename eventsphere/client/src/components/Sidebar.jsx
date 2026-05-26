import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  Award,
  Users,
  Trophy,
  QrCode,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  ShieldAlert,
  Volume2,
  FileBadge2,
  Bell
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useSocket } from '../context/SocketContext.jsx';
import { cn } from '../utils/cn.js';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  // Navigation schema based on role
  const getNavLinks = () => {
    switch (user.role) {
      case 'organizer':
        return [
          { to: '/dashboard/organizer', label: 'Overview', icon: LayoutDashboard },
          { to: '/dashboard/organizer/events', label: 'My Events', icon: Calendar },
          { to: '/dashboard/organizer/sponsor-match', label: 'AI Sponsor Match', icon: Sparkles },
          { to: '/dashboard/organizer/announcements', label: 'Announcements', icon: Volume2 },
          { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
          { to: '/dashboard/profile', label: 'My Profile', icon: User }
        ];
      case 'participant':
        return [
          { to: '/dashboard/participant', label: 'Browse Events', icon: Calendar },
          { to: '/dashboard/participant/my-events', label: 'Registered Events', icon: QrCode },
          { to: '/dashboard/participant/certificates', label: 'Certificate Vault', icon: FileBadge2 },
          { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
          { to: '/dashboard/profile', label: 'My Profile', icon: User }
        ];
      case 'volunteer':
        return [
          { to: '/dashboard/volunteer', label: 'My Tasks', icon: Award },
          { to: '/dashboard/volunteer/leaderboard', label: 'Leaderboard', icon: Trophy },
          { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
          { to: '/dashboard/profile', label: 'My Profile', icon: User }
        ];
      case 'sponsor':
        return [
          { to: '/dashboard/sponsor', label: 'Browse Events', icon: Calendar },
          { to: '/dashboard/sponsor/ai-match', label: 'AI Match Tool', icon: Sparkles },
          { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
          { to: '/dashboard/profile', label: 'My Profile', icon: User }
        ];
      case 'admin':
        return [
          { to: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
          { to: '/dashboard/admin/users', label: 'User Roles', icon: Users },
          { to: '/dashboard/admin/moderation', label: 'Moderation', icon: ShieldAlert },
          { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
          { to: '/dashboard/profile', label: 'My Profile', icon: User }
        ];
      default:
        return [
          { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
          { to: '/dashboard/profile', label: 'My Profile', icon: User }
        ];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div
      className={cn(
        "hidden md:flex flex-col justify-between h-screen sticky top-0 bg-slate-950/40 backdrop-blur-xl border-r border-white/5 transition-all duration-300 z-30",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between px-5 py-6 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            {!isCollapsed && (
              <h2 className="text-lg font-bold tracking-tight text-white uppercase bg-gradient-to-r from-indigo-200 to-cyan-200 bg-clip-text text-transparent">
                EventSphere
              </h2>
            )}
          </div>
          
          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Dynamic Nav Menu */}
        <nav className="flex flex-col gap-1.5 p-4 mt-4">
          {navLinks.map((link, idx) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={idx}
                to={link.to}
                end={link.to === '/dashboard/organizer' || link.to === '/dashboard/admin'}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group relative",
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  )
                }
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200")} />
                {!isCollapsed && <span className="text-sm">{link.label}</span>}
                {link.to === '/dashboard/notifications' && unreadCount > 0 && (
                  <span className={cn(
                    "flex items-center justify-center rounded-full text-[9px] font-extrabold flex-shrink-0 shadow-lg",
                    isCollapsed
                      ? "absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white animate-pulse"
                      : "ml-auto px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  )}>
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile Frame */}
      <div className="p-4 border-t border-white/5 bg-slate-950/20">
        <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 max-w-[70%]">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
                alt={user.name}
                className="w-9 h-9 rounded-full border border-indigo-500/20"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-200 truncate leading-none mb-1">{user.name}</span>
                <span className="text-[10px] text-slate-400 capitalize bg-white/5 border border-white/5 rounded-md px-1.5 py-0.5 inline-block w-fit">
                  {user.role}
                </span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
              alt={user.name}
              className="w-9 h-9 rounded-full border border-indigo-500/20 cursor-pointer"
              onClick={() => navigate('/dashboard/profile')}
            />
          )}

          {/* Logout Trigger */}
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
