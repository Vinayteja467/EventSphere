import React, { useState, useEffect } from 'react';
import { X, Download, Award, ShieldCheck, Sparkles, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { Button } from '../Button.jsx';
import { useToast } from '../../hooks/useToast.js';

export const CertificatePreviewModal = ({ isOpen, onClose, certificate, onDownload }) => {
  const toast = useToast();
  const [qrSrc, setQrSrc] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (certificate?.certificateId) {
      const verifyUrl = `${window.location.origin}/verify/${certificate.certificateId}`;
      QRCode.toDataURL(verifyUrl, {
        margin: 1,
        color: {
          dark: '#ffffff',
          light: '#0a0a0f'
        },
        width: 120
      })
        .then(url => setQrSrc(url))
        .catch(err => console.error('Failed to render client-side QR:', err));
    }
  }, [certificate]);

  if (!isOpen || !certificate) return null;

  const handleCopyLink = () => {
    const verifyUrl = `${window.location.origin}/verify/${certificate.certificateId}`;
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    toast.success('Verification link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const {
    participantName,
    eventName,
    eventDate,
    eventVenue,
    organizerName = 'EventSphere Organizer',
    organizerRole = 'Event Director',
    certificateId,
    type = 'participant',
    position = ''
  } = certificate;

  // Render Theme Configuration
  const themes = {
    participant: {
      accent: 'border-indigo-500 text-indigo-400',
      gradient: 'from-indigo-500 to-cyan-400',
      heading: 'Certificate of Participation',
      body: 'has successfully participated in and completed',
      glow: 'shadow-indigo-500/10'
    },
    volunteer: {
      accent: 'border-emerald-500 text-emerald-400',
      gradient: 'from-emerald-500 to-teal-400',
      heading: 'Certificate of Appreciation',
      body: 'in recognition of dedicated volunteer service at',
      glow: 'shadow-emerald-500/10'
    },
    winner: {
      accent: 'border-amber-500 text-amber-400',
      gradient: 'from-amber-500 to-yellow-400',
      heading: 'Certificate of Achievement',
      body: 'for outstanding performance at',
      glow: 'shadow-amber-500/10'
    },
    speaker: {
      accent: 'border-cyan-500 text-cyan-400',
      gradient: 'from-cyan-500 to-blue-400',
      heading: 'Certificate of Recognition',
      body: 'for delivering an insightful session at',
      glow: 'shadow-cyan-500/10'
    }
  };

  const activeTheme = themes[type.toLowerCase()] || themes.participant;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/40 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold text-slate-200">Credential Verification Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="ml-1.5 hidden sm:inline">Copy Link</span>
            </Button>
            <Button variant="primary" size="sm" onClick={onDownload}>
              <Download className="w-4 h-4" />
              <span className="ml-1.5 hidden sm:inline">Download PDF</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Area */}
        <div className="flex-grow p-6 sm:p-10 overflow-y-auto flex items-center justify-center bg-slate-950/20">
          
          {/* Certificate Frame */}
          <div className={`relative w-full max-w-3xl aspect-[1.414/1] bg-slate-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl ${activeTheme.glow} flex flex-col justify-between p-8 sm:p-12 text-center text-slate-200`}>
            
            {/* Top Accent Gradient Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${activeTheme.gradient}`} />

            {/* Glowing brackets design */}
            <div className={`absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 ${activeTheme.accent} opacity-40`} />
            <div className={`absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 ${activeTheme.accent} opacity-40`} />
            <div className={`absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 ${activeTheme.accent} opacity-40`} />
            <div className={`absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 ${activeTheme.accent} opacity-40`} />

            {/* Logo block */}
            <div className="flex justify-between items-start text-left">
              <div className="flex items-center gap-1">
                <Sparkles className={`w-4 h-4 text-cyan-400`} />
                <span className="text-xs font-bold text-white tracking-widest uppercase">EventSphere</span>
              </div>
              <span className="text-[9px] text-slate-600 font-mono tracking-wider">OFFICIAL BLOCKCHAIN CREDENTIAL</span>
            </div>

            {/* Main Header */}
            <div className="mt-4 sm:mt-8">
              <h2 className={`text-xs sm:text-sm font-black uppercase tracking-[0.2em] ${activeTheme.accent}`}>
                {activeTheme.heading}
              </h2>
              {type.toLowerCase() === 'winner' && position && (
                <div className="mt-2 text-md sm:text-lg font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-1 rounded-full w-fit mx-auto shadow-md">
                  🏆 WINNER — {position.toUpperCase()}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex flex-col gap-4 mt-6">
              <p className="text-xs sm:text-sm text-slate-400 italic">This is to certify that</p>
              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-wide border-b-2 border-white/10 pb-2 w-fit mx-auto px-6">
                  {participantName}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                {activeTheme.body}
              </p>
              <h3 className={`text-md sm:text-xl font-bold tracking-tight text-white mt-1`}>
                {eventName}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500">
                Held on: {eventDate} &nbsp;|&nbsp; Venue: {eventVenue}
              </p>
            </div>

            {/* Footer row */}
            <div className="flex justify-between items-end border-t border-white/5 pt-6 mt-6 sm:mt-10">
              {/* Signature block */}
              <div className="text-left flex flex-col gap-1 w-1/2">
                <div className="h-10 flex items-end">
                  <span className="font-mono text-cyan-300 italic text-md select-none">{organizerName}</span>
                </div>
                <div className="w-36 h-[1px] bg-slate-800" />
                <span className="text-[9px] text-slate-400 font-semibold">{organizerRole}</span>
              </div>

              {/* QR Block */}
              <div className="flex flex-col items-center gap-1 select-none">
                {qrSrc ? (
                  <img
                    src={qrSrc}
                    alt="QR Verification"
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 border border-white/10 p-1 rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-950 animate-pulse rounded-lg border border-white/10" />
                )}
                <span className="text-[8px] text-slate-500">Scan to Verify</span>
              </div>
            </div>

            {/* Bottom metadata */}
            <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
              <span className="text-[8px] text-slate-700 font-mono tracking-widest uppercase">
                Verification UUID: {certificateId}
              </span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
