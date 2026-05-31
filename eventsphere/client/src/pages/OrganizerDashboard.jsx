import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileBadge2,
  Award,
  Sparkles,
  Percent,
  Plus,
  Volume2,
  Trash2,
  Edit,
  Eye,
  Megaphone,
  BookOpen,
  Calendar,
  Layers,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  MapPin,
  Clock,
  Sparkle,
  BarChart3,
  Handshake,
  Check,
  X
} from 'lucide-react';
import { StatCard } from '../components/StatCard.jsx';
import { PremiumCard } from '../components/common/PremiumCard.jsx';
import { AnalyticsChart } from '../components/AnalyticsChart.jsx';
import { Button } from '../components/Button.jsx';
import { Modal } from '../components/Modal.jsx';
import { ManageEventModal } from './Organizer/ManageEvent.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { useToast } from '../hooks/useToast.js';
import { formatDate } from '../utils/formatDate.js';
import API from '../api/api.js';

export const OrganizerDashboard = () => {
  const toast = useToast();
  const navigate = useNavigate();
  
  // States
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events'); // 'events', 'proposals'
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  const [selectedEventForComplete, setSelectedEventForComplete] = useState(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalRegistrations: 0,
    activeVolunteers: 0,
    sponsorsOnboarded: 0,
    avgAttendance: 0
  });

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAnnounceOpen, setIsAnnounceOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  
  // Analytics modal state
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Multi-step event form state
  const [createStep, setCreateStep] = useState(1);
  const [eventForm, setEventForm] = useState({
    title: '',
    category: 'Hackathon',
    startDate: '',
    endDate: '',
    venue: '',
    description: '',
    capacity: 100,
    bannerImage: '',
    status: 'draft',
    tags: '',
    speakers: '', // Comma-separated speakers list
    scheduleTime: '',
    scheduleTitle: ''
  });

  // Announcement form state
  const [announceForm, setAnnounceForm] = useState({
    eventId: '',
    title: '',
    body: '',
    type: 'update'
  });

  const handleMarkCompleteClick = (event) => {
    setSelectedEventForComplete(event);
    setCompleteModalOpen(true);
  };

  const handleEventCompleted = (eventId) => {
    setEvents(events.map(e => e._id === eventId ? { ...e, status: 'completed' } : e));
    fetchData(); // Sync states
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/events');
      if (res.data.success) {
        setEvents(res.data.data);
        calculateStats(res.data.data);
      }

      // Pre-fetch proposals count for real-time notification badge
      const propRes = await API.get('/sponsorships/organizer');
      if (propRes.data.success) {
        setProposals(propRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve events catalog.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async () => {
    setProposalsLoading(true);
    try {
      const res = await API.get('/sponsorships/organizer');
      if (res.data.success) {
        setProposals(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load incoming sponsorship offers.');
    } finally {
      setProposalsLoading(false);
    }
  };

  const handleUpdateProposalStatus = async (proposalId, status) => {
    try {
      const res = await API.patch(`/sponsorships/${proposalId}/status`, { status });
      if (res.data.success) {
        toast.success(`Proposal successfully ${status === 'accepted' ? 'accepted' : 'declined'}!`);
        fetchProposals();
        fetchData(); // Sync updated stats (like sponsors count)
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update proposal status.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute dashboard-wide stats based on organizer's events (Optimized via Promise.all parallelization)
  const calculateStats = async (eventList) => {
    let totalRegs = 0;
    let totalVols = 0;
    let totalSponsors = 0;
    let checkInSum = 0;
    let eventsAttendedDataCount = 0;

    try {
      // Execute all event analytics requests concurrently in parallel
      await Promise.all(eventList.map(async (evt) => {
        totalVols += evt.volunteers?.length || 0;
        totalSponsors += evt.sponsors?.length || 0;
        
        try {
          const analRes = await API.get(`/analytics/${evt._id}`);
          if (analRes.data.success) {
            const stats = analRes.data.data;
            totalRegs += stats.totalRegistrations;
            if (stats.totalRegistrations > 0) {
              checkInSum += stats.attendanceRate;
              eventsAttendedDataCount++;
            }
          }
        } catch (err) {
          // Ignore individual analytics fetch failures
        }
      }));
    } catch (globalErr) {
      console.error('Failed to aggregate dashboard analytics concurrently:', globalErr);
    }

    setDashboardStats({
      totalRegistrations: totalRegs,
      activeVolunteers: totalVols || 4, // Fallback demo stats
      sponsorsOnboarded: totalSponsors || 3,
      avgAttendance: eventsAttendedDataCount > 0 ? Math.round(checkInSum / eventsAttendedDataCount) : 0
    });
  };

  // Delete event handler
  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this event? This will erase all registrations.')) return;
    try {
      const res = await API.delete(`/events/${id}`);
      if (res.data.success) {
        toast.success('Event deleted successfully.');
        setEvents(events.filter(e => e._id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event.');
    }
  };

  // Toggle publish state in table (cycles: draft -> published -> ongoing, and completes or manages certificates)
  const handleTogglePublish = async (event) => {
    let newStatus = 'published';
    if (event.status === 'draft') {
      newStatus = 'published';
    } else if (event.status === 'published') {
      newStatus = 'ongoing';
    } else if (event.status === 'ongoing') {
      handleMarkCompleteClick(event);
      return;
    } else if (event.status === 'completed') {
      navigate(`/dashboard/organizer/events/${event._id}/certificates`);
      return;
    }

    try {
      const res = await API.put(`/events/${event._id}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Event status updated to ${newStatus}!`);
        setEvents(events.map(e => e._id === event._id ? { ...e, status: newStatus } : e));
      }
    } catch (err) {
      toast.error('Failed to change event status.');
    }
  };

  // Open analytics inspector
  const handleOpenAnalytics = async (eventId) => {
    setSelectedEventId(eventId);
    setIsAnalyticsOpen(true);
    setAnalyticsLoading(true);
    setAnalyticsData(null);

    try {
      const res = await API.get(`/analytics/${eventId}`);
      if (res.data.success) {
        setAnalyticsData(res.data.data);
      } else {
        toast.error('Failed to load analytics.');
      }
    } catch (err) {
      toast.error('No registrations found for this event yet.');
      setIsAnalyticsOpen(false);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Submit announcement
  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announceForm.eventId || !announceForm.title || !announceForm.body) {
      toast.error('Please enter all announcement fields.');
      return;
    }

    try {
      const res = await API.post('/announcements', announceForm);
      if (res.data.success) {
        toast.success('Announcement broadcast successfully!');
        setIsAnnounceOpen(false);
        setAnnounceForm({ eventId: '', title: '', body: '', type: 'update' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post announcement.');
    }
  };

  // Multi-step event creation validation & handlers
  const handleNextStep = () => {
    if (createStep === 1) {
      if (!eventForm.title || !eventForm.venue || !eventForm.startDate || !eventForm.endDate) {
        toast.error('Please fill in all basic fields.');
        return;
      }
      if (new Date(eventForm.startDate) > new Date(eventForm.endDate)) {
        toast.error('End date must be after Start date.');
        return;
      }
    }
    if (createStep === 2) {
      if (!eventForm.description || !eventForm.capacity) {
        toast.error('Description and capacity are required.');
        return;
      }
    }
    setCreateStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCreateStep(prev => prev - 1);
  };

  const handleCreateEventSubmit = async () => {
    // Process speakers comma list
    const speakersArray = eventForm.speakers 
      ? eventForm.speakers.split(',').map(s => s.trim()) 
      : [];

    const schedule = eventForm.scheduleTime && eventForm.scheduleTitle
      ? [{ time: eventForm.scheduleTime, title: eventForm.scheduleTitle, speaker: speakersArray[0] || 'Keynote Speaker' }]
      : [];

    const tags = eventForm.tags
      ? eventForm.tags.split(',').map(t => t.trim())
      : ['tech', 'college'];

    const payload = {
      ...eventForm,
      schedule,
      tags
    };

    try {
      const res = await API.post('/events', payload);
      if (res.data.success) {
        toast.success('New Event created successfully!');
        setIsCreateOpen(false);
        setEventForm({
          title: '',
          category: 'Hackathon',
          startDate: '',
          endDate: '',
          venue: '',
          description: '',
          capacity: 100,
          bannerImage: '',
          status: 'draft',
          tags: '',
          speakers: '',
          scheduleTime: '',
          scheduleTitle: ''
        });
        setCreateStep(1);
        fetchData(); // Reload list
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event.');
    }
  };

  // Mock trend data for overview dashboard charts
  const generalTrendData = [
    { date: 'Mon', count: 12 },
    { date: 'Tue', count: 19 },
    { date: 'Wed', count: 32 },
    { date: 'Thu', count: 48 },
    { date: 'Fri', count: 65 },
    { date: 'Sat', count: 88 },
    { date: 'Sun', count: 120 }
  ];

  const generalAttendanceData = [
    { name: 'Attended', count: 85 },
    { name: 'Absent', count: 35 }
  ];

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
            <Layers className="w-8 h-8 text-indigo-400" />
            Organizer Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build hackathons, coordinate assignments, verify announcements, and review registration performance curves.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Button variant="primary" onClick={() => { setCreateStep(1); setIsCreateOpen(true); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Create Event
          </Button>
          <Button variant="secondary" onClick={() => setIsAnnounceOpen(true)} disabled={events.length === 0}>
            <Volume2 className="w-4 h-4 mr-1.5" /> Send Announcement
          </Button>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-white/5 w-fit -mt-2">
        <button
          onClick={() => setActiveTab('events')}
          className={`py-2 px-5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeTab === 'events' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Event Operations Catalog
        </button>
        <button
          onClick={() => {
            setActiveTab('proposals');
            fetchProposals();
          }}
          className={`py-2 px-5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
            activeTab === 'proposals' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Handshake className="w-3.5 h-3.5" />
          Sponsorship Proposals
          {proposals.filter(p => p.status === 'pending').length > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-bounce ml-1">
              {proposals.filter(p => p.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* 1. Stat cards */}
      {activeTab === 'events' && (
        <>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="stat" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Registrations"
            value={dashboardStats.totalRegistrations}
            icon={Users}
            trend="+14.2% this week"
            trendType="up"
          />
          <StatCard
            title="Active Volunteers"
            value={dashboardStats.activeVolunteers}
            icon={Award}
            trend="Stable"
            trendType="neutral"
          />
          <StatCard
            title="Sponsors Partnered"
            value={dashboardStats.sponsorsOnboarded}
            icon={Sparkles}
            trend="+1 new sponsor"
            trendType="up"
          />
          <StatCard
            title="Average Attendance"
            value={`${dashboardStats.avgAttendance}%`}
            icon={Percent}
            trend="+2.5% vs last sem"
            trendType="up"
          />
        </div>
      )}

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Trend Line */}
        <PremiumCard glow="organizer" type="chart" className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              General Registration Trend
            </h3>
            <span className="caption">This Week</span>
          </div>
          <AnalyticsChart type="line" data={generalTrendData} xKey="date" yKey="count" />
        </PremiumCard>

        {/* Turnout Donut */}
        <PremiumCard glow="organizer" type="chart" className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-cyan-400" />
              Average Turnout Rate
            </h3>
          </div>
          <AnalyticsChart type="donut" data={generalAttendanceData} xKey="name" yKey="count" colors={['#22d3ee', 'rgba(255,255,255,0.06)']} />
        </PremiumCard>
      </div>

      {/* 3. Event Catalog list table */}
      <div className="glass-panel overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Manage Event Catalog
          </h3>
          <span className="caption">{events.length} events total</span>
        </div>

        {loading ? (
          <div className="p-6">
            <Skeleton variant="table" />
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            type="events"
            title="No events created yet"
            description="You have not created any workshops or hackathons. Hit Create Event to draft your first collegiate experience."
            actionText="Create Your First Event"
            onAction={() => { setCreateStep(1); setIsCreateOpen(true); }}
          />
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/2 hover:bg-white/2 transition-colors">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Starts</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => (
                  <tr key={evt._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-200">{evt.title}</td>
                    <td className="px-6 py-4 text-slate-300 text-xs">{evt.category}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(evt.startDate).split(',')[1]}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{evt.participants?.length || 0} / {evt.capacity}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(evt)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                          evt.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : evt.status === 'ongoing'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                            : evt.status === 'completed'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                            : 'bg-slate-800 text-slate-400 border-white/5 hover:bg-white/5'
                        }`}
                        title="Click to advance event lifecycle"
                      >
                        {evt.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleOpenAnalytics(evt._id)}
                        className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                        title="Inspect Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>

                      {evt.status === 'ongoing' && (
                        <button
                          onClick={() => handleMarkCompleteClick(evt)}
                          className="p-1.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors animate-pulse"
                          title="Mark as Completed"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {evt.status === 'completed' && (
                        <button
                          onClick={() => navigate(`/dashboard/organizer/events/${evt._id}/certificates`)}
                          className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          title="Manage Certificates"
                        >
                          <FileBadge2 className="w-4 h-4" />
                        </button>
                      )}

                      {evt.status !== 'completed' && evt.status !== 'ongoing' && (
                        <button
                          className="p-1.5 rounded bg-slate-800 text-slate-600 cursor-not-allowed"
                          title="Complete the event first"
                          disabled
                        >
                          <FileBadge2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteEvent(evt._id)}
                        className="p-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* 4. Sponsorship Proposals tab */}
      {activeTab === 'proposals' && (
        <div className="flex flex-col gap-6">
          <div className="glass-panel overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Sponsorship Proposal Inbox
              </h3>
              <span className="caption">{proposals.length} proposals total</span>
            </div>

            {proposalsLoading ? (
              <div className="p-8">
                <Skeleton variant="table" />
              </div>
            ) : proposals.length === 0 ? (
              <EmptyState
                type="inbox"
                title="No proposals received yet"
                description="Your events have not received any corporate sponsorship pitches yet. Share your events or run AI matching to attract corporate sponsors!"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
                {proposals.map((offer) => {
                  const sponsor = offer.sponsorId;
                  const eventItem = offer.eventId;
                  if (!sponsor || !eventItem) return null;
                  
                  const isPending = offer.status === 'pending';
                  const isAccepted = offer.status === 'accepted';
                  const isRejected = offer.status === 'rejected';

                  return (
                    <PremiumCard
                      as={motion.div}
                      glow="sponsor"
                      key={offer._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 flex flex-col gap-4 overflow-hidden border-white/5 relative"
                    >
                      {/* Top banner info */}
                      <div className="flex justify-between items-start border-b border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={sponsor.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sponsor.companyName)}`}
                            alt={sponsor.companyName}
                            className="w-12 h-12 rounded-xl object-cover border border-white/10 p-0.5 bg-slate-900"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{sponsor.companyName}</h4>
                            <span className="inline-flex text-[9px] text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 mt-1 uppercase font-semibold">
                              {sponsor.industry}
                            </span>
                          </div>
                        </div>

                        {/* Status Label */}
                        <span className={`px-2.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider border ${
                          isAccepted 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : isRejected 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {offer.status}
                        </span>
                      </div>

                      {/* Offer details */}
                      <div className="flex flex-col gap-2.5 text-xs text-slate-300">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Targeting Event:</span>
                          <p className="text-xs font-bold text-slate-200 mt-0.5">{eventItem.title}</p>
                        </div>

                        <div className="flex gap-4">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Proposed Budget:</span>
                            <p className="text-sm font-extrabold text-emerald-400 mt-0.5">₹{offer.budget.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Submitted:</span>
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">
                              {new Date(offer.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Pitch Message:</span>
                          <p className="text-xs text-slate-400 italic bg-white/2 p-3 rounded-lg border border-white/5 mt-1 leading-relaxed">
                            "{offer.message}"
                          </p>
                        </div>

                        {offer.perksRequested && offer.perksRequested.length > 0 && (
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Requested Perks:</span>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {offer.perksRequested.map((p, idx) => (
                                <span key={idx} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[8px] px-2 py-0.5 rounded">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Active Actions */}
                      {isPending && (
                        <div className="flex gap-2 border-t border-white/5 pt-4 w-full">
                          <button
                            onClick={() => handleUpdateProposalStatus(offer._id, 'accepted')}
                            className="flex-grow py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center justify-center gap-1 active:scale-95 transition-all duration-200"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept Offer
                          </button>
                          <button
                            onClick={() => handleUpdateProposalStatus(offer._id, 'rejected')}
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-white/5 border border-white/5 text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-1 active:scale-95"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      )}
                    </PremiumCard>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- WIZARDS & MODALS --- */}

      {/* A. MULTI-STEP EVENT CREATION MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Event Creation Wizard"
        size="lg"
      >
        <div className="flex flex-col gap-6 text-left">
          
          {/* Step Progress indicator */}
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-white/5">
            <span className="text-xs text-slate-400 font-semibold uppercase">Step {createStep} of 3</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`w-8 h-1.5 rounded-full transition-all duration-300 ${
                    s <= createStep ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form Content Steps */}
          {createStep === 1 && (
            <PremiumCard glow="organizer" className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Step 1: Core Basics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stanford CyberHack 2026"
                    value={eventForm.title}
                    onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Category *</label>
                  <select
                    value={eventForm.category}
                    onChange={e => setEventForm({ ...eventForm, category: e.target.value })}
                    className="bg-[#12121a] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Cultural">Cultural</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.startDate}
                    onChange={e => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.endDate}
                    onChange={e => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs text-slate-400 font-medium">Venue *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gates Computer Science Hall, Room 104"
                    value={eventForm.venue}
                    onChange={e => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-4">
                <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleNextStep}>Next: Event Details</Button>
              </div>
            </PremiumCard>
          )}

          {createStep === 2 && (
            <PremiumCard glow="organizer" className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <Layers className="w-5 h-5 text-indigo-400" />
                Step 2: Rich Event Details
              </h3>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Event Description *</label>
                <textarea
                  required
                  placeholder="Provide an enticing summary, requirements, rules, or curriculum of the event..."
                  value={eventForm.description}
                  onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                  rows={4}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Maximum Capacity *</label>
                  <input
                    type="number"
                    required
                    value={eventForm.capacity}
                    onChange={e => setEventForm({ ...eventForm, capacity: parseInt(e.target.value, 10) })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Keywords/Tags (comma split)</label>
                  <input
                    type="text"
                    placeholder="e.g. AI, React, Hackathon, STEM"
                    value={eventForm.tags}
                    onChange={e => setEventForm({ ...eventForm, tags: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs text-slate-400 font-medium">Banner Image URL</label>
                  <input
                    type="text"
                    placeholder="Leave blank for automatic, beautiful tech illustration."
                    value={eventForm.bannerImage}
                    onChange={e => setEventForm({ ...eventForm, bannerImage: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {eventForm.bannerImage && (
                    <div className="h-28 rounded-lg overflow-hidden border border-white/10 mt-2">
                      <img src={eventForm.bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between gap-2.5 mt-4">
                <Button variant="secondary" onClick={handlePrevStep}>Back</Button>
                <Button variant="primary" onClick={handleNextStep}>Next: Publish review</Button>
              </div>
            </PremiumCard>
          )}

          {createStep === 3 && (
            <PremiumCard glow="organizer" className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <CheckCircle className="w-5 h-5 text-indigo-400" />
                Step 3: Review & Publish
              </h3>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-3 text-xs">
                <h4 className="text-sm font-bold text-indigo-400">{eventForm.title}</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-400 mt-1">
                  <div><strong>Category:</strong> {eventForm.category}</div>
                  <div><strong>Capacity:</strong> {eventForm.capacity} students</div>
                  <div><strong>Venue:</strong> {eventForm.venue}</div>
                  <div><strong>Tags:</strong> {eventForm.tags || 'None specified'}</div>
                </div>
                <div className="text-slate-300 mt-2 border-t border-white/5 pt-2">
                  <strong>Description Summary:</strong>
                  <p className="line-clamp-2 mt-1 leading-relaxed">{eventForm.description}</p>
                </div>
              </div>

              {/* Visibility selection */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs text-slate-400 font-medium">Publishing Options</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEventForm({ ...eventForm, status: 'draft' })}
                    className={`py-3 px-4 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                      eventForm.status === 'draft'
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                        : 'bg-white/5 border-white/5 text-slate-400'
                    }`}
                  >
                    Draft Mode (Invisible)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventForm({ ...eventForm, status: 'published' })}
                    className={`py-3 px-4 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                      eventForm.status === 'published'
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                        : 'bg-white/5 border-white/5 text-slate-400'
                    }`}
                  >
                    Publish (Live Now!)
                  </button>
                </div>
              </div>

              <div className="flex justify-between gap-2.5 mt-6">
                <Button variant="secondary" onClick={handlePrevStep}>Back</Button>
                <Button variant="primary" onClick={handleCreateEventSubmit}>
                  Confirm & Create Event
                </Button>
              </div>
            </PremiumCard>
          )}
        </div>
      </Modal>

      {/* B. BROADCAST ANNOUNCEMENT MODAL */}
      <Modal
        isOpen={isAnnounceOpen}
        onClose={() => setIsAnnounceOpen(false)}
        title="Broadcast Announcement"
        size="md"
      >
        <form onSubmit={handleSendAnnouncement} className="flex flex-col gap-4 text-left">
          <div className="flex items-center gap-2 text-indigo-400">
            <Megaphone className="w-5 h-5 text-cyan-400" />
            <p className="text-xs text-slate-400">Send instant updates, alert warnings, or reminder check-ins to all registered event participants.</p>
          </div>

          {/* Select Event */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Select Target Event *</label>
            <select
              value={announceForm.eventId}
              onChange={e => setAnnounceForm({ ...announceForm, eventId: e.target.value })}
              required
              className="bg-[#12121a] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose Event --</option>
              {events.map(e => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
          </div>

          {/* Type of broadcast */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Announcement Priority *</label>
            <div className="grid grid-cols-3 gap-2">
              {['update', 'alert', 'reminder'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAnnounceForm({ ...announceForm, type: t })}
                  className={`py-2 rounded-lg border text-xs font-semibold capitalize transition-all duration-150 ${
                    announceForm.type === t
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-sm shadow-indigo-600/5'
                      : 'bg-white/5 border-white/5 text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Broadcast Subject *</label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule Update, Venue Changed!"
              value={announceForm.title}
              onChange={e => setAnnounceForm({ ...announceForm, title: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none"
            />
          </div>

          {/* Body */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Announcement Content Message *</label>
            <textarea
              required
              placeholder="Type your event update broadcast message..."
              value={announceForm.body}
              onChange={e => setAnnounceForm({ ...announceForm, body: e.target.value })}
              rows={4}
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 mt-2">
            <Button variant="secondary" onClick={() => setIsAnnounceOpen(false)}>Close</Button>
            <Button type="submit" variant="primary">Broadcast Alert</Button>
          </div>
        </form>
      </Modal>

      {/* C. ANALYTICS INSPECTOR MODAL */}
      <Modal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        title="Event Analytics Inspector"
        size="lg"
      >
        {analyticsLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Skeleton variant="text" count={2} />
          </div>
        ) : analyticsData ? (
          <div className="flex flex-col gap-6 text-left">
            <div>
              <h4 className="text-base font-bold text-slate-100">{analyticsData.eventTitle}</h4>
              <p className="text-[11px] text-indigo-400 mt-0.5">Live Analytics Sheet</p>
            </div>

            {/* Quick mini-stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Registrants</span>
                <p className="text-xl font-bold text-slate-100 mt-1">{analyticsData.totalRegistrations}</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Attended</span>
                <p className="text-xl font-bold text-slate-100 mt-1">{analyticsData.attendedCount}</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Turnout</span>
                <p className="text-xl font-bold text-cyan-400 mt-1">{analyticsData.attendanceRate}%</p>
              </div>
            </div>

            {/* Registration trend chart */}
            <div className="flex flex-col gap-3">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Registration Timeline Curve</span>
              <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5">
                <AnalyticsChart type="line" data={analyticsData.registrationTrend} xKey="date" yKey="count" height={220} />
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <Button variant="secondary" onClick={() => setIsAnalyticsOpen(false)}>Close Inspector</Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-400 py-6">No records found.</div>
        )}
      </Modal>

      <ManageEventModal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        event={selectedEventForComplete}
        onCompleted={handleEventCompleted}
      />

    </div>
  );
};
