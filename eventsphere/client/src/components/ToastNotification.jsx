import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Volume2,
  CheckCircle,
  Award,
  Clock,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  ZapOff,
  X
} from 'lucide-react';
import { useSocket } from '../context/SocketContext.jsx';

// Role and Type colored map
const notificationConfig = {
  event_update: { icon: Volume2, color: 'text-indigo-400 border-indigo-500/30' },
  registration_success: { icon: CheckCircle, color: 'text-emerald-400 border-emerald-500/30' },
  task_assigned: { icon: Award, color: 'text-violet-400 border-violet-500/30' },
  shift_reminder: { icon: Clock, color: 'text-sky-400 border-sky-500/30' },
  sponsor_accepted: { icon: Sparkles, color: 'text-cyan-400 border-cyan-500/30' },
  milestone_reached: { icon: Award, color: 'text-purple-400 border-purple-500/30' },
  ai_alert: { icon: ShieldAlert, color: 'text-amber-400 border-amber-500/40 bg-amber-500/5' }
};

export const ToastNotification = () => {
  const { toasts, dismissToast } = useSocket();

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = notificationConfig[toast.type] || { icon: Bell, color: 'text-slate-300 border-white/10' };
          const IconComponent = config.icon;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 100, transition: { duration: 0.2 } }}
              layout
              className={`pointer-events-auto flex gap-3 p-4 rounded-2xl bg-slate-950/80 backdrop-blur-xl border ${config.color} shadow-2xl shadow-black/50`}
            >
              {/* Colored side-border status tag */}
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/5">
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Body */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-100 truncate">{toast.title}</h4>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md flex-shrink-0">
                    {toast.isAI ? 'AI Insight' : 'Alert'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {toast.msg}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => dismissToast(toast.id)}
                className="flex-shrink-0 p-1 h-fit text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
