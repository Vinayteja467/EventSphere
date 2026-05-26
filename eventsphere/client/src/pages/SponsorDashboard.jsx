import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Search, Sparkles, Handshake, CheckCircle2, MessageSquare } from 'lucide-react';
import { AIMatchPanel } from '../components/AIMatchPanel.jsx';
import { PremiumCard } from '../components/common/PremiumCard.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { useToast } from '../hooks/useToast.js';
import API from '../api/api.js';

export const SponsorDashboard = () => {
  const toast = useToast();

  // States
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'ai-tool', 'connections'
  const [connectedEventIds, setConnectedEventIds] = useState([]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/events?status=published');
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load active events docket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleConnectRequest = (eventId, title) => {
    if (connectedEventIds.includes(eventId)) return;
    setConnectedEventIds([...connectedEventIds, eventId]);
    toast.success(`Sponsorship query submitted for ${title}! The organizing committee has been notified.`);
  };

  // Filter events based on search query
  const filteredEvents = events.filter(evt =>
    evt.title.toLowerCase().includes(search.toLowerCase()) ||
    evt.category.toLowerCase().includes(search.toLowerCase()) ||
    evt.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      
      {/* Header Info */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
          <Briefcase className="w-8 h-8 text-indigo-400" />
          Sponsor Dashboard
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore student hackathons and workshops, run our Google Gemini AI Matchmaking engine, and connect with event organizers.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab('browse')}
          className={`py-2 px-5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeTab === 'browse' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Explore Events Catalog
        </button>
        <button
          onClick={() => setActiveTab('ai-tool')}
          className={`py-2 px-5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
            activeTab === 'ai-tool' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
          Gemini AI Matchmaker
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`py-2 px-5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeTab === 'connections' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sponsorship Channels
        </button>
      </div>

      {/* --- TAB CONTENT --- */}
      
      {activeTab === 'browse' && (
        <div className="flex flex-col gap-6">
          
          {/* Search bar */}
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search active events by title, categories, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Grid of events */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="card" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              type="events"
              title="No events matching criteria"
              description="We couldn't locate any active student events matching your search terms. Adjust keywords."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((evt) => (
                <PremiumCard
                  as={motion.div}
                  glow="participant"
                  type="event"
                  key={evt._id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="overflow-hidden flex flex-col justify-between border-white/5 hover:border-indigo-500/20 transition-all duration-300"
                >
                  <div className="h-36 overflow-hidden relative">
                    <img src={evt.bannerImage} alt={evt.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 px-2 py-0.5 text-[9px] font-bold rounded bg-indigo-600/70 border border-indigo-400/35 text-white">
                      {evt.category}
                    </span>
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between text-left">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-base font-bold text-slate-100 mt-1 line-clamp-1">{evt.title}</h3>
                      <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{evt.description}</p>
                      
                      <div className="mt-3 flex flex-wrap gap-2.5 text-[11px] text-slate-400">
                        <div className="bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                          <strong>Target:</strong> {evt.capacity} Students
                        </div>
                        <div className="bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                          <strong>Location:</strong> {evt.venue.split(',')[0]}
                        </div>
                      </div>
                    </div>

                    {/* Actions block */}
                    <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400">Organized by {evt.organizer?.name}</span>
                      
                      {connectedEventIds.includes(evt._id) ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Request Sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConnectRequest(evt._id, evt.title)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all duration-200"
                        >
                          Send Offer
                        </button>
                      )}
                    </div>
                  </div>
                </PremiumCard>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai-tool' && (
        <AIMatchPanel />
      )}

      {activeTab === 'connections' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider px-1">
            Active Sponsorship Channels
          </h3>

          {connectedEventIds.length === 0 ? (
            <EmptyState
              type="inbox"
              title="No connections established yet"
              description="You have not requested sponsorship channels with any active university events yet. Browse events or run our AI Match tool to find channels."
              actionText="Explore Event Docket"
              onAction={() => setActiveTab('browse')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events
                .filter(e => connectedEventIds.includes(e._id))
                .map((evt) => (
                  <PremiumCard
                    as={motion.div}
                    glow="sponsor"
                    key={evt._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="caption bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/10">
                          Pending Committee Review
                        </span>
                        <h4 className="text-sm font-bold text-slate-100 mt-2.5">{evt.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">Organized by {evt.organizer?.name} ({evt.organizer?.email})</p>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400">
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 border-t border-white/5 pt-3 leading-relaxed">
                      Your interest was logged. The student coordinating committee will verify your company profile details (industry segment and standard budget) and dispatch an email/chat channel soon.
                    </p>
                  </PremiumCard>
                ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
