import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Copy, Check, Eye, Calendar, MapPin } from 'lucide-react';
import { Button } from '../Button.jsx';
import { useToast } from '../../hooks/useToast.js';
import { formatSimpleDate } from '../../utils/formatDate.js';
import { PremiumCard } from '../common/PremiumCard.jsx';

export const CertificateCard = ({ certificate, onPreview, onDownload, downloading }) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const verifyUrl = `${window.location.origin}/verify/${certificate.certificateId}`;
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    toast.success('Verification link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const evt = certificate.eventId;
  if (!evt) return null;

  // Type-specific details mapping
  const badgeConfig = {
    participant: { text: 'Participant', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', glow: 'organizer' },
    volunteer: { text: 'Volunteer', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', glow: 'volunteer' },
    winner: { text: 'Winner', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', glow: 'sponsor' },
    speaker: { text: 'Speaker', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', glow: 'ai' }
  };

  const badge = badgeConfig[certificate.type.toLowerCase()] || badgeConfig.participant;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full text-left"
    >
      <PremiumCard
        glow={badge.glow}
        className="glass-panel p-6 flex flex-col justify-between hover:border-indigo-500/20 transition-all duration-300 relative overflow-hidden group select-none h-full"
      >
        {/* Glow effect background */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-indigo-500/5 transition-all pointer-events-none" />

        <div>
          {/* Header block */}
          <div className="flex items-start gap-4">
            <div className={`p-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl flex-shrink-0 group-hover:text-indigo-400 transition-colors`}>
              <Award className="w-6 h-6 animate-pulse text-indigo-400" />
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-block px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border ${badge.color}`}>
                  {badge.text}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Issued: {formatSimpleDate(certificate.issuedAt)}</span>
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-2 line-clamp-1 group-hover:text-white transition-colors">
                {evt.title}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5 capitalize">Category: {evt.category}</p>
            </div>
          </div>

          {/* Specs */}
          <div className="mt-5 grid grid-cols-2 gap-3 text-[11px] text-slate-400 border-t border-white/5 pt-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="truncate">Event Date: {formatSimpleDate(evt.startDate)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="truncate">{evt.venue}</span>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2 items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="xs"
              onClick={handleCopyLink}
              className="flex-grow sm:flex-grow-0"
              title="Copy public verification link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="ml-1 text-[11px]">Copy Link</span>
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={onPreview}
              className="flex-grow sm:flex-grow-0"
              title="Preview certificate replica"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="ml-1 text-[11px]">Preview</span>
            </Button>
          </div>

          <Button
            variant="primary"
            size="sm"
            loading={downloading}
            onClick={onDownload}
            className="w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-1.5" /> Download PDF
          </Button>
        </div>
      </PremiumCard>
    </motion.div>
  );
};
