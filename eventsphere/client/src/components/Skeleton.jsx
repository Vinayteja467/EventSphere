import React from 'react';
import { cn } from '../utils/cn.js';

export const Skeleton = ({ className = '', variant = 'text', count = 1 }) => {
  const baseClass = "animate-pulse bg-white/5 light:bg-slate-200 rounded-lg";

  const renderSkeleton = () => {
    switch (variant) {
      case 'circle':
        return <div className={cn(baseClass, "rounded-full", className)} />;
      case 'card':
        return (
          <div className={cn("glass-panel p-5 flex flex-col gap-4 w-full", className)}>
            <div className="animate-pulse bg-white/5 light:bg-slate-200 h-40 w-full rounded-lg" />
            <div className="animate-pulse bg-white/5 light:bg-slate-200 h-6 w-3/4 rounded-lg" />
            <div className="animate-pulse bg-white/5 light:bg-slate-200 h-4 w-1/2 rounded-lg" />
            <div className="flex justify-between items-center mt-2">
              <div className="animate-pulse bg-white/5 light:bg-slate-200 h-4 w-1/4 rounded-lg" />
              <div className="animate-pulse bg-white/5 light:bg-slate-200 h-8 w-1/3 rounded-lg" />
            </div>
          </div>
        );
      case 'stat':
        return (
          <div className={cn("glass-panel p-5 flex items-center justify-between w-full", className)}>
            <div className="flex flex-col gap-2 w-2/3">
              <div className="animate-pulse bg-white/5 light:bg-slate-200 h-4 w-1/2 rounded-lg" />
              <div className="animate-pulse bg-white/5 light:bg-slate-200 h-8 w-3/4 rounded-lg" />
              <div className="animate-pulse bg-white/5 light:bg-slate-200 h-3 w-1/3 rounded-lg" />
            </div>
            <div className="animate-pulse bg-white/5 light:bg-slate-200 w-12 h-12 rounded-full" />
          </div>
        );
      case 'table':
        return (
          <div className={cn("w-full flex flex-col gap-4", className)}>
            <div className="animate-pulse bg-white/10 light:bg-slate-300 h-10 w-full rounded-lg" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white/5 light:bg-slate-200 h-12 w-full rounded-lg" />
            ))}
          </div>
        );
      case 'text':
      default:
        return (
          <div className="flex flex-col gap-2 w-full">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className={cn(baseClass, "h-4", className)}
                style={{ width: count > 1 && i === count - 1 ? '60%' : '100%' }}
              />
            ))}
          </div>
        );
    }
  };

  return renderSkeleton();
};
