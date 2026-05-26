import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Calendar, Award, Trash2, Edit, Save, Search, CheckCircle, XCircle } from 'lucide-react';
import { StatCard } from '../components/StatCard.jsx';
import { PremiumCard } from '../components/common/PremiumCard.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Button } from '../components/Button.jsx';
import { useToast } from '../hooks/useToast.js';
import { formatDate } from '../utils/formatDate.js';
import API from '../api/api.js';

export const AdminDashboard = () => {
  const toast = useToast();

  // States
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  
  // Row editing states
  const [editingUserId, setEditingUserId] = useState('');
  const [editingRole, setEditingRole] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Fetch admin summaries
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const userRes = await API.get('/users');
      const eventRes = await API.get('/events');

      if (userRes.data.success) setUsers(userRes.data.data);
      if (eventRes.data.success) setEvents(eventRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load administrative indexes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Update user role handler
  const handleSaveRole = async (userId) => {
    setSaveLoading(true);
    try {
      const res = await API.put(`/users/${userId}/role`, { role: editingRole });
      if (res.data.success) {
        toast.success(res.data.message);
        setUsers(users.map(u => u._id === userId ? { ...u, role: editingRole } : u));
        setEditingUserId('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete event in queue
  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event from the platform? This action is irreversible.')) return;
    try {
      const res = await API.delete(`/events/${id}`);
      if (res.data.success) {
        toast.success('Event purged successfully.');
        setEvents(events.filter(e => e._id !== id));
      }
    } catch (err) {
      toast.error('Failed to purge event.');
    }
  };

  const handleStartEdit = (user) => {
    setEditingUserId(user._id);
    setEditingRole(user.role);
  };

  // Filters users based on name/email query
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      
      {/* Header Info */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
          <Shield className="w-8 h-8 text-indigo-400" />
          Admin Workspace
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review platforms statistics, edit user permission levels, and moderate the global collegiate event catalog.
        </p>
      </div>

      {/* 1. Global Platform Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="stat" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Users Onboarded"
            value={users.length}
            icon={Users}
            trend="Active Accounts"
            trendType="neutral"
          />
          <StatCard
            title="Registered Events"
            value={events.length}
            icon={Calendar}
            trend="Active Catalogs"
            trendType="neutral"
          />
          <StatCard
            title="System Role Clearances"
            value="5 Levels"
            icon={Shield}
            trend="RBAC Active"
            trendType="neutral"
          />
        </div>
      )}

      {/* 2. Main Admin Workspace Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* User Roles Management Table */}
        <PremiumCard glow="default" className="xl:col-span-2 overflow-hidden flex flex-col h-fit">
          <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                User Permissions Registry
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Edit system role properties.</p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-5"><Skeleton variant="table" /></div>
          ) : filteredUsers.length === 0 ? (
            <p className="p-6 text-xs text-slate-500 italic text-center">No users matching query.</p>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Role</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((usr) => (
                    <tr key={usr._id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="px-5 py-3.5 flex items-center gap-2.5">
                        <img src={usr.avatar} className="w-7 h-7 rounded-full border border-white/10" alt="" />
                        <span className="text-xs font-semibold text-slate-200">{usr.name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 truncate max-w-[150px]">{usr.email}</td>
                      <td className="px-5 py-3.5 text-xs">
                        {editingUserId === usr._id ? (
                          <select
                            value={editingRole}
                            onChange={(e) => setEditingRole(e.target.value)}
                            className="bg-[#12121a] border border-white/20 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none"
                          >
                            <option value="participant">Participant</option>
                            <option value="organizer">Organizer</option>
                            <option value="volunteer">Volunteer</option>
                            <option value="sponsor">Sponsor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="capitalize px-2 py-0.5 rounded-md bg-white/5 border border-white/5 font-semibold text-indigo-300">
                            {usr.role}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 flex items-center justify-center gap-2.5">
                        {editingUserId === usr._id ? (
                          <>
                            <button
                              onClick={() => handleSaveRole(usr._id)}
                              disabled={saveLoading}
                              className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingUserId('')}
                              className="p-1 rounded bg-slate-500/10 text-slate-400 hover:bg-slate-500/20"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(usr)}
                            className="p-1 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                            title="Edit Role Properties"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PremiumCard>

        {/* Catalog Moderation queue list */}
        <PremiumCard glow="danger" className="overflow-hidden flex flex-col h-fit">
          <div className="p-5 border-b border-white/5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Event Moderation Docket
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Audit global event catalogs.</p>
          </div>

          {loading ? (
            <div className="p-5"><Skeleton variant="text" count={3} /></div>
          ) : events.length === 0 ? (
            <p className="p-6 text-xs text-slate-500 italic text-center">Moderation queue empty.</p>
          ) : (
            <div className="flex flex-col">
              {events.map((evt) => (
                <div key={evt._id} className="flex justify-between items-center p-4 border-b border-white/5 hover:bg-white/2 transition-colors">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 truncate">{evt.title}</h4>
                    <div className="flex gap-2 items-center mt-1 text-[10px] text-slate-400">
                      <span className="capitalize text-indigo-400">{evt.category}</span>
                      <span>•</span>
                      <span>By {evt.organizer?.name || 'Organizer'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(evt._id)}
                    className="p-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex-shrink-0"
                    title="Purge Event Listing"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </PremiumCard>

      </div>

    </div>
  );
};
