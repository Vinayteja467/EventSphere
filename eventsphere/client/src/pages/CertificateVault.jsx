import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileBadge2 } from 'lucide-react';
import { EmptyState } from '../components/EmptyState.jsx';
import { Skeleton } from '../components/Skeleton.jsx';
import { useToast } from '../hooks/useToast.js';
import API from '../api/api.js';
import { CertificateCard } from '../components/certificates/CertificateCard.jsx';
import { CertificatePreviewModal } from '../components/certificates/CertificatePreviewModal.jsx';

export const CertificateVault = () => {
  const toast = useToast();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState('');
  
  // Preview Modal States
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      // Consume dynamic production-grade route
      const res = await API.get('/certificates/my');
      if (res.data.success) {
        setCertificates(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load certificates vault.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleDownloadCertificate = async (certificateId, eventTitle) => {
    setDownloadingId(certificateId);
    try {
      toast.info('Downloading PDF certificate...');
      
      const response = await API.get(`/certificates/download/${certificateId}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `EventSphere_Certificate_${eventTitle.replace(/\s+/g, '_')}.pdf`;
      link.click();
      
      toast.success('Certificate downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to download PDF certificate.');
    } finally {
      setDownloadingId('');
    }
  };

  const handleOpenPreview = (cert) => {
    // Map backend certificate fields to match preview template
    setSelectedCert({
      participantName: cert.eventId ? 'You' : '', // Will be updated on load or show general placeholder
      eventName: cert.eventId?.title,
      eventDate: new Date(cert.eventId?.startDate).toLocaleDateString(),
      eventVenue: cert.eventId?.venue,
      organizerName: cert.eventId?.certificateSettings?.organizerSignatureName || 'Event Director',
      organizerRole: cert.eventId?.certificateSettings?.organizerSignatureRole || 'Event Director',
      certificateId: cert.certificateId,
      type: cert.type,
      position: cert.position
    });

    // Let's resolve the user's name dynamically by fetching profile
    API.get('/users/profile')
      .then(res => {
        if (res.data.success) {
          const userName = res.data.data.user.name;
          setSelectedCert(prev => ({ ...prev, participantName: userName }));
        }
      })
      .catch(err => console.error(err));

    setPreviewOpen(true);
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
          {certificates.map((cert) => (
            <CertificateCard
              key={cert._id}
              certificate={cert}
              onPreview={() => handleOpenPreview(cert)}
              onDownload={() => handleDownloadCertificate(cert.certificateId, cert.eventId?.title || 'Event')}
              downloading={downloadingId === cert.certificateId}
            />
          ))}
        </div>
      )}

      {/* Preview replica modal */}
      <CertificatePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        certificate={selectedCert}
        onDownload={() => handleDownloadCertificate(selectedCert?.certificateId, selectedCert?.eventName || 'Event')}
      />

    </div>
  );
};
