import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import { QRModal } from '../components/QRModal.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { formatDate } from '../utils/formatDate.js';
import { Button } from '../components/Button.jsx';
import { useNavigate } from 'react-router-dom';
import API from '../api/api.js';

export const ParticipantMyEvents = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // States
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // QR modal states
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');

  const fetchMyEvents = async () => {
    setLoading(true);
    try {
      const res = await API.get('/registrations/my');
      if (res.data.success) {
        setRegistrations(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load registered events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const handleOpenQR = (qr, title) => {
    setSelectedQR(qr);
    setSelectedTitle(title);
    setIsQRModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
          <QrCode className="w-8 h-8 text-indigo-400" />
          My Registered Events
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Access your digital entry tickets. Download QR passes for scanners or review your event check-in records.
        </p>
      </div>

      {/* Grid of registered tickets */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <EmptyState
          type="events"
          title="No event registrations found"
          description="You haven't secured entry tickets for any collegiate seminars or hackathons yet. Explore upcoming catalog options."
          actionText="Browse Upcoming Events"
          onAction={() => navigate('/dashboard/participant')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {registrations.map((reg) => {
            const evt = reg.eventId;
            if (!evt) return null;
            return (
              <motion.div
                key={reg._id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel overflow-hidden flex flex-col justify-between hover:border-white/10 transition-all duration-300"
              >
                {/* Banner image with check-in overlay */}
                <div className="h-36 overflow-hidden relative">
                  <img
                    src={evt.bannerImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60"}
                    alt={evt.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/60" />
                  
                  {/* Status Overlay */}
                  <div className="absolute top-4 right-4">
                    {reg.attendanceStatus ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                        <CheckCircle className="w-3.5 h-3.5" /> Checked In
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                        <Clock className="w-3.5 h-3.5 animate-pulse" /> Registered
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-grow flex flex-col justify-between text-left">
                  <div className="flex flex-col gap-1.5">
                    <span className="caption bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md w-fit">
                      {evt.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-1 line-clamp-1">
                      {evt.title}
                    </h3>
                    
                    <div className="flex flex-col gap-1 text-[11px] text-slate-400 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{formatDate(evt.startDate).split(',')[1]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="line-clamp-1">{evt.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR view trigger */}
                  <div className="mt-5 pt-4 border-t border-white/5 flex justify-end">
                    <Button
                      variant={reg.attendanceStatus ? "glass" : "primary"}
                      size="sm"
                      onClick={() => handleOpenQR(reg.qrCode, evt.title)}
                    >
                      <QrCode className="w-4 h-4 mr-1.5" /> View QR Ticket
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* QR Ticket Modal popup */}
      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        qrCodeUrl={selectedQR}
        eventTitle={selectedTitle}
        userName={user.name}
      />

    </div>
  );
};
