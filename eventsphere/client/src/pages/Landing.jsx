import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Brain,
  Trophy,
  QrCode,
  FileBadge2,
  BarChart3,
  Layers,
  ChevronLeft,
  ChevronRight,
  Send,
  Calendar
} from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { PremiumCard } from '../components/common/PremiumCard.jsx';
import { useToast } from '../hooks/useToast.js';
import API from '../api/api.js';

export const Landing = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Load events for showcase
  useEffect(() => {
    const fetchShowcaseEvents = async () => {
      try {
        const res = await API.get('/events?status=published');
        if (res.data.success) {
          setEvents(res.data.data.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load showcase events:', err);
      }
    };
    fetchShowcaseEvents();
  }, []);

  // Features list
  const features = [
    {
      icon: Brain,
      title: 'AI Sponsor Matching',
      desc: 'Enlist your event details and let Google Gemini AI analyze corporate target interests, budgets, and suggest verified partner matches.',
      glow: 'ai'
    },
    {
      icon: Trophy,
      title: 'Gamified Volunteerism',
      desc: 'Deploy student tasklists. Complete duties and verify check-ins to award volunteer XP, unlock custom badges, and climb leaderboards.',
      glow: 'volunteer'
    },
    {
      icon: QrCode,
      title: 'Real-Time QR Scanners',
      desc: 'Participants receive downloadable QR entry passes immediately upon registration. Volunteers scan passes via mobile webcam for rapid check-ins.',
      glow: 'participant'
    },
    {
      icon: FileBadge2,
      title: 'Verified Certificates',
      desc: 'Auto-generate formal certificates of excellence in downloadable PDF formats. Validated with encrypted verification hashes.',
      glow: 'volunteer'
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analytics',
      desc: 'Track ticket registration curves, active organizer stats, sponsor deals, and attendance percentages with responsive charts.',
      glow: 'organizer'
    },
    {
      icon: Layers,
      title: 'Glassmorphic Design',
      desc: 'Dark-first modern interface inspired by Linear and Discord. Fluid transitions, glowing borders, and fully responsive layouts.',
      glow: 'default'
    }
  ];

  // Testimonials
  const testimonials = [
    {
      quote: "EventSphere completely changed how we run our annual university hackathon. We secured 5 major sponsors in days using the Gemini Sponsor Matchmaker, and checked in 400 attendees in minutes!",
      author: "Arjun Mehta",
      role: "Lead Hackathon Organizer, IIT Delhi"
    },
    {
      quote: "As a student volunteer, earning XP and climbing the leaderboard made managing workshop gates incredibly fun! The automated PDF certificates unlocked immediately after my attendance check-in.",
      author: "Sarah Jenkins",
      role: "CS Volunteer & Attendee, Stanford University"
    },
    {
      quote: "Sponsoring college events used to be hit-or-miss. EventSphere's AI matching tool automatically aligned us with workshops that fit our developer marketing budget perfectly. Outstanding UX!",
      author: "David Vance",
      role: "DevRelations Manager, TechCorp Global"
    }
  ];

  const handleNextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) {
      toast.error('Please enter a valid email address');
      return;
    }
    toast.success('Thank you for subscribing! Weekly event updates are on the way.');
    setNewsletterEmail('');
  };

  return (
    <div className="min-h-screen bg-primary text-slate-100 flex flex-col justify-between select-none">
      
      {/* Navbar header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-primary/45 backdrop-blur-md border-b border-white/5 px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
          </div>
          <span className="text-base font-bold tracking-tight text-white uppercase bg-gradient-to-r from-indigo-200 to-cyan-200 bg-clip-text text-transparent">
            EventSphere
          </span>
        </div>
        <Button variant="glass" size="sm" onClick={() => navigate('/auth')}>
          Sign In
        </Button>
      </header>

      {/* Main Container */}
      <main className="flex-grow pt-24 pb-12 flex flex-col gap-20">
        
        {/* 1. Hero Section */}
        <section className="relative px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-10 overflow-hidden">
          <div className="flex flex-col gap-6 relative z-10 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Next-Gen College Event Tech</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-none text-white uppercase">
              AI-Powered Event <br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Ecosystem
              </span> <br />
              For Modern College Events.
            </h1>

            <p className="text-sm md:text-base text-slate-400 max-w-lg leading-relaxed">
              Design high-profile hackathons, college workshops, and cultural seminars. Unify participants, volunteers, corporate sponsors, and admins in one gamified, AI-integrated digital hub.
            </p>

            <div className="flex flex-wrap gap-4 mt-2">
              <Button variant="primary" size="lg" onClick={() => navigate('/auth')}>
                Create Event <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
              <Button variant="glass" size="lg" onClick={() => navigate('/auth')}>
                Explore Events
              </Button>
            </div>
          </div>

          {/* Floating animated cards showcase */}
          <div className="relative h-[380px] flex items-center justify-center z-10">
            {/* Large glow behind */}
            <div className="absolute w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl" />
            
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute w-64 glass-panel p-5 border-indigo-500/20 shadow-2xl rotate-3 transform translate-x-12 z-20"
            >
              <div className="h-32 rounded-lg bg-slate-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-indigo-900/40" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-indigo-500/25 border border-indigo-400/30 text-[9px] font-bold uppercase tracking-wider text-indigo-300">
                  Hackathon
                </span>
                <img
                  src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80"
                  alt="Codefest"
                  className="w-full h-full object-cover opacity-60"
                />
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-3">CyberHack 2026</h3>
              <p className="text-[10px] text-slate-400 mt-1">Stanford CS Department</p>
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                <span className="text-[10px] text-cyan-400 font-semibold">2d 14h left</span>
                <span className="text-[10px] text-slate-400 font-semibold">120 Registered</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }}
              className="absolute w-60 glass-panel p-5 border-cyan-500/20 shadow-2xl -rotate-6 transform -translate-x-16 -translate-y-8 z-10"
            >
              <div className="h-28 rounded-lg bg-slate-800 overflow-hidden relative">
                <div className="absolute inset-0 bg-cyan-900/40" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-cyan-500/25 border border-cyan-400/30 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                  Workshop
                </span>
                <img
                  src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&q=80"
                  alt="Workshop"
                  className="w-full h-full object-cover opacity-60"
                />
              </div>
              <h3 className="text-xs font-bold text-slate-100 mt-3">React 19 Deep Dive</h3>
              <p className="text-[9px] text-slate-400 mt-0.5">By Vercel Engineering</p>
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                <span className="text-[9px] text-cyan-400 font-semibold">4d 6h left</span>
                <span className="text-[9px] text-slate-400 font-semibold">80 / 100 booked</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 2. Stats Section */}
        <section className="px-6 md:px-12 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '10,000+', text: 'Active Student Participants', glow: 'participant' },
              { num: '500+', text: 'Successful Collegiate Events', glow: 'organizer' },
              { num: '200+', text: 'Verified Corporate Sponsors', glow: 'sponsor' }
            ].map((stat, idx) => (
              <PremiumCard
                as={motion.div}
                glow={stat.glow}
                type="stat"
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="flex flex-col items-center text-center justify-center border-white/5 shadow-md"
              >
                <h2 className="text-4xl font-extrabold text-white tracking-tight uppercase bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
                  {stat.num}
                </h2>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-2">
                  {stat.text}
                </p>
              </PremiumCard>
            ))}
          </div>
        </section>

        {/* 3. Features Grid */}
        <section className="px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col gap-10">
          <div className="text-center flex flex-col items-center gap-2">
            <span className="caption bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full uppercase font-bold tracking-widest">
              Core Technologies
            </span>
            <h2 className="text-3xl font-bold text-white tracking-tight uppercase mt-2">
              Unifying Student Communities
            </h2>
            <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
              Designed from scratch to empower students, companies, and universities with an automated, gamified environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <PremiumCard
                  as={motion.div}
                  glow={feat.glow}
                  type="feature"
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="flex flex-col gap-4 border-white/5 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-md shadow-indigo-600/5">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 tracking-tight">{feat.title}</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{feat.desc}</p>
                  </div>
                </PremiumCard>
              );
            })}
          </div>
        </section>

        {/* 4. Live Events scrolling showcase */}
        {events.length > 0 && (
          <section className="flex flex-col gap-10 overflow-hidden py-6">
            <div className="px-6 md:px-12 max-w-7xl mx-auto w-full text-center md:text-left flex flex-col md:flex-row md:justify-between md:items-end gap-4">
              <div>
                <span className="caption bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full uppercase font-bold tracking-widest">
                  Live Showcase
                </span>
                <h2 className="text-3xl font-bold text-white tracking-tight uppercase mt-2.5">
                  Browse Active Engagements
                </h2>
              </div>
              <Button variant="glass" size="sm" onClick={() => navigate('/auth')}>
                Browse Catalog <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>

            {/* Horizontal scroll */}
            <div className="flex gap-6 overflow-x-auto px-6 md:px-12 py-4 scrollbar-thin select-none snap-x">
              {events.map((evt, idx) => (
                <div key={idx} className="w-[320px] flex-shrink-0 snap-start">
                  <PremiumCard
                    glow="participant"
                    type="event"
                    className="overflow-hidden h-[340px] flex flex-col justify-between border-white/5 hover:border-indigo-500/25 transition-all duration-300"
                  >
                    <div className="h-40 overflow-hidden relative">
                      <img
                        src={evt.bannerImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60"}
                        alt={evt.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 left-3 px-2 py-0.5 text-[9px] font-bold rounded bg-indigo-600/70 border border-indigo-400/35 text-white">
                        {evt.category}
                      </span>
                    </div>
                    <div className="p-4 flex-grow flex flex-col justify-between text-left">
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 truncate">{evt.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase tracking-widest">Date</span>
                          <span className="text-[10px] text-slate-300 font-medium">
                            {new Date(evt.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <Button size="sm" variant="primary" onClick={() => navigate('/auth')} className="px-3 py-1 text-[10px] rounded-lg">
                          Register
                        </Button>
                      </div>
                    </div>
                  </PremiumCard>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Testimonial Carousel */}
        <section className="px-6 md:px-12 max-w-4xl mx-auto w-full py-8 text-center flex flex-col items-center gap-8 relative">
          <span className="caption bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full uppercase font-bold tracking-widest">
            Community Quotes
          </span>

          <div className="relative w-full h-[180px] md:h-[130px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <PremiumCard
                as={motion.div}
                glow="default"
                key={currentTestimonial}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute flex flex-col gap-4 max-w-2xl p-6 border-white/5 shadow-lg rounded-2xl"
              >
                <p className="text-sm md:text-base font-medium text-slate-200 leading-relaxed italic">
                  "{testimonials[currentTestimonial].quote}"
                </p>
                <div className="mt-1">
                  <h4 className="text-xs font-bold text-cyan-400">{testimonials[currentTestimonial].author}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{testimonials[currentTestimonial].role}</p>
                </div>
              </PremiumCard>
            </AnimatePresence>
          </div>

          {/* Nav arrow buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handlePrevTestimonial}
              className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextTestimonial}
              className="p-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer & Newsletter signup */}
      <footer className="border-t border-white/5 bg-slate-950/40 backdrop-blur-xl px-6 md:px-12 py-12 flex flex-col gap-8">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Logo & description */}
          <div className="flex flex-col gap-3 text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white uppercase bg-gradient-to-r from-indigo-200 to-cyan-200 bg-clip-text text-transparent">
                EventSphere
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mt-1">
              EventSphere is a secure, state-of-the-art AI-powered platform helping university coordinators execute hackathons and seminars with role automation, QR tickets, and certificate validation.
            </p>
          </div>

          {/* Newsletter box */}
          <div className="flex flex-col gap-4 text-left">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
              Weekly Newsletter Subscription
            </h4>
            <p className="text-[11px] text-slate-400 -mt-2">
              Stay updated on upcoming local student hackathons, career workshops, and sponsoring corporate openings.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 w-full max-w-md">
              <input
                type="email"
                placeholder="enter your student email..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors flex-grow"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all duration-200 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" /> Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500 text-[11px]">
          <span>© 2026 EventSphere Platform. Built for Hackathons & University Workgroups.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-300">Contact Developer</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
