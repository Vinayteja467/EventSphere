import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, DollarSign, Award, CheckCircle } from 'lucide-react';
import { PremiumCard } from './common/PremiumCard.jsx';
import { cn } from '../utils/cn.js';

export const SponsorCard = ({
  sponsor,
  score, // 0-100 match score (optional, shown in recommendation panels)
  reason, // Explanation text (optional)
  onConnect,
  isConnected = false,
  loading = false,
  className = ''
}) => {
  // Score badge coloring
  const getScoreColor = (num) => {
    if (num >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (num >= 50) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  };

  return (
    <PremiumCard
      as={motion.div}
      glow="sponsor"
      type="sponsor"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {/* Decorative Glow if high score */}
      {score >= 80 && (
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      )}

      <div>
        {/* Header: Logo, Name, Score Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={sponsor.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sponsor.companyName)}`}
              alt={sponsor.companyName}
              className="w-12 h-12 rounded-xl object-cover border border-white/10 p-0.5 bg-slate-900"
            />
            <div>
              <h3 className="text-base font-bold text-slate-50 light:text-slate-900 leading-snug tracking-tight">
                {sponsor.companyName}
              </h3>
              <span className="inline-flex items-center text-[10px] text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded-md border border-indigo-500/15 mt-1 uppercase font-semibold">
                {sponsor.industry}
              </span>
            </div>
          </div>

          {/* AI Match score badge */}
          {score !== undefined && (
            <div className={cn("flex flex-col items-center border px-2.5 py-1 rounded-xl backdrop-blur-md", getScoreColor(score))}>
              <span className="text-[10px] font-medium uppercase tracking-widest text-[8px]">AI Match</span>
              <span className="text-lg font-bold">{score}%</span>
            </div>
          )}
        </div>

        {/* AI Reason callout */}
        {score !== undefined && reason && (
          <div className="mt-4 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-slate-300 light:text-slate-600 leading-relaxed font-sans italic">
            "{reason}"
          </div>
        )}

        {/* Interests & Metadata */}
        <div className="mt-4 flex flex-col gap-2.5 text-xs text-slate-400 light:text-slate-600">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200 light:text-slate-800">
              Budget: {sponsor.budgetRange}
            </span>
          </div>

          <div className="mt-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 light:text-slate-400 tracking-wider">Target Interests</span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {sponsor.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-white/5 border border-white/5 text-slate-300"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Connect Button */}
      {onConnect && (
        <div className="mt-5 pt-4 border-t border-white/5 light:border-slate-200">
          {isConnected ? (
            <div className="flex items-center justify-center gap-1.5 py-1.5 text-emerald-400 text-xs font-semibold rounded-lg bg-emerald-500/5 border border-emerald-500/10 w-full">
              <CheckCircle className="w-4 h-4" /> Connected
            </div>
          ) : (
            <button
              onClick={() => onConnect(sponsor._id)}
              disabled={loading}
              className="w-full py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 border border-indigo-500/20 active:scale-95 transition-all duration-200"
            >
              {loading ? 'Connecting...' : 'Request Sponsorship'}
            </button>
          )}
        </div>
      )}
    </PremiumCard>
  );
};
