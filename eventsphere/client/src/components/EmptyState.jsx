import React from 'react';
import { CalendarX, Inbox, ShieldAlert, Award } from 'lucide-react';
import { Button } from './Button.jsx';
import { cn } from '../utils/cn.js';

export const EmptyState = ({
  type = 'default', // 'events', 'tasks', 'inbox', 'moderation'
  title = 'No records found',
  description = 'There are no active records in this view.',
  actionText,
  onAction,
  className = ''
}) => {
  const renderIllustration = () => {
    switch (type) {
      case 'events':
        return (
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
            <CalendarX className="w-8 h-8" />
          </div>
        );
      case 'tasks':
        return (
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <Award className="w-8 h-8" />
          </div>
        );
      case 'moderation':
        return (
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
        );
      case 'default':
      case 'inbox':
      default:
        return (
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8" />
          </div>
        );
    }
  };

  return (
    <div className={cn("glass-panel p-10 flex flex-col items-center text-center justify-center max-w-lg mx-auto border-dashed border-white/10 my-4", className)}>
      {renderIllustration()}
      
      <h3 className="text-lg font-bold text-slate-100 light:text-slate-900 tracking-tight leading-snug">
        {title}
      </h3>
      
      <p className="text-sm text-slate-400 light:text-slate-500 max-w-[85%] mt-2 leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-6">
          {actionText}
        </Button>
      )}
    </div>
  );
};
