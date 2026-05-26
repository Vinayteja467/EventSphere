import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileBadge2, Download, Calendar, MapPin, Award, CheckCircle } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { Button } from '../components/Button.jsx';
import { useToast } from '../hooks/useToast.js';
import { formatSimpleDate } from '../utils/formatDate.js';
import API from '../api/api.js';

export const CertificateVault = () => {
  const toast = useToast();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState('');

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await API.get('/registrations/my');
      if (res.data.success) {
        // Filter out only checked in registrations
        const attended = res.data.data.filter(r => r.attendanceStatus === true);
        setCertificates(attended);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load certificate vault.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleDownloadCertificate = async (regId, eventTitle) => {
    setDownloadingId(regId);
    try {
      toast.info('Rendering your PDF certificate of excellence...');
      
      // Perform authenticated download using Blob response
      const response = await API.get(`/certificates/${regId}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `EventSphere_Certificate_${eventTitle.replace(/\s+/g, '_')}.pdf`;
      link.click();
      
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch certificate binary stream.');
    } finally {
      setDownloadingId('');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
          <FileBadge2 className="w-8 h-8 text-indigo-400" />
          Certificate Vault
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your earned credentials. Download formal, cryptographically verified PDF certificates for events you completed.
        </p>
      </div>

      {/* List of certificates */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          type="default"
          title="No certificates unlocked yet"
          description="Your vault is currently empty. Attending scheduled hackathons and workshops will automatically unlock official participation credentials."
          actionText="Browse Event Catalog"
          onAction={() => window.location.href = '/dashboard/participant'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => {
            const evt = cert.eventId;
            if (!evt) return null;
            return (
              <motion.div
                key={cert._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 relative overflow-hidden group"
              >
                {/* Glowing check badge background */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />

                <div>
                  {/* Title block */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex-shrink-0">
                      <Award className="w-6 h-6 text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                      <span className="caption uppercase font-bold text-indigo-400 tracking-wider">Credential Active</span>
                      <h3 className="text-base font-bold text-slate-100 mt-1 line-clamp-1">
                        {evt.title}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Category: {evt.category}</p>
                    </div>
                  </div>

                  {/* Metadata specs */}
                  <div className="mt-5 grid grid-cols-2 gap-3 text-[11px] text-slate-400 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Completed: {formatSimpleDate(evt.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{evt.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/5 px-2.5 py-0.5 rounded-full border border-emerald-500/15">
                    <CheckCircle className="w-3 h-3 mr-1" /> Attendance Verified
                  </span>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    loading={downloadingId === cert._id}
                    onClick={() => handleDownloadCertificate(cert._id, evt.title)}
                  >
                    <Download className="w-4 h-4 mr-1.5" /> Download PDF
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
};
