import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Search, Sparkles, CheckCircle2, MessageSquare, 
  Code, Laptop, School, Calendar, MapPin, Users, User, Send, Eye,
  Building, IndianRupee, AlertCircle
} from 'lucide-react';
import { AIMatchPanel } from '../components/AIMatchPanel.jsx';
import { PremiumCard } from '../components/common/PremiumCard.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../hooks/useToast.js';
import API from '../api/api.js';

// Category card configuration mapping
const categoryConfig = {
  Hackathon: { bg: 'bg-blue-950/80', icon: Code, color: 'text-blue-400' },
  Workshop:  { bg: 'bg-green-950/80', icon: Laptop, color: 'text-green-400' },
  Seminar:   { bg: 'bg-gray-800/80', icon: School, color: 'text-gray-400' },
  default:   { bg: 'bg-gray-800/80', icon: Calendar, color: 'text-gray-400' }
};

export const SponsorDashboard = () => {
  const toast = useToast();

  // States
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'ai-tool', 'connections'
  
  // Stats and Sent Offers
  const [stats, setStats] = useState({ browsed: 0, offered: 0, accepted: 0, reach: 0 });
  const [offers, setOffers] = useState([]);
  const [sponsorProfile, setSponsorProfile] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [selectedAudience, setSelectedAudience] = useState('Any audience size');

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  
  // Submit state
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // Fetch all initial dashboard details
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Get published events
      const eventsRes = await API.get('/events?status=published');
      if (eventsRes.data.success) {
        setEvents(eventsRes.data.data);
      }

      // 2. Get sponsor stats & current offers
      const statsRes = await API.get('/sponsor/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.data.stats);
        setOffers(statsRes.data.data.offers || []);
      }

      // 3. Sync sponsor profile for match scores
      const profileRes = await API.get('/users/profile');
      if (profileRes.data.success) {
        setSponsorProfile(profileRes.data.data.sponsorProfile);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load active events docket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Utility to locate a sponsorship record for an event
  const getSponsorshipForEvent = (eventId) => {
    return offers.find(o => o.eventId?._id === eventId || o.eventId === eventId);
  };

  // Client-side Match Score Heuristic Calculator
  const getMatchScore = (event) => {
    let score = 60; // Base score
    if (!sponsorProfile) return score;

    // Deterministic seed matching using sponsor details
    const str = (event._id || '') + (sponsorProfile.companyName || '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seedOffset = Math.abs(hash % 20); // 0 to 19 variance

    // Interests matching category
    const categoryMatch = sponsorProfile.interests?.some(
      interest => interest.toLowerCase() === event.category?.toLowerCase()
    );
    if (categoryMatch) score += 12;

    // Interests matching tags
    const commonTags = event.tags?.filter(
      tag => sponsorProfile.interests?.some(interest => interest.toLowerCase() === tag.toLowerCase())
    );
    if (commonTags && commonTags.length > 0) {
      score += Math.min(10, commonTags.length * 4);
    }

    return Math.min(99, score + seedOffset);
  };

  // Client-Side Multi-Criteria Filters
  const filteredEvents = events.filter(evt => {
    const matchesSearch = search === '' || 
      evt.title.toLowerCase().includes(search.toLowerCase()) ||
      evt.description.toLowerCase().includes(search.toLowerCase()) ||
      evt.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'All categories' ||
      evt.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesAudience = selectedAudience === 'Any audience size' || (
      selectedAudience === 'Under 100' && evt.capacity < 100
    ) || (
      selectedAudience === '100–300' && evt.capacity >= 100 && evt.capacity <= 300
    ) || (
      selectedAudience === '300+' && evt.capacity > 300
    );

    return matchesSearch && matchesCategory && matchesAudience;
  });

  // Modal handlers
  const handleOpenDetails = (evt) => {
    setSelectedEvent(evt);
    setIsDetailModalOpen(true);
  };

  const handleOpenOfferModal = () => {
    setIsDetailModalOpen(false);
    setIsOfferModalOpen(true);
  };

  // Dispatch offer submission to backend
  const handleSubmitOffer = async (offerPayload) => {
    setSubmittingOffer(true);
    try {
      const res = await API.post('/sponsorships/offer', {
        eventId: selectedEvent._id,
        budget: offerPayload.budget,
        message: offerPayload.message,
        perksRequested: offerPayload.perksRequested
      });

      if (res.data.success) {
        toast.success(`Offer sent to ${res.data.organizerName || selectedEvent.organizer?.name || 'Organizer'}`);
        setIsOfferModalOpen(false);
        // Reload statistics and updated offer registry
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit sponsorship offer.');
    } finally {
      setSubmittingOffer(false);
    }
  };

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
          
          {/* 3. ADD STAT CARDS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard 
              title="Events browsed" 
              value={stats.browsed} 
              icon={Eye} 
              glow="sponsor" 
            />
            <StatCard 
              title="Offers sent" 
              value={stats.offered} 
              icon={Send} 
              glow="sponsor" 
            />
            <StatCard 
              title="Connected" 
              value={stats.accepted} 
              icon={CheckCircle2} 
              glow="volunteer" 
            />
            <StatCard 
              title="Total audience" 
              value={stats.reach} 
              icon={Users} 
              glow="participant" 
            />
          </div>

          {/* 1. ADD FILTER BAR */}
          <div className="flex flex-col md:flex-row gap-3 p-4 bg-slate-900/40 rounded-2xl border border-white/5 backdrop-blur-md">
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search events by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer min-w-[140px]"
              >
                <option value="All categories" className="bg-slate-950 text-slate-200">All categories</option>
                <option value="Hackathon" className="bg-slate-950 text-slate-200">Hackathon</option>
                <option value="Workshop" className="bg-slate-950 text-slate-200">Workshop</option>
                <option value="Seminar" className="bg-slate-950 text-slate-200">Seminar</option>
              </select>

              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer min-w-[160px]"
              >
                <option value="Any audience size" className="bg-slate-950 text-slate-200">Any audience size</option>
                <option value="Under 100" className="bg-slate-950 text-slate-200">Under 100</option>
                <option value="100–300" className="bg-slate-950 text-slate-200">100–300</option>
                <option value="300+" className="bg-slate-950 text-slate-200">300+</option>
              </select>
            </div>
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
              {filteredEvents.map((evt) => {
                const config = categoryConfig[evt.category] || categoryConfig.default;
                const CategoryIcon = config.icon;
                const matchScore = getMatchScore(evt);

                // Match score badge color mapping
                let matchBadgeColor = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                if (matchScore >= 80) {
                  matchBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                } else if (matchScore >= 60) {
                  matchBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                }

                // Capacity occupancy bar styling
                const regCount = evt.participants?.length || 0;
                const capacity = evt.capacity || 100;
                const fillPercent = Math.min(100, Math.round((regCount / capacity) * 100));

                let progressBarColor = 'bg-blue-500';
                if (fillPercent > 80) {
                  progressBarColor = 'bg-red-500';
                } else if (fillPercent > 50) {
                  progressBarColor = 'bg-amber-500';
                }

                // Check sponsorship proposal status
                const existingOffer = getSponsorshipForEvent(evt._id);
                const hasPendingOffer = existingOffer && existingOffer.status === 'pending';
                const hasAcceptedOffer = existingOffer && existingOffer.status === 'accepted';

                return (
                  <PremiumCard
                    as={motion.div}
                    glow="sponsor"
                    type="event"
                    key={evt._id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="overflow-hidden flex flex-col justify-between border-white/5 hover:border-indigo-500/20 transition-all duration-300 relative"
                  >
                    {/* B. UPGRADED CARD BANNER */}
                    <div className={`h-[56px] relative flex items-center justify-center ${config.bg} rounded-t-xl overflow-hidden`}>
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-semibold bg-black/40 text-slate-200 rounded">
                        {evt.category}
                      </span>
                      <span className={`absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold rounded border ${matchBadgeColor}`}>
                        {matchScore}% match
                      </span>
                      <CategoryIcon className={`w-8 h-8 opacity-40 ${config.color}`} />
                    </div>

                    <div className="p-4 flex-grow flex flex-col justify-between text-left">
                      <div className="flex flex-col gap-2">
                        {/* Title & Description */}
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[13px] font-medium text-slate-100 line-clamp-1">{evt.title}</h3>
                          {existingOffer && (
                            <span className={`px-2 py-0.5 text-[8px] uppercase font-bold rounded ${
                              hasAcceptedOffer ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {existingOffer.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-0.5">{evt.description}</p>
                        
                        {/* Location, Target, Organizer */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-slate-400 mt-2 bg-white/5 p-2 rounded-lg border border-white/5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                            {evt.venue.split(',')[0]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            {evt.capacity} students
                          </span>
                          <span className="flex items-center gap-1 w-full mt-0.5 text-slate-500 border-t border-white/5 pt-1.5">
                            <User className="w-3 h-3 text-slate-400" />
                            Organized by {evt.organizer?.name}
                          </span>
                        </div>

                        {/* Tags list */}
                        {evt.tags && evt.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {evt.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="bg-slate-900 text-slate-400 border border-white/5 text-[9px] px-2 py-0.5 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Capacity Progress Bar */}
                        <div className="flex flex-col gap-1 mt-3">
                          <div className="flex justify-between text-[9px] text-slate-400">
                            <span>Registrations</span>
                            <span>{regCount} / {capacity}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${progressBarColor} rounded-full transition-all duration-300`} 
                              style={{ width: `${fillPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions footer */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex gap-2 w-full">
                        <button
                          onClick={() => handleOpenDetails(evt)}
                          className="flex-grow py-2 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/5 transition-colors flex items-center justify-center gap-1 active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" /> View details
                        </button>
                        
                        {existingOffer ? (
                          <button
                            disabled
                            className="flex-grow py-2 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> 
                            {hasAcceptedOffer ? 'Offer Accepted' : 'Offer sent'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedEvent(evt);
                              handleOpenOfferModal();
                            }}
                            className="flex-grow py-2 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all duration-200 flex items-center justify-center gap-1"
                          >
                            Send offer <Send className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </PremiumCard>
                );
              })}
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

          {offers.length === 0 ? (
            <EmptyState
              type="inbox"
              title="No connections established yet"
              description="You have not requested sponsorship channels with any active university events yet. Browse events or run our AI Match tool to find channels."
              actionText="Explore Event Docket"
              onAction={() => setActiveTab('browse')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => {
                const evt = offer.eventId;
                if (!evt) return null;
                const hasAccepted = offer.status === 'accepted';
                
                return (
                  <PremiumCard
                    as={motion.div}
                    glow="sponsor"
                    key={offer._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`caption px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                          hasAccepted 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {hasAccepted ? 'Channel Activated' : 'Pending Committee Review'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100 mt-2.5">{evt.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Budget: <span className="text-slate-200 font-bold">₹{offer.budget?.toLocaleString()}</span>
                        </p>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400">
                        <MessageSquare className="w-5 h-5 text-indigo-400" />
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 flex flex-col gap-2">
                      <p className="text-[11px] text-slate-400 leading-relaxed italic">
                        "{offer.message}"
                      </p>
                      {offer.perksRequested?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {offer.perksRequested.map((p, idx) => (
                            <span key={idx} className="bg-indigo-500/5 border border-indigo-500/10 text-indigo-300 text-[8px] px-2 py-0.5 rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </PremiumCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- MODAL WIZARDS --- */}

      {/* Step 1: EventDetailModal */}
      <EventDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        event={selectedEvent} 
        onSendOfferClick={handleOpenOfferModal}
        isAlreadyOffered={selectedEvent && !!getSponsorshipForEvent(selectedEvent._id)}
      />

      {/* Step 2: SponsorOfferModal */}
      <SponsorOfferModal 
        isOpen={isOfferModalOpen} 
        onClose={() => setIsOfferModalOpen(false)} 
        event={selectedEvent} 
        onSubmit={handleSubmitOffer}
        submitting={submittingOffer}
      />

    </div>
  );
};

// Modal Component 1: Event Detail Modal
const EventDetailModal = ({ isOpen, onClose, event, onSendOfferClick, isAlreadyOffered }) => {
  if (!event) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Details & Collaboration Blueprint"
      size="lg"
    >
      <div className="flex flex-col gap-5 text-left">
        {/* Banner Section */}
        <div className="relative h-44 rounded-xl overflow-hidden border border-white/10">
          <img 
            src={event.bannerImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60'} 
            alt={event.title} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          <span className="absolute bottom-3 left-3 bg-indigo-600 px-3 py-1 rounded-lg text-xs font-bold text-white shadow-md border border-indigo-400/20">
            {event.category}
          </span>
        </div>

        {/* Title and Demographics */}
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{event.title}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" /> <span>{event.venue}</span>
            <span className="text-slate-600">•</span>
            <Users className="w-3.5 h-3.5 text-indigo-400" /> <span>Expected: {event.capacity} students</span>
          </div>
        </div>

        {/* Audience Demographics breakdown */}
        <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3.5">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-cyan-400" /> Target Audience Demographics
          </h3>
          <div className="grid grid-cols-3 gap-3 mt-3 text-center">
            <div className="bg-white/5 border border-white/5 rounded-lg p-2">
              <span className="text-xs font-bold text-indigo-400">70%</span>
              <p className="text-[10px] text-slate-400">Engineering</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-lg p-2">
              <span className="text-xs font-bold text-indigo-400">20%</span>
              <p className="text-[10px] text-slate-400">Science & Arts</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-lg p-2">
              <span className="text-xs font-bold text-indigo-400">10%</span>
              <p className="text-[10px] text-slate-400">Business / Mgmt</p>
            </div>
          </div>
        </div>

        {/* Full description */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">About the Event</h3>
          <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
            {event.description}
          </p>
        </div>

        {/* Schedule timeline */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Event Timeline Agenda</h3>
          {event.schedule && event.schedule.length > 0 ? (
            <div className="flex flex-col gap-2 bg-slate-900/40 p-3 rounded-xl border border-white/5 max-h-40 overflow-y-auto">
              {event.schedule.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                  <div>
                    <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-white/5 mr-2">
                      {item.time}
                    </span>
                    <span className="font-semibold text-slate-200">{item.title}</span>
                  </div>
                  {item.speaker && (
                    <span className="text-[10px] text-slate-400 italic">
                      by {item.speaker}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic">Agenda timeline checklist will be finalized by organizer soon.</p>
          )}
        </div>

        {/* Sponsorship Tiers Grid */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Platform Sponsorship Benchmarks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col gap-1 hover:border-amber-700/20 transition-all duration-300">
              <span className="text-[9px] uppercase font-bold tracking-widest text-amber-500">Bronze Tier</span>
              <span className="text-xs font-bold text-slate-100">₹10,000+</span>
              <p className="text-[9px] text-slate-500 leading-normal">Basic promotion, logo on event webpage and banners.</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col gap-1 hover:border-slate-400/20 transition-all duration-300">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Silver Tier</span>
              <span className="text-xs font-bold text-slate-100">₹25,000+</span>
              <p className="text-[9px] text-slate-500 leading-normal">Logo on website, brochure, booth space, and resume portal.</p>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col gap-1 hover:border-yellow-500/20 transition-all duration-300">
              <span className="text-[9px] uppercase font-bold tracking-widest text-yellow-500">Gold Tier</span>
              <span className="text-xs font-bold text-slate-100">₹50,000+</span>
              <p className="text-[9px] text-slate-500 leading-normal">Headline branding, stage time, full resume portal, premium booth space.</p>
            </div>
          </div>
        </div>

        {/* Organizer contact info */}
        <div className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Event Coordinating Officer</p>
            <p className="text-slate-200 font-bold mt-0.5">{event.organizer?.name || 'Academic Committee'}</p>
          </div>
          <a 
            href={`mailto:${event.organizer?.email}`}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 font-semibold hover:bg-indigo-600/25 transition-colors"
          >
            Email Organizer
          </a>
        </div>

        {/* Action button */}
        <div className="mt-2 flex gap-3 justify-end border-t border-white/5 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Cancel
          </button>
          
          {isAlreadyOffered ? (
            <button
              disabled
              className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-not-allowed flex items-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" /> Sponsorship Offer Submitted
            </button>
          ) : (
            <button
              onClick={onSendOfferClick}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all duration-200 flex items-center gap-1"
            >
              Send sponsorship offer <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

// Modal Component 2: Send Offer Modal
const SponsorOfferModal = ({ isOpen, onClose, event, onSubmit, submitting }) => {
  if (!event) return null;

  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  const [perks, setPerks] = useState([]);

  // Form submit handler
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!budget || parseFloat(budget) <= 0) {
      return alert('Please enter a valid budget amount');
    }
    if (!message.trim()) {
      return alert('Please enter a short message for the organizing committee');
    }

    onSubmit({
      budget: parseFloat(budget),
      message: message.trim(),
      perksRequested: perks
    });
  };

  // Toggle perks array
  const handleTogglePerk = (perk) => {
    if (perks.includes(perk)) {
      setPerks(perks.filter(p => p !== perk));
    } else {
      setPerks([...perks, perk]);
    }
  };

  const perkOptions = [
    'Logo on banner',
    'Stage time',
    'Booth space',
    'Resume access',
    'Social media mention'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Dispatch Sponsorship Offer to ${event.title}`}
      size="md"
    >
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 text-left">
        {/* Helper layout notice */}
        <div className="bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 text-xs px-3.5 py-3 rounded-xl flex gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="leading-relaxed">
            Specify your financial budget allocation and request promotional perks. The student organizing committee will be notified immediately to review your company credentials.
          </p>
        </div>

        {/* Budget Input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300 font-semibold flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5 text-indigo-400" /> Sponsorship Budget (₹ amount)
          </label>
          <input
            required
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 35000"
            min="1000"
            className="w-full bg-[#12121a] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Textarea Proposal Message */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-300 font-semibold">
            Message to Organizing Committee
          </label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Introduce your company interests, goals, and specify why you want to support this collegiate event..."
            rows={4}
            className="w-full bg-[#12121a] border border-white/10 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Perks Checkboxes */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-300 font-semibold">
            Requested Perks & Collaboration Elements
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
            {perkOptions.map((perk, idx) => {
              const isChecked = perks.includes(perk);
              return (
                <label 
                  key={idx}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border text-[11px] font-medium ${
                    isChecked 
                      ? 'bg-indigo-600/10 border-indigo-600/30 text-indigo-300' 
                      : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleTogglePerk(perk)}
                    className="accent-indigo-600 cursor-pointer"
                  />
                  <span>{perk}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex gap-3 justify-end border-t border-white/5 pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting offer...' : 'Submit Proposal Offer'} <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </Modal>
  );
};
