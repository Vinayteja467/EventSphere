import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, PlayCircle, Award } from 'lucide-react';
import { PremiumCard } from './common/PremiumCard.jsx';
import { cn } from '../utils/cn.js';

export const TaskCard = ({
  task,
  onStatusChange,
  loading = false,
  className = ''
}) => {
  const isPending = task.status === 'pending';
  const isInProgress = task.status === 'in-progress';
  const isDone = task.status === 'done';

  const getStatusColor = () => {
    if (isDone) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (isInProgress) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  const getNextStatus = () => {
    if (isPending) return 'in-progress';
    if (isInProgress) return 'done';
    return 'pending';
  };

  const getButtonText = () => {
    if (isPending) return 'Start Task';
    if (isInProgress) return 'Complete Task';
    return 'Completed';
  };

  return (
    <PremiumCard
      as={motion.div}
      glow="volunteer"
      type="task"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(className, isDone && "opacity-75")}
    >
      <div>
        {/* Header: Title, XP tag */}
        <div className="flex items-start justify-between gap-3">
          <h3 className={cn("text-base font-bold tracking-tight text-slate-100 light:text-slate-900 leading-snug", isDone && "line-through text-slate-400")}>
            {task.title}
          </h3>
          <span className="flex-shrink-0 inline-flex items-center text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <Award className="w-3.5 h-3.5 mr-0.5" />
            +{task.xpReward || 10} XP
          </span>
        </div>

        {/* Status Indicator */}
        <div className="flex gap-2 items-center mt-3">
          <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", getStatusColor())}>
            {task.status}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 light:text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Deadline: {task.deadline || 'ASAP'}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-white/5 light:border-slate-200 flex justify-end">
        {isDone ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Good job!
          </span>
        ) : (
          <button
            onClick={() => onStatusChange(task._id, getNextStatus())}
            disabled={loading}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold border active:scale-95 transition-all duration-200 flex items-center gap-1.5",
              isPending
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/10"
            )}
          >
            {isPending ? <PlayCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {loading ? 'Updating...' : getButtonText()}
          </button>
        )}
      </div>
    </PremiumCard>
  );
};
