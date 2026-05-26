import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { Sparkles, Compass, CheckCircle2, User, Trophy, Rocket } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';

export const OnboardingModal = () => {
  const { user, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user) {
      const completed = localStorage.getItem(`onboarded_${user._id}`);
      if (!completed) {
        setAvatarSeed(user.name);
        setIsOpen(true);
      }
    }
  }, [user]);

  if (!user) return null;

  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handleCompleteProfile = async () => {
    setLoading(true);
    try {
      const newAvatar = avatarSeed
        ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`
        : user.avatar;
      
      // Save profile info
      const res = await updateProfile(user.name, newAvatar, { bio });
      if (res && res.success) {
        toast.success('Profile completed successfully!');
        setStep(2);
      } else {
        toast.error('Failed to update profile. Moving next.');
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishOnboarding = () => {
    localStorage.setItem(`onboarded_${user._id}`, 'true');
    setIsOpen(false);
    toast.success(`Welcome to EventSphere! Let's get started.`);
  };

  const getRolePrompt = () => {
    switch (user.role) {
      case 'organizer':
        return {
          title: 'Design Your First Event',
          desc: 'Create and customize workshops, technical seminars, or massive hackathons. Invite sponsors, deploy volunteers, and track attendee turnouts in real time.',
          btn: 'Draft First Event'
        };
      case 'volunteer':
        return {
          title: 'Secure Event Operations',
          desc: 'Explore available event roles, manage volunteer checklists, check in attendees via QR, and compete on the global volunteer XP leaderboard!',
          btn: 'View Task Board'
        };
      case 'sponsor':
        return {
          title: 'Configure Sponsor Profile',
          desc: 'Set up your company details, industries of interest, and budget range. Use our Gemini AI tool to match with suitable collegiate events.',
          btn: 'Set Up Company'
        };
      case 'admin':
        return {
          title: 'Configure Platform Moderation',
          desc: 'Manage all platform accounts, edit user roles, approve pending sponsor applications, and moderate event catalogs.',
          btn: 'Go to Admin Center'
        };
      case 'participant':
      default:
        return {
          title: 'Explore Collegiate Ecosystems',
          desc: 'Search active events, secure entry registrations, view ticket QRs, and earn verified, downloadable certificates upon participation!',
          btn: 'Explore Events'
        };
    }
  };

  const rolePrompt = getRolePrompt();

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={`Welcome, ${user.name}!`}
      size="md"
    >
      <div className="flex flex-col gap-6">
        {/* Step Indicator */}
        <div className="flex justify-between items-center bg-slate-900/60 light:bg-slate-100 p-2.5 rounded-xl border border-white/5">
          <span className="text-xs text-slate-400 font-medium">Onboarding progress</span>
          <span className="text-xs font-semibold text-indigo-400">Step {step} of 3</span>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Profile Complete */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 text-indigo-400">
                <User className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100 light:text-slate-900">Complete your profile</h3>
              </div>
              <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed -mt-1">
                Customize your unique EventSphere avatar seed and write a brief bio for organizers and other attendees to see.
              </p>

              {/* Avatar Generator */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 mt-2">
                <img
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full border border-indigo-500/30 bg-slate-900"
                />
                <div className="flex-grow flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-semibold">Avatar Seed Word</label>
                  <input
                    type="text"
                    value={avatarSeed}
                    onChange={(e) => setAvatarSeed(e.target.value)}
                    placeholder="Enter seed to randomize..."
                    className="bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Bio area */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-semibold">Short Biography</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself (e.g. computer science student, blockchain developer, corporate sponsor...)"
                  rows={3}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <Button onClick={handleCompleteProfile} loading={loading} className="w-full mt-2">
                Save & Continue
              </Button>
            </motion.div>
          )}

          {/* Step 2: Role Action Prompt */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4 text-center items-center py-4"
            >
              <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                <Rocket className="w-7 h-7" />
              </div>

              <div className="mt-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 bg-indigo-500/5 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  Role: {user.role}
                </span>
                <h3 className="text-lg font-bold text-slate-100 light:text-slate-900 mt-2.5">
                  {rolePrompt.title}
                </h3>
                <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed mt-2 max-w-sm">
                  {rolePrompt.desc}
                </p>
              </div>

              <Button onClick={handleNextStep} className="w-full mt-4">
                {rolePrompt.btn}
              </Button>
            </motion.div>
          )}

          {/* Step 3: Platform Highlights */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h3 className="text-base font-bold text-slate-100 light:text-slate-900">EventSphere Highlights</h3>
              </div>
              <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed -mt-1">
                Explore a few standout premium technologies that back your collegiate event hosting experience:
              </p>

              {/* 3 bullet highlights */}
              <div className="flex flex-col gap-3 mt-1">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <Compass className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Gemini Matchmaking</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Sponsors get matching percentages and custom justifications directly from Google Gemini AI.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <Trophy className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">XP & Leaderboards</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Volunteers toggle custom event tasks and scan attendee check-in passes to climb the ranks!
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Verified Credentials</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Secure ticket QR downloads and dynamic PDF certificates of completion automatically.
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleFinishOnboarding} className="w-full mt-2" variant="cyan">
                Get Started!
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};
