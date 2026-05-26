import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Volume2,
  CheckCircle,
  Award,
  Clock,
  Sparkles,
  ShieldAlert,
  Check,
  Eye,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useSocket } from '../context/SocketContext.jsx';

const notificationIcons = {
  event_update: Volume2,
  registration_success: CheckCircle,
  task_assigned: Award,
  shift_reminder: Clock,
  sponsor_accepted: Sparkles,
  milestone_reached: Award,
  ai_alert: ShieldAlert
};

const notificationColors = {
  event_update: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  registration_success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  task_assigned: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  shift_reminder: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  sponsor_accepted: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  milestone_reached: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  ai_alert: 'text-amber-400 bg-amber-500/10 border-amber-500/25'
};

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRing, setShouldRing] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Trigger bell ring animation on new unread notifications
  useEffect(() => {
    if (unreadCount > 0) {
      setShouldRing(true);
      const timer = setTimeout(() => setShouldRing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigateCenter = () => {
    setIsOpen(false);
    navigate('/dashboard/notifications');
  };

  const handleItemClick = (e, notif) => {
    e.stopPropagation();
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Animated Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl border border-white/5 bg-slate-950/20 hover:bg-white/5 text-slate-300 hover:text-slate-100 transition-colors z-20 flex items-center justify-center cursor-pointer"
        title="View Notifications"
      >
        <motion.div
          animate={shouldRing ? {
            rotate: [0, -15, 15, -15, 15, 0],
            scale: [1, 1.15, 1.15, 1.15, 1.15, 1]
          } : {}}
          transition={{ duration: 0.6 }}
        >
          <Bell className="w-5 h-5" />
        </motion.div>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-950 shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Glassmorphic Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-white/8 bg-slate-950/90 backdrop-blur-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
              {recentNotifications.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full border border-white/5 bg-white/2 flex items-center justify-center text-slate-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-400">All caught up!</h5>
                  <p className="text-[10px] text-slate-500">You don't have any unread notifications right now.</p>
                </div>
              ) : (
                recentNotifications.map((notif) => {
                  const Icon = notificationIcons[notif.type] || Bell;
                  const colorClass = notificationColors[notif.type] || 'text-slate-300 bg-white/5 border-white/10';

                  return (
                    <div
                      key={notif._id}
                      onClick={(e) => handleItemClick(e, notif)}
                      className={`p-4 flex gap-3 text-left transition-colors cursor-pointer ${
                        notif.isRead ? 'hover:bg-white/2 bg-transparent' : 'bg-indigo-500/2 hover:bg-indigo-500/5'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h6 className={`text-xs font-bold truncate ${notif.isRead ? 'text-slate-300' : 'text-slate-100 font-extrabold'}`}>
                            {notif.title}
                          </h6>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 shadow-lg shadow-indigo-500/50" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {notif.msg}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[9px] text-slate-500">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!notif.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif._id);
                              }}
                              className="text-[9px] font-bold text-indigo-400 hover:underline cursor-pointer"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* View All Footer */}
            <button
              onClick={handleNavigateCenter}
              className="w-full py-3 text-center text-xs font-bold bg-slate-950 text-slate-300 hover:text-white border-t border-white/5 hover:bg-slate-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              View All Notifications
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
