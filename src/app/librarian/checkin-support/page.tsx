'use client';

import { useState, useCallback } from 'react';
import { Search, CheckCircle, XCircle, QrCode, User, Clock, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useDeskGuard } from '@/context/DeskGuardContext';
import { Booking, Desk as DeskType } from '@/lib/types';
import { ZONE_DESCRIPTIONS } from '@/lib/seedData';
import { formatMMSS } from '@/lib/timerHelpers';
import { toast } from 'sonner';

// ── Check-In Support Page ─────────────────────────────────
// Lets librarian staff manually look up a student's booking by
// desk number or booking code, verify their identity, and
// manually activate (check in) a session on their behalf.
// ─────────────────────────────────────────────────────────

export default function CheckInSupportPage() {
  const { state, updateBooking, updateDeskStatus, resetDesk } = useDeskGuard();

  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ booking: Booking; desk: DeskType } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [processing, setProcessing] = useState(false);

  const now = Date.now();

  // Search: by desk number OR booking id
  const handleSearch = useCallback(() => {
    setNotFound(false);
    setResult(null);

    const q = query.trim().toLowerCase();
    if (!q) { toast.error('Enter a desk number or booking code.'); return; }

    // Match by booking id prefix
    let booking = state.bookings.find(b =>
      b.id.toLowerCase().startsWith(q) ||
      b.id.toLowerCase() === q
    );

    // Match by desk number
    if (!booking) {
      const desk = state.desks.find(d => d.number.toLowerCase() === q);
      if (desk) {
        booking = state.bookings.find(b =>
          b.deskId === desk.id &&
          ['booked', 'checked_in', 'away'].includes(b.status)
        );
      }
    }

    if (!booking) {
      setNotFound(true);
      return;
    }

    const desk = state.desks.find(d => d.id === booking!.deskId);
    if (!desk) { setNotFound(true); return; }

    setResult({ booking, desk });
  }, [query, state.bookings, state.desks]);

  const handleManualCheckIn = async () => {
    if (!result) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 400));
    updateBooking({ id: result.booking.id, status: 'checked_in', lastConfirmedAt: Date.now() });
    updateDeskStatus(result.booking.deskId, 'occupied');
    toast.success(`✅ Desk ${result.desk.number} manually checked in by staff`);
    setProcessing(false);
    setResult(null);
    setQuery('');
  };

  const handleForceRelease = async () => {
    if (!result) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 400));
    resetDesk(result.booking.id);
    toast.success(`Desk ${result.desk.number} released and made available`);
    setProcessing(false);
    setResult(null);
    setQuery('');
  };

  const getUser = (userId: string) => state.users.find(u => u.id === userId);

  // All currently booked/checked-in sessions for context
  const activeSessions = state.bookings
    .filter(b => ['booked', 'checked_in', 'away'].includes(b.status))
    .sort((a, b) => a.startTime - b.startTime);

  return (
    <AuthGuard requireRole="librarian">
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 space-y-6">

              {/* ── Header ── */}
              <div className="bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <QrCode size={24} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black">Check-In Support</h1>
                    <p className="text-blue-200 text-sm mt-1 max-w-md leading-relaxed">
                      Look up a student&apos;s booking by desk number or booking code.
                      You can manually activate their check-in or release the desk.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Search Box ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                    Search by Desk Number or Booking Code
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="e.g. A-01  or  booking-xxxxx"
                        className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 focus:border-[#1e3a8a] transition-all"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      className="h-12 px-6 rounded-xl bg-[#1e3a8a] text-white text-sm font-bold hover:bg-[#1e40af] transition-all shadow-md shadow-blue-100"
                    >
                      Look Up
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Enter desk number (e.g. <code className="bg-slate-100 px-1 rounded">A-01</code>, <code className="bg-slate-100 px-1 rounded">S-05</code>) or the booking code shown in the student&apos;s app.
                  </p>
                </div>

                {/* Not found */}
                {notFound && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
                    <XCircle size={18} className="text-[#dc2626] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-[#dc2626]">No active booking found</p>
                      <p className="text-xs text-red-400 mt-0.5">
                        The desk may be available or the booking code may be incorrect. Check the active sessions list below.
                      </p>
                    </div>
                  </div>
                )}

                {/* Result */}
                {result && (() => {
                  const user = getUser(result.booking.userId);
                  const remaining = Math.max(0, result.booking.expiresAt - now);
                  const startStr = new Date(result.booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const endStr = new Date(result.booking.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  const statusColor = result.booking.status === 'checked_in' ? 'text-[#10b981]' :
                    result.booking.status === 'away' ? 'text-[#f59e0b]' :
                    result.booking.status === 'booked' ? 'text-[#1e3a8a]' : 'text-slate-500';

                  return (
                    <div className="border-2 border-[#1e3a8a]/20 rounded-2xl overflow-hidden bg-blue-50/30">
                      {/* Result header */}
                      <div className="bg-white px-5 py-4 border-b border-[#1e3a8a]/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-[#10b981]" />
                            <p className="text-xs font-bold text-[#10b981] uppercase tracking-wide">Booking Found</p>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-white border ${statusColor} border-current`}>
                            {result.booking.status.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-4">
                        {/* Desk info */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-xl p-3 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                              <MapPin size={10} /> Desk
                            </p>
                            <p className="text-lg font-black text-slate-800">{result.desk.number}</p>
                            <p className="text-xs text-slate-400">{result.desk.zone}</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                              <Clock size={10} /> Session
                            </p>
                            <p className="text-sm font-bold text-slate-800">{startStr} → {endStr}</p>
                            <p className={`text-xs font-mono font-bold mt-0.5 ${remaining < 10 * 60 * 1000 ? 'text-[#dc2626]' : 'text-[#1e3a8a]'}`}>
                              {formatMMSS(remaining)} remaining
                            </p>
                          </div>
                        </div>

                        {/* Student info */}
                        <div className="bg-white rounded-xl p-4 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                            <User size={10} /> Student
                          </p>
                          <p className="text-base font-bold text-slate-800">{user?.name ?? 'Unknown'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Booking: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">{result.booking.id}</code>
                          </p>
                        </div>

                        {/* Zone description */}
                        <div className="bg-white rounded-xl p-3 border border-slate-100">
                          <p className="text-xs text-slate-500 leading-relaxed">
                            <span className="font-semibold text-slate-700">{result.desk.zone}: </span>
                            {ZONE_DESCRIPTIONS[result.desk.zone]}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          {result.booking.status === 'booked' && (
                            <button
                              onClick={handleManualCheckIn}
                              disabled={processing}
                              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#10b981] text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-60 transition-all shadow-md shadow-emerald-100"
                            >
                              {processing ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircle size={16} />
                              )}
                              Manual Check-In
                            </button>
                          )}
                          {result.booking.status === 'checked_in' && (
                            <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#d1fae5] text-[#10b981] text-sm font-bold">
                              <CheckCircle size={16} />
                              Already Checked In
                            </div>
                          )}
                          {result.booking.status === 'away' && (
                            <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#fef3c7] text-[#f59e0b] text-sm font-bold">
                              <AlertTriangle size={16} />
                              Student is Away
                            </div>
                          )}
                          <button
                            onClick={handleForceRelease}
                            disabled={processing}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#dc2626] text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60 transition-all"
                          >
                            <RefreshCw size={15} />
                            Release
                          </button>
                        </div>

                        <p className="text-[10px] text-slate-400 text-center">
                          Manual Check-In is only available for bookings in <strong>Booked</strong> status.
                          Use Release to free the desk for other students.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── Active Sessions List (for quick lookup) ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-800">All Active Bookings</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Click a row to populate the search field</p>
                </div>

                {activeSessions.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 space-y-2">
                    <CheckCircle size={28} className="mx-auto text-slate-200" />
                    <p className="text-sm font-medium">No active sessions right now</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                    {activeSessions.map(booking => {
                      const desk = state.desks.find(d => d.id === booking.deskId);
                      const user = getUser(booking.userId);
                      const remaining = Math.max(0, booking.expiresAt - now);
                      if (!desk) return null;
                      return (
                        <button
                          key={booking.id}
                          onClick={() => { setQuery(desk.number); setResult(null); setNotFound(false); }}
                          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left group"
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            booking.status === 'away' ? 'bg-[#f59e0b] animate-pulse' :
                            booking.status === 'booked' ? 'bg-[#1e3a8a]' : 'bg-[#10b981] animate-pulse'
                          }`} />
                          <div className="w-16 flex-shrink-0">
                            <p className="text-xs font-bold text-slate-800">{desk.number}</p>
                            <p className="text-[9px] text-slate-400">{desk.zone.replace('Zone ', 'Z')}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">{user?.name}</p>
                            <p className="text-[9px] text-slate-400 truncate">{user?.email}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            booking.status === 'away' ? 'bg-[#fef3c7] text-[#f59e0b]' :
                            booking.status === 'booked' ? 'bg-blue-50 text-[#1e3a8a]' :
                            'bg-[#d1fae5] text-[#10b981]'
                          }`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 flex-shrink-0">
                            {formatMMSS(remaining)}
                          </span>
                          <span className="text-[9px] text-slate-300 group-hover:text-[#1e3a8a] transition-colors flex-shrink-0">
                            Select →
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
