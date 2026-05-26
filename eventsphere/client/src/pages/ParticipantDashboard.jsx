import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { EventCard } from '../components/EventCard.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { useToast } from '../hooks/useToast.js';
import API from '../api/api.js';

export const ParticipantDashboard = () => {
  const toast = useToast();
  
  // States
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [registeringId, setRegisteringId] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const url = `/events?status=published${category !== 'All' ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}`;
      const res = await API.get(url);
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      // Fetch user profile which has registration data, or check registrations
      const profileRes = await API.get('/users/profile');
      if (profileRes.data.success) {
        // Sync my registrations to track what is already registered
        const user = profileRes.data.data.user;
        // In the database user holds registered events, or we can fetch a feed
      }
      
      // Let's fetch my registration list directly if we had a route, or just sync from feed
      const feedRes = await API.get('/announcements/my-feed');
      // For simplicity let's call a dynamic check or query registrations, wait, let's query my feed
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleRegister = async (eventId) => {
    setRegisteringId(eventId);
    try {
      const res = await API.post('/registrations', { eventId });
      if (res.data.success) {
        toast.success('Registration successful! Check Registered Events to download your QR ticket.');
        // Update local list participants
        setEvents(events.map(e => e._id === eventId ? { ...e, participants: [...e.participants, 'me'] } : e));
        setMyRegistrations([...myRegistrations, eventId]);
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register.');
    } finally {
      setRegisteringId('');
    }
  };

  const categories = ['All', 'Hackathon', 'Workshop', 'Seminar', 'Cultural'];

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      
      {/* Header info */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
          <Calendar className="w-8 h-8 text-indigo-400" />
          Explore Events
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Browse upcoming collegiate hackathons, developer training bootcamps, and guest lectures. Secure your seats instantly.
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-grow">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search events by title, tags, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </form>

        {/* Categories tags selectors */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`py-2.5 px-4 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all duration-200 snap-start ${
                category === cat
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          type="events"
          title="No events matching criteria"
          description="We couldn't find any scheduled workshops or hackathons matching your search queries. Try clearing tags or switching filters."
          actionText="Clear Category Filters"
          onAction={() => { setCategory('All'); setSearch(''); }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <EventCard
              key={evt._id}
              event={evt}
              onRegister={handleRegister}
              isRegistered={myRegistrations.includes(evt._id) || evt.participants?.includes('me')}
              loading={registeringId === evt._id}
            />
          ))}
        </div>
      )}

    </div>
  );
};
