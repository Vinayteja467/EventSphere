import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PremiumCard } from './common/PremiumCard.jsx';
import { cn } from '../utils/cn.js';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend, // e.g. "+12.5% this week"
  trendType = 'up', // 'up', 'down', 'neutral'
  glow = 'organizer',
  className = ''
}) => {
  const isUp = trendType === 'up';
  const isDown = trendType === 'down';

  return (
    <PremiumCard
      as={motion.div}
      glow={glow}
      type="stat"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400 light:text-slate-500 uppercase tracking-wider">{title}</span>
        
        {/* Value */}
        <h2 className="text-3xl font-bold text-slate-50 light:text-slate-900 mt-1 tracking-tight">
          {value}
        </h2>

        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {isUp && (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                {trend.split(' ')[0]}
              </span>
            )}
            {isDown && (
              <span className="inline-flex items-center text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                {trend.split(' ')[0]}
              </span>
            )}
            {!isUp && !isDown && (
              <span className="text-xs font-semibold text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full">
                {trend.split(' ')[0]}
              </span>
            )}
            <span className="text-xs text-slate-400 light:text-slate-500">
              {trend.split(' ').slice(1).join(' ')}
            </span>
          </div>
        )}
      </div>

      {/* Icon Frame */}
      {Icon && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 light:text-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
          <Icon className="w-6 h-6" />
        </div>
      )}
    </PremiumCard>
  );
};
