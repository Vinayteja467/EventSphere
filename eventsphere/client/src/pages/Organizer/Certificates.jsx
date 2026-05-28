import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileBadge2,
  Users,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ShieldCheck,
  Percent,
  DownloadCloud,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { useToast } from '../../hooks/useToast.js';
import API from '../../api/api.js';
import { EligibilityTable } from '../../components/certificates/EligibilityTable.jsx';
import { CertificatePreviewModal } from '../../components/certificates/CertificatePreviewModal.jsx';

export const OrganizerCertificates = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionId, setActionId] = useState('');
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [overrideThreshold, setOverrideThreshold] = useState(false);
  
  // Preview Modal States
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeCert, setActiveCert] = useState(null);

  const fetchDetails = async () => {
    try {
      // 1. Fetch event specs
      const evRes = await API.get('/events');
      if (evRes.data.success) {
        const ev = evRes.data.data.find(e => e._id === eventId);
        setEvent(ev);
      }

      // 2. Fetch certificate eligibility details
      const reportRes = await API.get(`/certificates/event/${eventId}`);
      if (reportRes.data.success) {
        setParticipants(reportRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load certificate dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [eventId]);

  const handleOverride = async (userId, customType = 'participant') => {
    setActionId(userId);
    try {
      toast.info('Applying override and compiling PDF...');
      const res = await API.post('/certificates/override', {
        eventId,
        userId,
        type: customType
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Credential generated successfully!');
        await fetchDetails();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Override generation failed.');
    } finally {
      setActionId('');
    }
  };

  const handleChangeType = async (userId, newType) => {
    setActionId(userId);
    try {
      toast.info(`Changing type to ${newType}...`);
      const res = await API.post('/certificates/override', {
        eventId,
        userId,
        type: newType
      });

      if (res.data.success) {
        toast.success(`Role type successfully updated to ${newType}!`);
        await fetchDetails();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to modify certificate type.');
    } finally {
      setActionId('');
    }
  };

  const handleGenerateBulk = async () => {
    setGenerating(true);
    try {
      toast.info('Executing high-fidelity PDF rendering queues...');
      const res = await API.post('/certificates/generate-bulk', {
        eventId,
        overrideThreshold
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Certificates successfully generated!');
        await fetchDetails();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Bulk generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    try {
      if (participants.length === 0) return;
      
      const headers = ['Name', 'Email', 'CheckInStatus', 'CheckInTime', 'Eligibility', 'CertificateId', 'Type'];
      const rows = participants.map(p => [
        p.name,
        p.email,
        p.attendanceStatus ? 'Checked In' : 'Absent',
        p.checkedInAt ? new Date(p.checkedInAt).toLocaleString() : 'N/A',
        p.eligibilityStatus,
        p.certificate?.certificateId || 'N/A',
        p.certificate?.type || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${event?.title.replace(/\s+/g, '_')}_Participant_Credentials.csv`;
      link.click();
      
      toast.success('Participant report CSV downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Export failed.');
    }
  };

  const handlePreviewCertificate = (p) => {
    if (!p.certificate) return;
    setActiveCert({
      participantName: p.name,
      eventName: event?.title,
      eventDate: new Date(event?.startDate).toLocaleDateString(),
      eventVenue: event?.venue,
      organizerName: event?.certificateSettings?.organizerSignatureName,
      organizerRole: event?.certificateSettings?.organizerSignatureRole,
      certificateId: p.certificate.certificateId,
      type: p.certificate.type,
      position: p.certificate.position
    });
    setPreviewOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!activeCert) return;
    try {
      toast.info('Downloading PDF certificate...');
      const response = await API.get(`/certificates/download/${activeCert.certificateId}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${event.title.replace(/\s+/g, '_')}_Certificate.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
      toast.error('Failed to download PDF.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full text-left">
        <Skeleton variant="card" />
        <Skeleton variant="table" />
      </div>
    );
  }

  // Calculate stats
  const totalRegistered = participants.length;
  const attendedCount = participants.filter(p => p.attendanceStatus).length;
  const eligibleCount = participants.filter(p => p.attendanceStatus || p.isManualOverride).length;
  const generatedCount = participants.filter(p => p.certificate).length;

  const attendanceRate = totalRegistered > 0 ? (attendedCount / totalRegistered) * 100 : 0;
  const threshold = event?.certificateSettings?.minAttendancePercent ?? 70;
  const isAboveThreshold = attendanceRate >= threshold;

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard/organizer')}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
              <FileBadge2 className="w-8 h-8 text-indigo-400" />
              Credentials Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure, override, and bulk generate authentic EventSphere PDF certificates for <strong>{event?.title}</strong>.
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <DownloadCloud className="w-4 h-4 mr-1.5" /> Export Report CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={generating}
            disabled={event?.status !== 'completed'}
            onClick={handleGenerateBulk}
            title={event?.status !== 'completed' ? 'Complete event first before generating certificates.' : ''}
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" /> Generate All Certificates
          </Button>
        </div>
      </div>

      {/* Warning if Event is NOT completed */}
      {event?.status !== 'completed' && (
        <div className="glass-panel p-4 border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center gap-3">
          <HelpCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <span>
            <strong>Attention:</strong> Event status is currently <strong>{event?.status}</strong>. Rule 1 enforces that certificate generation is locked until this event is marked <strong>completed</strong>.
          </span>
        </div>
      )}

      {/* A. STATS ROW (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered */}
        <div className="glass-panel p-5 flex items-center gap-4 bg-white/2">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-slate-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="caption uppercase font-bold text-[10px] tracking-wider text-slate-400 block">Total Registered</span>
            <span className="text-2xl font-black text-white">{totalRegistered}</span>
          </div>
        </div>

        {/* Checked In */}
        <div className="glass-panel p-5 flex items-center gap-4 bg-white/2">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="caption uppercase font-bold text-[10px] tracking-wider text-slate-400 block">QR Attended</span>
            <span className="text-2xl font-black text-white">{attendedCount}</span>
          </div>
        </div>

        {/* Eligible */}
        <div className="glass-panel p-5 flex items-center gap-4 bg-white/2">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <span className="caption uppercase font-bold text-[10px] tracking-wider text-slate-400 block">Eligible List</span>
            <span className="text-2xl font-black text-white">{eligibleCount}</span>
          </div>
        </div>

        {/* Generated */}
        <div className="glass-panel p-5 flex items-center gap-4 bg-white/2">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
            <FileBadge2 className="w-5 h-5" />
          </div>
          <div>
            <span className="caption uppercase font-bold text-[10px] tracking-wider text-slate-400 block">Certificates Issued</span>
            <span className="text-2xl font-black text-white">{generatedCount} / {eligibleCount}</span>
          </div>
        </div>
      </div>

      {/* B. ATTENDANCE THRESHOLD MONITOR BANNER */}
      <div className={`glass-panel p-6 border ${isAboveThreshold ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'} flex flex-col sm:flex-row items-center justify-between gap-6`}>
        <div className="flex-grow w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold flex items-center gap-1.5 text-slate-200">
              <Percent className={`w-4 h-4 ${isAboveThreshold ? 'text-emerald-400' : 'text-amber-400'}`} />
              Event Turnout Rate: <strong className="text-white">{Math.round(attendanceRate)}%</strong>
            </span>
            <span className="text-xs text-slate-400">
              Threshold Limit: {threshold}% &nbsp;
              {isAboveThreshold ? (
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15">MET</span>
              ) : (
                <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/15">BELOW</span>
              )}
            </span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full transition-all duration-500 ${isAboveThreshold ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, attendanceRate)}%` }}
            />
          </div>
        </div>

        {!isAboveThreshold && (
          <Button
            variant={overrideThreshold ? 'primary' : 'outline'}
            size="xs"
            onClick={() => {
              setOverrideThreshold(!overrideThreshold);
              toast.info(overrideThreshold ? 'Threshold checking re-enabled.' : 'Turnout override enabled. Bulk generation is unlocked!');
            }}
            className="flex-shrink-0"
          >
            <Settings className="w-3.5 h-3.5 mr-1" />
            {overrideThreshold ? 'Lock Turnout' : 'Override Turnout'}
          </Button>
        )}
      </div>

      {/* C. PARTICIPANT LIST & D. BULK ACTIONS TOOLBAR */}
      <div className="glass-panel p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-4 gap-4">
          <h3 className="text-base font-bold text-slate-200 uppercase">Participant Eligibility Registry</h3>
          
          {/* Filters */}
          <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
            {['all', 'eligible', 'noshow', 'generated'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`py-1.5 px-3 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterType === type
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
              >
                {type === 'all' && 'All'}
                {type === 'eligible' && 'Eligible'}
                {type === 'noshow' && 'No-shows'}
                {type === 'generated' && 'Generated'}
              </button>
            ))}
          </div>
        </div>

        <EligibilityTable
          participants={participants}
          onOverride={handleOverride}
          onChangeType={handleChangeType}
          onPreview={handlePreviewCertificate}
          loadingId={actionId}
          filterType={filterType}
        />
      </div>

      {/* Certificate Replica Preview Modal */}
      <CertificatePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        certificate={activeCert}
        onDownload={handleDownloadPDF}
      />

    </div>
  );
};
