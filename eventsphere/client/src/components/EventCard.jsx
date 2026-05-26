import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { formatDate, formatSimpleDate } from '../utils/formatDate.js';
import { Button } from './Button.jsx';
import { PremiumCard } from './common/PremiumCard.jsx';
import { cn } from '../utils/cn.js';

export const EventCard = ({
  event,
  onRegister,
  onAction,
  actionText = 'Register',
  isRegistered = false,
  role = 'participant',
  loading = false,
  glow = 'participant',
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState('');

  // Countdown timer logic
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(event.startDate).getTime();
      const end = new Date(event.endDate).getTime();

      if (now > end) {
        setTimeLeft('Completed');
        return;
      }

      if (now >= start && now <= end) {
        setTimeLeft('Ongoing');
        return;
      }

      const difference = start - now;

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s left`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [event.startDate, event.endDate]);

  // Color-coded badge helper
  const getCategoryColor = (cat) => {
    const name = cat ? cat.toLowerCase() : '';
    if (name.includes('hack')) return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25';
    if (name.includes('work')) return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25';
    if (name.includes('sem') || name.includes('talk')) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
    return 'bg-purple-500/10 text-purple-400 border border-purple-500/25';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-emerald-500/10 text-emerald-400';
      case 'draft': return 'bg-amber-500/10 text-amber-400';
      case 'ongoing': return 'bg-cyan-500/10 text-cyan-400';
      case 'completed': return 'bg-slate-500/10 text-slate-400';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <PremiumCard
      as={motion.div}
      glow={glow}
      type="event"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      {/* Banner & Overlay */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.bannerImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60"}
          alt={event.title}
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        
        {/* Category Tag */}
        <span className={cn("absolute top-4 left-4 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md", getCategoryColor(event.category))}>
          {event.category}
        </span>

        {/* Live Status indicator */}
        <span className={cn("absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md border border-white/5", getStatusColor(event.status))}>
          {event.status}
        </span>

        {/* Countdown Overlay */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
          <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold text-cyan-200">{timeLeft}</span>
        </div>
      </div>

      {/* Details Box */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-slate-50 light:text-slate-900 tracking-tight leading-tight line-clamp-1">
          {event.title}
        </h3>
        
        <p className="text-slate-400 light:text-slate-600 text-xs mt-2 line-clamp-2 min-h-[2rem]">
          {event.description}
        </p>

        {/* Specs List */}
        <div className="flex flex-col gap-2 mt-4 text-xs text-slate-300 light:text-slate-600 flex-grow">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>{formatSimpleDate(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              {event.participants?.length || 0} / {event.capacity} Registered
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/5 light:border-slate-200">
          {/* Organizer indicator */}
          <div className="flex items-center gap-2 max-w-[50%]">
            <img
              src={event.organizer?.avatar || "https://api.dicebear.com/7.x/bottts/svg"}
              alt={event.organizer?.name}
              className="w-6 h-6 rounded-full border border-indigo-500/30"
            />
            <span className="text-[11px] text-slate-400 light:text-slate-500 line-clamp-1">
              By {event.organizer?.name || 'Organizer'}
            </span>
          </div>

          {/* Conditional CTA */}
          {role === 'organizer' ? (
            <Button size="sm" variant="secondary" onClick={() => onAction('manage', event._id)}>
              Manage
            </Button>
          ) : role === 'volunteer' ? (
            <Button size="sm" variant="cyan" onClick={() => onAction('scan', event._id)}>
              Scan Attendance
            </Button>
          ) : isRegistered ? (
            <Button size="sm" variant="glass" disabled className="text-emerald-400 bg-emerald-500/5">
              Registered
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              loading={loading}
              onClick={() => onRegister(event._id)}
              disabled={timeLeft === 'Completed' || event.participants?.length >= event.capacity}
            >
              {timeLeft === 'Completed' ? 'Closed' : 'Register'}
            </Button>
          )}
        </div>
      </div>
    </PremiumCard>
  );
};
