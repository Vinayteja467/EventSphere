import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, Sparkles, Save, Heart, DollarSign } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { Skeleton } from '../components/Skeleton.jsx';
import API from '../api/api.js';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  // Basic States
  const [name, setName] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // Sponsor Specific States
  const [isSponsor, setIsSponsor] = useState(false);
  const [sponsorForm, setSponsorForm] = useState({
    companyName: '',
    industry: '',
    budgetRange: '',
    interests: '',
    previousEvents: ''
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users/profile');
      if (res.data.success) {
        const u = res.data.data.user;
        setName(u.name);
        
        // Extract avatar seed from URL if possible
        if (u.avatar && u.avatar.includes('seed=')) {
          const parsedSeed = decodeURIComponent(u.avatar.split('seed=')[1]);
          setAvatarSeed(parsedSeed);
        } else {
          setAvatarSeed(u.name);
        }

        if (u.role === 'sponsor' && res.data.data.sponsorProfile) {
          setIsSponsor(true);
          const s = res.data.data.sponsorProfile;
          setSponsorForm({
            companyName: s.companyName || '',
            industry: s.industry || '',
            budgetRange: s.budgetRange || '',
            interests: s.interests ? s.interests.join(', ') : '',
            previousEvents: s.previousEvents ? s.previousEvents.join(', ') : ''
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name) {
      toast.error('Please specify a profile name.');
      return;
    }

    setSaveLoading(true);

    const generatedAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`;

    let sponsorDetails = null;
    if (isSponsor) {
      sponsorDetails = {
        companyName: sponsorForm.companyName,
        industry: sponsorForm.industry,
        budgetRange: sponsorForm.budgetRange,
        interests: sponsorForm.interests ? sponsorForm.interests.split(',').map(i => i.trim()).filter(Boolean) : [],
        previousEvents: sponsorForm.previousEvents ? sponsorForm.previousEvents.split(',').map(p => p.trim()).filter(Boolean) : []
      };
    }

    try {
      const res = await updateProfile(name, generatedAvatar, sponsorDetails);
      if (res && res.success) {
        toast.success('Your profile has been saved successfully!');
      } else {
        toast.error(res?.message || 'Failed to save changes.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error occurred while updating profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto text-left">
      
      {/* Header Info */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
          <User className="w-8 h-8 text-indigo-400" />
          Account Profile
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete features onboarding, customize your digital avatar seed, and manage corporate branding sponsorships.
        </p>
      </div>

      {loading ? (
        <Skeleton variant="card" />
      ) : (
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-6 w-full">
          
          {/* A. Core Profile Basics */}
          <div className="glass-panel p-6 flex flex-col gap-5 border-white/5 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl" />
            
            <div className="flex items-center gap-2 text-indigo-400 border-b border-white/5 pb-3">
              <User className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Personal Identity
              </h3>
            </div>

            {/* Avatar block */}
            <div className="flex items-center gap-4 bg-white/2 border border-white/5 p-4 rounded-xl">
              <img
                src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`}
                alt="Avatar design preview"
                className="w-16 h-16 rounded-full border border-indigo-500/30 bg-slate-900 shadow-md shadow-indigo-600/5"
              />
              <div className="flex-grow flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Randomized Avatar Seed</label>
                <input
                  type="text"
                  value={avatarSeed}
                  onChange={(e) => setAvatarSeed(e.target.value)}
                  placeholder="Enter seed phrase..."
                  className="bg-[#12121a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Readonly Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Email Address (clearance secure)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="bg-slate-900/60 border border-white/5 text-slate-500 rounded-xl px-4 py-2 text-xs cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* B. Sponsor Specific Company Profiles */}
          {isSponsor && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 flex flex-col gap-5 border-white/5 shadow-md"
            >
              <div className="flex items-center gap-2 text-indigo-400 border-b border-white/5 pb-3">
                <Briefcase className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Corporate Sponsor Profile
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={sponsorForm.companyName}
                    onChange={e => setSponsorForm({ ...sponsorForm, companyName: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Industry */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Industry *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Technology, Software Development"
                    value={sponsorForm.industry}
                    onChange={e => setSponsorForm({ ...sponsorForm, industry: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Budget Range */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sponsorship Budget Bracket *</label>
                  <select
                    value={sponsorForm.budgetRange}
                    onChange={e => setSponsorForm({ ...sponsorForm, budgetRange: e.target.value })}
                    className="bg-[#12121a] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="$1,000 - $5,000">$1,000 - $5,000</option>
                    <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                    <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                    <option value="Above $25,000">Above $25,000</option>
                  </select>
                </div>

                {/* Interests */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Interests Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Hackathon, AI, React, Blockchain"
                    value={sponsorForm.interests}
                    onChange={e => setSponsorForm({ ...sponsorForm, interests: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Previous Events */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Previous Events Supported (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. MIT Hack2025, CS Bootcamp"
                    value={sponsorForm.previousEvents}
                    onChange={e => setSponsorForm({ ...sponsorForm, previousEvents: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* C. Commit Button */}
          <div className="flex justify-end mt-2">
            <Button type="submit" loading={saveLoading} className="py-2.5 px-6">
              <Save className="w-4 h-4 mr-2" /> Save Profile Details
            </Button>
          </div>

        </form>
      )}

    </div>
  );
};
