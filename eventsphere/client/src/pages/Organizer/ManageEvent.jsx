import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Percent, Settings, X, RefreshCw, BarChart2 } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { useToast } from '../../hooks/useToast.js';
import API from '../../api/api.js';

export const ManageEventModal = ({ isOpen, onClose, event, onCompleted }) => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(1); // 1 = Confirm, 2 = Rendering progress, 3 = Complete

  useEffect(() => {
    if (isOpen && event?._id) {
      setLoading(true);
      setStep(1);
      setProgress(0);
      
      // Fetch analytics / attendance rate
      API.get(`/analytics/${event._id}`)
        .then(res => {
          if (res.data.success) {
            setStats(res.data.data);
          }
        })
        .catch(err => {
          console.error(err);
          toast.error('Failed to retrieve event attendance stats.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const handleConfirmCompletion = async () => {
    setIsCompleting(true);
    try {
      // 1. Perform PATCH complete request
      const completeRes = await API.patch(`/events/${event._id}/complete`, {
        autoGenerate
      });

      if (completeRes.data.success) {
        // If auto-generate is true, show rendering animations
        if (autoGenerate) {
          setStep(2);
          
          // Animate progress bar rendering simulation
          let currentProgress = 0;
          const interval = setInterval(() => {
            currentProgress += 10;
            setProgress(currentProgress);
            if (currentProgress >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                setStep(3);
                setIsCompleting(false);
                const generated = completeRes.data.data.certificates?.generated || 0;
                toast.success(`${generated} certificates generated and ready for download!`);
                onCompleted(event._id);
              }, 400);
            }
          }, 200);
        } else {
          toast.success('Event successfully marked completed.');
          setIsCompleting(false);
          onCompleted(event._id);
          onClose();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to complete event.');
      setIsCompleting(false);
    }
  };

  const attended = stats?.attendedCount || 0;
  const registered = stats?.totalRegistrations || 0;
  const turnout = stats?.attendanceRate || 0;
  const threshold = event.certificateSettings?.minAttendancePercent || 70;
  const thresholdMet = turnout >= threshold;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-left">
        
        {/* Close button */}
        {step !== 2 && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Wizard step 1: Confirm completion */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                Complete Event?
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Marking <strong>{event.title}</strong> as completed will lock QR code check-ins. Attendance details will freeze permanently.
              </p>
            </div>

            {loading ? (
              <div className="py-6 flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs text-slate-500 mt-2 font-mono">Loading turnout summary...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Stats block */}
                <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Total Checked In</span>
                    <span className="text-white font-bold">{attended} of {registered} ({Math.round(turnout)}%)</span>
                  </div>
                  
                  {/* Progress turnout bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${thresholdMet ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${turnout}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                    <span className="text-slate-400">Turnout Threshold</span>
                    <span className={`font-bold flex items-center gap-1 ${thresholdMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {threshold}% - {thresholdMet ? 'Turnout Met' : 'Turnout Unmet'}
                    </span>
                  </div>
                </div>

                {/* Auto generate settings option */}
                <label className="flex items-start gap-3 bg-white/2 hover:bg-white/4 p-3.5 rounded-xl border border-white/5 cursor-pointer transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Auto-generate credentials</span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      Batch render certified landscape PDFs for {attended} eligible attendees upon confirmation.
                    </span>
                  </div>
                </label>
              </div>
            )}

            <div className="flex gap-2 justify-end border-t border-white/5 pt-4 mt-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isCompleting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isCompleting}
                onClick={handleConfirmCompletion}
                className="bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white font-bold"
              >
                Mark Completed
              </Button>
            </div>
          </div>
        )}

        {/* Wizard step 2: Rendering progress bar */}
        {step === 2 && (
          <div className="flex flex-col gap-6 py-6 text-center">
            <div className="flex justify-center">
              <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Compiling Credentials</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Rendering vector graphics, loading font assets, and generating cryptographic QR hashes for secure verify scanning...
              </p>
            </div>
            
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Rendering Status</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Wizard step 3: Success check */}
        {step === 3 && (
          <div className="flex flex-col gap-6 py-4 text-center items-center">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Generation Finished</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Credentials successfully compiled and recorded. Attendees will receive instant alerts to claim assets via their dashboards!
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={onClose} className="w-full">
              Finish & Return
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};
