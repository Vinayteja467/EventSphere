import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Search, HelpCircle, ArrowRight } from 'lucide-react';
import { Button } from './Button.jsx';
import { PremiumCard } from './common/PremiumCard.jsx';
import { SponsorCard } from './SponsorCard.jsx';
import { useToast } from '../hooks/useToast.js';
import API from '../api/api.js';

export const AIMatchPanel = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hackathon');
  const [audienceSize, setAudienceSize] = useState('300');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const toast = useToast();

  const handleAIMatch = async (e) => {
    e.preventDefault();
    if (!title) {
      toast.error('Please enter an event title');
      return;
    }

    setLoading(true);
    setMatches(null);

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const res = await API.post('/ai/sponsor-match', {
        eventTitle: title,
        category,
        audienceSize: parseInt(audienceSize, 10),
        tags
      });

      if (res.data.success) {
        setMatches(res.data.data);
        toast.success(`Successfully analyzed ${res.data.data.length} sponsor matches!`);
      } else {
        toast.error(res.data.message || 'AI Matching failed');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error occurred while calling Gemini AI');
    } finally {
      setLoading(false);
    }
  };

  const handleSponsorConnect = async (sponsorId) => {
    // Simulated connect request
    toast.success('Sponsorship request successfully sent! They will review your event.');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search form box */}
      <PremiumCard as="form" onSubmit={handleAIMatch} glow="ai" className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-indigo-400">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="text-base font-bold text-slate-100 light:text-slate-900 tracking-tight">
            Gemini AI Sponsor Matchmaker
          </h3>
        </div>
        <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed -mt-1">
          Specify your event specs and our advanced Gemini AI engine will map out optimal sponsor fits from our verified database based on their marketing budget and interests.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 light:text-slate-500 font-medium">Event Title</label>
            <input
              type="text"
              placeholder="e.g. HackWest 2026, React Workshop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 light:text-slate-500 font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#12121a] border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="Hackathon">Hackathon</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Cultural">Cultural Event</option>
              <option value="Technical Fest">Technical Fest</option>
            </select>
          </div>

          {/* Turnout */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 light:text-slate-500 font-medium">Expected Turnout (Students)</label>
            <input
              type="number"
              value={audienceSize}
              onChange={(e) => setAudienceSize(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 light:text-slate-500 font-medium">Keywords/Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. web3, AI, robotics, design, STEM"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <Button type="submit" loading={loading} variant="primary" className="mt-4 py-2.5">
          <Brain className="w-4 h-4 mr-2" /> Match Sponsors with AI
        </Button>
      </PremiumCard>

      {/* Results grid */}
      <AnimatePresence>
        {matches && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-4"
          >
            <div className="flex justify-between items-center px-1">
              <h3 className="text-base font-bold text-slate-100 light:text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                Ranked AI Recommendations
              </h3>
              <span className="caption bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/50">
                {matches.length} matches found
              </span>
            </div>

            {matches.length === 0 ? (
              <div className="glass-panel p-8 text-center text-slate-400">
                No active verified sponsors found matching the requirements. Try adjustments!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((item, index) => (
                  <SponsorCard
                    key={index}
                    sponsor={item.sponsor}
                    score={item.score}
                    reason={item.reason}
                    onConnect={handleSponsorConnect}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
