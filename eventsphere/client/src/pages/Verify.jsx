import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Award, Calendar, User, Sparkles, Building, Bookmark, MapPin } from 'lucide-react';
import { Skeleton } from '../components/Skeleton.jsx';
import API from '../api/api.js';

export const Verify = () => {
  const { certificateId } = useParams();
  const [loading, setLoading] = useState(true);
  const [verifiedData, setVerifiedData] = useState(null);

  useEffect(() => {
    if (certificateId) {
      setLoading(true);
      // Public verification GET (No credentials/login required)
      API.get(`/certificates/verify/${certificateId}`)
        .then(res => {
          if (res.data.success) {
            setVerifiedData(res.data.data);
          }
        })
        .catch(err => {
          console.error(err);
          setVerifiedData({ valid: false });
        })
        .finally(() => setLoading(false));
    }
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/5 p-8 rounded-2xl flex flex-col gap-4">
          <Skeleton variant="avatar" className="mx-auto" />
          <Skeleton variant="card" />
        </div>
      </div>
    );
  }

  const isValid = verifiedData?.valid === true;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-white/8 p-8 rounded-2xl shadow-2xl z-10 flex flex-col gap-6 text-center">
        
        {/* Verification Icon Status Indicator */}
        {isValid ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/5 animate-pulse">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase text-white tracking-widest">Certificate Verified</h1>
              <span className="inline-block px-2.5 py-0.5 mt-1.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-mono uppercase">
                AUTHENTIC CREDENTIAL
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/5">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase text-white tracking-widest">Invalid Credential</h1>
              <span className="inline-block px-2.5 py-0.5 mt-1.5 text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-mono uppercase">
                UNVERIFIED OR VOID
              </span>
            </div>
          </div>
        )}

        {/* Validation Details Card */}
        {isValid ? (
          <div className="flex flex-col gap-4 text-left border-t border-white/5 pt-5">
            <div className="flex flex-col gap-3.5 bg-slate-950/30 border border-white/5 p-4 rounded-xl">
              
              {/* Recipient */}
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Participant Name</span>
                  <span className="text-sm font-semibold text-slate-200">{verifiedData.participantName}</span>
                </div>
              </div>

              {/* Event Name */}
              <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                <Building className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Event Completed</span>
                  <span className="text-sm font-semibold text-slate-200">{verifiedData.eventName}</span>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                <Calendar className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Event Date</span>
                  <span className="text-sm font-semibold text-slate-200">{verifiedData.eventDate}</span>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                <MapPin className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Event Venue</span>
                  <span className="text-sm font-semibold text-slate-200">{verifiedData.eventVenue}</span>
                </div>
              </div>

              {/* Type */}
              <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                <Bookmark className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Credential Category</span>
                  <span className="text-sm font-semibold text-slate-200 capitalize">
                    {verifiedData.type} {verifiedData.position ? `— ${verifiedData.position}` : ''}
                  </span>
                </div>
              </div>

              {/* Issued By */}
              <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                <ShieldCheck className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Authorized By</span>
                  <span className="text-sm font-semibold text-slate-200">{verifiedData.issuedBy}</span>
                </div>
              </div>
            </div>

            {/* Credential Watermark */}
            <div className="text-center font-mono text-[9px] text-slate-600 bg-white/1 p-2 rounded border border-white/5 truncate">
              HASH_ID: {verifiedData.certificateId}
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-xs py-6">
            We could not locate this credential in the cryptographically verified EventSphere database registry. It might be invalid, altered, or revoked.
          </div>
        )}

        {/* Branded Footer */}
        <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-6 select-none">
          <Link to="/" className="flex items-center gap-2 hover:scale-105 transition-transform">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">EventSphere Platform</span>
          </Link>
          <span className="text-[9px] text-slate-600">EventSphere Digital Credentials Registry System.</span>
        </div>

      </div>
    </div>
  );
};
