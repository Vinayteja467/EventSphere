import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Briefcase, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { Button } from '../components/Button.jsx';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('participant');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, register, forgotPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast.success(res.message || 'Login successful!');
      
      // Redirect to correct dashboard based on role in localStorage
      const userObj = JSON.parse(localStorage.getItem('user'));
      if (userObj) {
        if (userObj.role === 'admin') navigate('/dashboard/admin');
        else if (userObj.role === 'organizer') navigate('/dashboard/organizer');
        else if (userObj.role === 'volunteer') navigate('/dashboard/volunteer');
        else if (userObj.role === 'sponsor') navigate('/dashboard/sponsor');
        else navigate('/dashboard/participant');
      }
    } else {
      toast.error(res.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    const res = await register(name, email, password, role);
    setLoading(false);

    if (res.success) {
      toast.success('Account created successfully! Welcome to EventSphere.');
      if (role === 'organizer') navigate('/dashboard/organizer');
      else if (role === 'volunteer') navigate('/dashboard/volunteer');
      else if (role === 'sponsor') navigate('/dashboard/sponsor');
      else navigate('/dashboard/participant');
    } else {
      toast.error(res.message);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please provide your email');
      return;
    }
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      setIsForgot(false);
      setIsLogin(true);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-grid-cyber flex items-center justify-center p-4">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-8 shadow-2xl relative z-10 border-white/10"
      >
        {/* Brand Banner */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 mb-3">
            <Sparkles className="w-6 h-6 text-cyan-300 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white uppercase bg-gradient-to-r from-indigo-200 to-cyan-200 bg-clip-text text-transparent">
            EventSphere
          </h2>
          <p className="text-xs text-slate-400 mt-1.5">
            AI-Powered Collegiate Event Management Ecosystem
          </p>
        </div>

        {/* Tab Selection */}
        {!isForgot && (
          <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-white/5 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-grow py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-grow py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                !isLogin ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Panel Animating Forms */}
        <AnimatePresence mode="wait">
          {isForgot ? (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleForgot}
              className="flex flex-col gap-4"
            >
              <h3 className="text-base font-bold text-slate-100 mb-1">Recover Password</h3>
              <p className="text-xs text-slate-400 -mt-2 leading-relaxed">
                Provide your registered account email and we will send a mock recovery link.
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full mt-2">
                Send Recovery Link
              </Button>

              <button
                type="button"
                onClick={() => setIsForgot(false)}
                className="text-center text-xs text-indigo-400 hover:text-indigo-300 mt-2 font-medium"
              >
                Back to Login
              </button>
            </motion.form>
          ) : isLogin ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleLogin}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-slate-400 font-medium">Password</label>
                  <button
                    type="button"
                    onClick={() => setIsForgot(true)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full mt-4">
                Sign In
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleRegister}
              className="flex flex-col gap-4 animate-fadeIn"
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection Grid */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">Select Platform Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'participant', name: 'Participant' },
                    { val: 'organizer', name: 'Organizer' },
                    { val: 'volunteer', name: 'Volunteer' },
                    { val: 'sponsor', name: 'Sponsor' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setRole(item.val)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all duration-150 ${
                        role === item.val
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 shadow-sm shadow-indigo-600/5'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full mt-4">
                Create Account
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
