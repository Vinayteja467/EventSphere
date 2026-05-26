import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  Award,
  Users,
  Trophy,
  QrCode,
  User,
  LayoutDashboard,
  FileBadge2,
  ShieldAlert,
  Bell
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useSocket } from '../context/SocketContext.jsx';
import { cn } from '../utils/cn.js';

export const BottomNav = () => {
  const { user } = useAuth();
  const { unreadCount } = useSocket();

  if (!user) return null;

  const getMobileLinks = () => {
    switch (user.role) {
      case 'organizer':
        return [
          { to: '/dashboard/organizer', label: 'Overview', icon: LayoutDashboard },
          { to: '/dashboard/organizer/events', label: 'Events', icon: Calendar },
          { to: '/dashboard/organizer/sponsor-match', label: 'AI Match', icon: Sparkles },
          { to: '/dashboard/notifications', label: 'Alerts', icon: Bell },
          { to: '/dashboard/profile', label: 'Profile', icon: User }
        ];
      case 'participant':
        return [
          { to: '/dashboard/participant', label: 'Browse', icon: Calendar },
          { to: '/dashboard/participant/my-events', label: 'Tickets', icon: QrCode },
          { to: '/dashboard/participant/certificates', label: 'Vault', icon: FileBadge2 },
          { to: '/dashboard/notifications', label: 'Alerts', icon: Bell },
          { to: '/dashboard/profile', label: 'Profile', icon: User }
        ];
      case 'volunteer':
        return [
          { to: '/dashboard/volunteer', label: 'Tasks', icon: Award },
          { to: '/dashboard/volunteer/leaderboard', label: 'Ranking', icon: Trophy },
          { to: '/dashboard/notifications', label: 'Alerts', icon: Bell },
          { to: '/dashboard/profile', label: 'Profile', icon: User }
        ];
      case 'sponsor':
        return [
          { to: '/dashboard/sponsor', label: 'Events', icon: Calendar },
          { to: '/dashboard/sponsor/ai-match', label: 'AI Match', icon: Sparkles },
          { to: '/dashboard/notifications', label: 'Alerts', icon: Bell },
          { to: '/dashboard/profile', label: 'Profile', icon: User }
        ];
      case 'admin':
        return [
          { to: '/dashboard/admin', label: 'Stats', icon: LayoutDashboard },
          { to: '/dashboard/admin/users', label: 'Users', icon: Users },
          { to: '/dashboard/admin/moderation', label: 'Moderating', icon: ShieldAlert },
          { to: '/dashboard/notifications', label: 'Alerts', icon: Bell },
          { to: '/dashboard/profile', label: 'Profile', icon: User }
        ];
      default:
        return [
          { to: '/dashboard/notifications', label: 'Alerts', icon: Bell },
          { to: '/dashboard/profile', label: 'Profile', icon: User }
        ];
    }
  };

  const links = getMobileLinks();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-lg border-t border-white/10 z-30 flex items-center justify-around px-2">
      {links.map((link, idx) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={idx}
            to={link.to}
            end={link.to === '/dashboard/organizer' || link.to === '/dashboard/admin'}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center flex-grow h-full min-w-[44px] min-h-[44px] gap-1 transition-colors duration-150 relative",
                isActive ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight uppercase">{link.label}</span>
            {link.to === '/dashboard/notifications' && unreadCount > 0 && (
              <span className="absolute top-1.5 right-1/2 translate-x-4 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-extrabold text-white ring-1 ring-slate-950 shadow-lg animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};
