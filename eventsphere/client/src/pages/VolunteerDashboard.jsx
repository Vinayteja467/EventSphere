import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Trophy, QrCode, ShieldAlert, Sparkles, CheckCircle, Camera, X } from 'lucide-react';
import { TaskCard } from '../components/TaskCard.jsx';
import { PremiumCard } from '../components/common/PremiumCard.jsx';
import { Modal } from '../components/Modal.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { Button } from '../components/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { Html5Qrcode } from 'html5-qrcode';
import API from '../api/api.js';

export const VolunteerDashboard = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  // Local States
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [taskLoadingId, setTaskLoadingId] = useState('');

  // Scanner States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  
  // HTML5 QR Code Scanner reference
  const qrScannerRef = useRef(null);
  const scannerContainerId = "mobile-web-qr-reader";

  // Sync profile details (XP, Badges, Tasks)
  const syncProfile = async () => {
    try {
      const res = await API.get('/users/profile');
      if (res.data.success) {
        setProfile(res.data.data.user);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync volunteer metrics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const res = await API.get('/volunteers/leaderboard');
      if (res.data.success) {
        setLeaderboard(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    syncProfile();
    fetchLeaderboard();
  }, []);

  // Handle task status progression
  const handleTaskStatusChange = async (taskId, nextStatus) => {
    setTaskLoadingId(taskId);
    try {
      const res = await API.patch(`/volunteers/tasks/${taskId}`, { status: nextStatus });
      if (res.data.success) {
        toast.success(res.data.message);
        syncProfile(); // Sync new XP / badge data
        fetchLeaderboard(); // Sync global rank
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setTaskLoadingId('');
    }
  };

  // Webcam QR scanner launcher
  const startQRScanner = () => {
    setIsScannerOpen(true);
    setScanResult(null);
    setScanLoading(false);

    // Initialize scanner with brief delay to ensure DOM is ready
    setTimeout(() => {
      try {
        const scanner = new Html5Qrcode(scannerContainerId);
        qrScannerRef.current = scanner;

        scanner.start(
          { facingMode: "environment" }, // Rear camera
          {
            fps: 10,
            qrbox: { width: 220, height: 220 }
          },
          (decodedText) => {
            // Success handler
            handleQRScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Silence verbose error logs (occurs on frames with no QR)
          }
        ).catch((err) => {
          console.error("Scanner start error:", err);
          toast.error("Webcam device activation failed. Please check permissions.");
          setIsScannerOpen(false);
        });

      } catch (err) {
        console.error(err);
      }
    }, 400);
  };

  // Webcam QR scanner stopper
  const stopQRScanner = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.stop();
      } catch (err) {
        console.error("Scanner stop error:", err);
      }
    }
    setIsScannerOpen(false);
  };

  // Processing scanned registration hash
  const handleQRScanSuccess = async (registrationId) => {
    // Immediately stop scanning so we do not double process
    await stopQRScanner();
    setScanLoading(true);
    toast.info("Validating registration hash...");

    try {
      const res = await API.patch(`/registrations/${registrationId}/attendance`);
      if (res.data.success) {
        setScanResult({
          success: true,
          message: res.data.message
        });
        toast.success(res.data.message);
        syncProfile();
        fetchLeaderboard();
      } else {
        setScanResult({
          success: false,
          message: res.data.message || 'Check-in validation failed.'
        });
        toast.error(res.data.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error checking in attendee.';
      setScanResult({
        success: false,
        message: msg
      });
      toast.error(msg);
    } finally {
      setScanLoading(false);
    }
  };

  // XP level calculation helper
  const volunteerXp = profile?.xp || 0;
  const currentLevel = Math.floor(volunteerXp / 100) + 1;
  const progressPercent = volunteerXp % 100;

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
            <Award className="w-8 h-8 text-indigo-400" />
            Volunteer Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Toggle task milestones, inspect badge cases, and check in participants via real-time QR scans to climb volunteer leaderboards.
          </p>
        </div>

        {/* Scan Entry trigger */}
        <Button variant="cyan" onClick={startQRScanner}>
          <QrCode className="w-4 h-4 mr-1.5" /> Scan Entry Passes
        </Button>
      </div>

      {/* 1. Gamified XP stats panel */}
      {loading ? (
        <Skeleton variant="text" count={2} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Level Progress */}
          <PremiumCard glow="volunteer" type="feature" className="lg:col-span-2 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
            
            <div className="flex justify-between items-center">
              <div>
                <span className="caption uppercase font-bold text-slate-400 tracking-wider">Leveling Status</span>
                <h3 className="text-xl font-bold text-slate-100 mt-0.5">Level {currentLevel} Specialist</h3>
              </div>
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                {volunteerXp} Total XP
              </span>
            </div>

            {/* XP progress bar */}
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>XP Progress</span>
                <span>{progressPercent}% ({100 - progressPercent} XP to Level {currentLevel + 1})</span>
              </div>
              <div className="w-full h-3 bg-white/5 border border-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </PremiumCard>

          {/* Badges list */}
          <PremiumCard glow="volunteer" type="feature" className="flex flex-col gap-4">
            <div>
              <span className="caption uppercase font-bold text-slate-400 tracking-wider">Badge Achievements</span>
              <h3 className="text-sm font-bold text-slate-100 mt-0.5">Unlocked Cases</h3>
            </div>
            
            {profile?.badges?.length === 0 ? (
              <p className="text-xs text-slate-500 italic mt-2">Earn 50 XP to unlock your first scanner badge!</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-1.5">
                {profile?.badges?.map((badge, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>
      )}

      {/* 2. Tasks & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tasks checklists */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider px-1">
            Active Assigned Duties
          </h3>
          
          {loading ? (
            <Skeleton variant="card" />
          ) : !profile?.tasks || profile.tasks.length === 0 ? (
            <EmptyState
              type="tasks"
              title="No duties assigned"
              description="University organizers have not allocated tasks to your volunteer docket. Help check in attendees using your QR Scanner!"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={handleTaskStatusChange}
                  loading={taskLoadingId === task._id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Global Leaderboards */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider px-1">
            XP Rankings (Top 10)
          </h3>

          <PremiumCard glow="volunteer" className="overflow-hidden flex flex-col">
            {leaderboardLoading ? (
              <div className="p-5">
                <Skeleton variant="text" count={4} />
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="p-6 text-xs text-slate-500 italic text-center">Leaderboard is currently empty.</p>
            ) : (
              <div className="flex flex-col">
                {leaderboard.map((user, idx) => (
                  <div
                    key={user._id}
                    className={`flex items-center justify-between p-4 border-b border-white/5 transition-colors ${
                      idx === 0
                        ? 'bg-amber-500/5'
                        : idx === 1
                        ? 'bg-indigo-500/5'
                        : 'hover:bg-white/2'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank tag */}
                      <span className={`text-xs font-black w-5 text-center flex-shrink-0 ${
                        idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-indigo-400' : 'text-slate-500'
                      }`}>
                        #{idx + 1}
                      </span>
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
                        alt={user.name}
                        className="w-8 h-8 rounded-full border border-indigo-500/20"
                      />
                      <span className="text-xs font-bold text-slate-200 truncate leading-none">{user.name}</span>
                    </div>

                    <span className="text-xs font-semibold text-cyan-400 flex-shrink-0">
                      {user.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </PremiumCard>
        </div>
      </div>

      {/* --- QR WEBCAM SCANNER MODAL --- */}
      <Modal
        isOpen={isScannerOpen}
        onClose={stopQRScanner}
        title="Webcam Gate Scanner"
        size="md"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          
          <div className="flex items-center gap-2 text-indigo-400">
            <Camera className="w-5 h-5 text-cyan-400 animate-pulse" />
            <p className="text-xs text-slate-400">Align the participant's PDF ticket QR code inside the green brackets below.</p>
          </div>

          {/* html5-qrcode target box */}
          <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-900 flex items-center justify-center">
            
            {/* Target reader mount div */}
            <div id={scannerContainerId} className="w-full h-full" />
            
            {/* Visual crop brackets overlay */}
            <div className="absolute inset-0 pointer-events-none border-[30px] border-slate-950/40 flex items-center justify-center">
              <div className="w-[180px] h-[180px] border-2 border-dashed border-cyan-400 rounded-xl" />
            </div>
          </div>

          {/* Results display */}
          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`p-4 rounded-xl border text-xs font-medium w-full flex items-start gap-2.5 mt-2 ${
                  scanResult.success
                    ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle className={`w-4 h-4 ${scanResult.success ? 'text-emerald-400' : 'text-rose-400'}`} />
                </div>
                <div className="text-left leading-relaxed">{scanResult.message}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2.5 w-full mt-4">
            <Button variant="secondary" onClick={stopQRScanner} className="flex-grow">
              Cancel Scan
            </Button>
            {scanResult && (
              <Button variant="primary" onClick={startQRScanner} className="flex-grow">
                Scan Next Ticket
              </Button>
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
};
