import React, { useState } from 'react';
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
  Trash2,
  Eye,
  Calendar,
  AlertTriangle,
  ZapOff
} from 'lucide-react';
import { useSocket } from '../context/SocketContext.jsx';
import { Button } from '../components/Button.jsx';
import { PremiumCard } from '../components/common/PremiumCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { formatDate } from '../utils/formatDate.js';

const notificationIcons = {
  event_update: Volume2,
  registration_success: CheckCircle,
  task_assigned: Award,
  shift_reminder: Clock,
  sponsor_accepted: Sparkles,
  milestone_reached: Award,
  ai_alert: ShieldAlert
};

const roleBorderColors = {
  organizer: 'border-l-indigo-500 shadow-indigo-500/5',
  volunteer: 'border-l-purple-500 shadow-purple-500/5',
  sponsor: 'border-l-cyan-500 shadow-cyan-500/5',
  participant: 'border-l-emerald-500 shadow-emerald-500/5',
  admin: 'border-l-rose-500 shadow-rose-500/5',
  system: 'border-l-slate-500 shadow-slate-500/5'
};

const typeIconColors = {
  event_update: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  registration_success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  task_assigned: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  shift_reminder: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  sponsor_accepted: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  milestone_reached: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  ai_alert: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
};

export const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications
  } = useSocket();

  const [activeTab, setActiveTab] = useState('All');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Grouping tabs mapping
  const tabs = [
    { id: 'All', label: 'All Alerts' },
    { id: 'organizer', label: 'Organizer' },
    { id: 'volunteer', label: 'Volunteer' },
    { id: 'sponsor', label: 'Sponsor' },
    { id: 'participant', label: 'Participant' },
    { id: 'ai_alert', label: 'AI Alerts' }
  ];

  // Filtering notifications logic
  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'All') return true;
    if (activeTab === 'ai_alert') return notif.isAI || notif.type === 'ai_alert';
    return notif.role === activeTab;
  });

  const handleCardClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
  };

  const handleClearConfirm = () => {
    clearAllNotifications();
    setShowConfirmClear(false);
  };

  // Date grouping utility: Today, Yesterday, Earlier
  const groupNotificationsByDate = (notifs) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: []
    };

    notifs.forEach(notif => {
      const dateStr = new Date(notif.createdAt).toDateString();
      if (dateStr === today) {
        groups.Today.push(notif);
      } else if (dateStr === yesterday) {
        groups.Yesterday.push(notif);
      } else {
        groups.Earlier.push(notif);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  return (
    <div className="flex flex-col gap-6 w-full text-left max-w-5xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
            <Bell className="w-8 h-8 text-indigo-400" />
            Alert Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review real-time socket events, announcements logs, gamification achievements, and scheduled AI predictions.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-1.5" /> Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="danger"
              onClick={() => setShowConfirmClear(true)}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Tabs list filter */}
      <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar gap-1.5 py-1">
        {tabs.map((tab) => {
          const count = tab.id === 'All'
            ? notifications.length
            : tab.id === 'ai_alert'
              ? notifications.filter(n => n.isAI || n.type === 'ai_alert').length
              : notifications.filter(n => n.role === tab.id).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 border flex-shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 bg-white/2 border-white/5 hover:bg-white/5'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  activeTab === tab.id ? 'bg-white text-indigo-900' : 'bg-white/10 text-slate-300'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-sm w-full text-center flex flex-col gap-4 border border-white/10">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Purge Alert History?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This action will permanently delete all notifications in your alert history. This action is irreversible.
            </p>
            <div className="flex gap-2.5 justify-center mt-2">
              <Button variant="secondary" onClick={() => setShowConfirmClear(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleClearConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                Clear History
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications list catalog */}
      <div className="flex flex-col gap-8 mt-2">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            type="notifications"
            title="Notification feed is empty"
            description={
              activeTab === 'All'
                ? "You're all caught up! Real-time alerts, reminders, and platform AI analysis will populate here."
                : `No notifications match the filter category: ${tabs.find(t => t.id === activeTab)?.label}.`
            }
          />
        ) : (
          Object.keys(groupedNotifications).map(groupName => {
            const groupList = groupedNotifications[groupName];
            if (groupList.length === 0) return null;

            return (
              <div key={groupName} className="flex flex-col gap-3">
                {/* Group date separator heading */}
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pl-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {groupName}
                </h3>

                {/* Notifications Cards group */}
                <div className="flex flex-col gap-3">
                  {groupList.map((notif) => {
                    const Icon = notificationIcons[notif.type] || Bell;
                    const borderClass = roleBorderColors[notif.role] || 'border-l-white/10';
                    const iconColorClass = typeIconColors[notif.type] || 'text-slate-300 bg-white/5 border-white/10';

                    const glowVal = notif.isAI || notif.type === 'ai_alert' ? 'ai' : notif.role;

                    return notif.isRead ? (
                      <div
                        key={notif._id}
                        onClick={() => handleCardClick(notif)}
                        className={`glass-panel p-4 flex gap-4 transition-all duration-200 border-l-4 shadow-lg text-left relative overflow-hidden group ${borderClass} opacity-70 bg-slate-950/20 hover:opacity-100 hover:bg-slate-950/30`}
                      >
                        {/* Icon Block */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${iconColorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Card body content */}
                        <div className="flex-grow min-w-0 pr-8">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                              {notif.role}
                            </span>
                            {notif.isAI && (
                              <span className="text-[9px] uppercase font-extrabold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                AI Insights
                              </span>
                            )}
                          </div>
                          
                          <h4 className="text-base font-bold mt-1.5 text-slate-300">
                            {notif.title}
                          </h4>
                          
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {notif.msg}
                          </p>

                          <div className="flex items-center gap-3 mt-3">
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <PremiumCard
                        as={motion.div}
                        key={notif._id}
                        glow={glowVal}
                        type="notif"
                        onClick={() => handleCardClick(notif)}
                        className={`flex gap-4 border-l-4 shadow-lg group ${borderClass}`}
                      >
                        {/* Dot indicator (top-right) */}
                        <div className="absolute top-4 right-4 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
                          <span className="text-[9px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                            Unread
                          </span>
                        </div>

                        {/* Icon Block */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${iconColorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Card body content */}
                        <div className="flex-grow min-w-0 pr-8">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                              {notif.role}
                            </span>
                            {notif.isAI && (
                              <span className="text-[9px] uppercase font-extrabold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                AI Insights
                              </span>
                            )}
                          </div>
                          
                          <h4 className="text-base font-bold mt-1.5 text-slate-100 font-extrabold">
                            {notif.title}
                          </h4>
                          
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            {notif.msg}
                          </p>

                          <div className="flex items-center gap-3 mt-3">
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notif._id);
                              }}
                              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                            >
                              Mark as Read
                            </button>
                          </div>
                        </div>
                      </PremiumCard>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default NotificationCenter;
