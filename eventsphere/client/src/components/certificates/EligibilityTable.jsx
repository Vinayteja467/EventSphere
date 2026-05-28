import React from 'react';
import { Eye, ShieldAlert, Award, RefreshCw, CheckCircle, HelpCircle } from 'lucide-react';
import { Button } from '../Button.jsx';
import { formatSimpleDate } from '../../utils/formatDate.js';

export const EligibilityTable = ({
  participants,
  onOverride,
  onChangeType,
  onPreview,
  loadingId,
  filterType
}) => {
  
  // Filter participants client-side
  const filtered = participants.filter(p => {
    if (filterType === 'all') return true;
    if (filterType === 'eligible') return p.attendanceStatus === true || p.isManualOverride === true;
    if (filterType === 'noshow') return p.attendanceStatus === false && p.isManualOverride === false;
    if (filterType === 'generated') return !!p.certificate;
    return true;
  });

  const getStatusBadge = (p) => {
    if (p.certificate && (p.certificate.type === 'winner' || p.certificate.type === 'volunteer' || p.certificate.type === 'speaker')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/15 uppercase">
          Special ({p.certificate.type})
        </span>
      );
    }
    if (p.isManualOverride) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/15 uppercase">
          Override
        </span>
      );
    }
    if (p.attendanceStatus) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 uppercase">
          Eligible
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/5 uppercase">
        No-show
      </span>
    );
  };

  return (
    <div className="overflow-x-auto w-full bg-slate-950/20 rounded-xl border border-white/5">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-white/2">
            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Participant Name</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Check-in Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Check-in Time</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Eligibility</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cert Type</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-xs">
                No matching participants found.
              </td>
            </tr>
          ) : (
            filtered.map((p) => {
              const hasCert = !!p.certificate;
              const currentType = p.certificate?.type || (p.role === 'volunteer' ? 'volunteer' : 'participant');
              
              return (
                <tr key={p.userId} className="hover:bg-white/2 transition-colors">
                  {/* Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(p.name)}`}
                        alt={p.name}
                        className="w-8 h-8 rounded-full border border-indigo-500/20"
                      />
                      <div>
                        <span className="font-semibold text-slate-200 block text-xs">{p.name}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">{p.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Checked In status */}
                  <td className="px-6 py-4 text-xs">
                    {p.attendanceStatus ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Checked In
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-600" /> Absent
                      </span>
                    )}
                  </td>

                  {/* Checked In Time */}
                  <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                    {p.checkedInAt ? formatSimpleDate(p.checkedInAt) : '—'}
                  </td>

                  {/* Eligibility Status */}
                  <td className="px-6 py-4 text-xs">
                    {getStatusBadge(p)}
                  </td>

                  {/* Type dropdown selection */}
                  <td className="px-6 py-4">
                    <select
                      value={currentType}
                      disabled={loadingId === p.userId}
                      onChange={(e) => onChangeType(p.userId, e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="participant">Participant</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="winner">Winner</option>
                      <option value="speaker">Speaker</option>
                    </select>
                  </td>

                  {/* Actions column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* Preview Button */}
                      <Button
                        variant="outline"
                        size="xs"
                        disabled={!hasCert}
                        onClick={() => onPreview(p)}
                        title={hasCert ? 'Preview Certificate' : 'Certificate not generated yet'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>

                      {/* Override Trigger */}
                      {(!p.attendanceStatus && !p.isManualOverride) ? (
                        <Button
                          variant="outline"
                          size="xs"
                          loading={loadingId === p.userId}
                          onClick={() => onOverride(p.userId)}
                          className="hover:border-amber-500/30 hover:bg-amber-500/5 text-amber-400"
                          title="Grant Manual Override"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span className="ml-1 text-[10px]">Override</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          loading={loadingId === p.userId}
                          onClick={() => onOverride(p.userId, currentType)}
                          title="Regenerate Certificate"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span className="ml-1 text-[10px]">Regen</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
