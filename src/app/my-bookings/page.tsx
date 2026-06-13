'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, LogOut, Coffee, ArrowRight, AlertCircle,
  History, MessageSquare, X, Clock, ChevronRight,
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import StillHereModal from '@/components/modals/StillHereModal';
import StatusBadge from '@/components/ui/StatusBadge';
import { BookingsSkeleton } from '@/components/ui/LoadingSkeleton';
import { useDeskGuard } from '@/context/DeskGuardContext';
import { Booking, Desk } from '@/lib/types';
import { ZONE_DESCRIPTIONS } from '@/lib/seedData';
import {
  checkExpiry,
  checkAwayTimeout,
  checkStillHere,
  formatCountdown,
  formatMMSS,
} from '@/lib/timerHelpers';
import { toast } from 'sonner';

// ============================================================
// NOTE: In production, this logic runs server-side via a scheduled job
// (e.g., Supabase Edge Function / cron) every 1 minute.
//
// DEMO: Check every 10s, 2-min still-here threshold, 20-min away limit.
// PRODUCTION: 60s check, 2-hour still-here threshold, 20-min away limit.
//
// ─ ABOUT THE SESSION TIMER IN AWAY MODE ─────────────────────
// The session countdown INTENTIONALLY keeps ticking while you are away.
// Being away does NOT pause your booking — your slot still expires at the
// original time. The 20-minute away countdown is a SEPARATE grace period:
// if you exceed it without returning, the desk is released early. This
// prevents hoarding via the "I'm away" loophole.
// ============================================================

const CHECK_INTERVAL_MS = 10 * 1000;

// ── Report Issue Modal ──────────────────────────────────────
function ReportIssueModal({
  bookingId,
  deskNumber,
  onClose,
  onSubmit,
}: {
  bookingId: string;
  deskNumber: string;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const issues = [
    'Chair is broken / missing',
    'Power outlet not working',
    'WiFi signal is poor',
    'Monitor / screen issue',
    'Desk is dirty / unclean',
    'Other issue',
  ];

  const handleSubmit = async () => {
    if (!text.trim()) { toast.error('Please describe the issue.'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 500));
    onSubmit(text.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Report a Desk Issue</h2>
            <p className="text-xs text-slate-400 mt-0.5">Desk {deskNumber} · Your report helps keep the library clean</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Quick issue buttons */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Common Issues</p>
          <div className="flex flex-wrap gap-2">
            {issues.map((issue) => (
              <button
                key={issue}
                onClick={() => setText(issue)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  text === issue
                    ? 'border-[#1e3a8a] bg-blue-50 text-[#1e3a8a] font-semibold'
                    : 'border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {issue}
              </button>
            ))}
          </div>
        </div>

        {/* Text input */}
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5 uppercase tracking-wide">
            Describe the Issue
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="E.g. The chair leg is broken and wobbles..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 focus:border-[#1e3a8a] resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 font-medium">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold hover:bg-[#1e40af] disabled:opacity-60 transition-all"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function MyBookingsPage() {
  const { state, getActiveBooking, updateBooking, updateDeskStatus, freeDesk, recordIssue } = useDeskGuard();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [booking, setBooking] = useState<Booking | undefined>(undefined);
  const [desk, setDesk] = useState<Desk | undefined>(undefined);
  const [redirecting, setRedirecting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Sync booking from context
  useEffect(() => {
    if (!state.currentUser) return;
    const active = getActiveBooking(state.currentUser.id);
    setBooking(active);
    if (active) {
      setDesk(state.desks.find((d) => d.id === active.deskId));
    } else {
      setDesk(undefined);
    }
  }, [state, getActiveBooking]);

  // Loading delay
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // Live 1-second tick
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Timer checks (every CHECK_INTERVAL_MS)
  const doAutoRelease = useCallback(
    (b: Booking, reason: 'expired' | 'abandoned', msg: string) => {
      if (redirecting) return;
      updateBooking({ id: b.id, status: reason, endedAt: Date.now() });
      updateDeskStatus(b.deskId, 'available');
      toast.error(msg);
      setRedirecting(true);
      setTimeout(() => router.replace('/dashboard'), 2000);
    },
    [redirecting, updateBooking, updateDeskStatus, router],
  );

  useEffect(() => {
    if (!booking || redirecting) return;

    const check = () => {
      const t = Date.now();
      if (checkExpiry(booking, t)) {
        doAutoRelease(booking, 'expired', `Session ended — desk ${desk?.number ?? ''} freed`);
        return;
      }
      if (checkAwayTimeout(booking, t)) {
        doAutoRelease(booking, 'abandoned', `Desk ${desk?.number ?? ''} released — away too long`);
        return;
      }
      if (checkStillHere(booking, t)) {
        updateBooking({ id: booking.id, needsConfirmation: true });
      }
    };

    const interval = setInterval(check, CHECK_INTERVAL_MS);
    check();
    return () => clearInterval(interval);
  }, [booking, desk, redirecting, doAutoRelease, updateBooking]);

  // Actions
  const handleGoAway = () => {
    if (!booking) return;
    updateBooking({ id: booking.id, status: 'away', awayStartedAt: Date.now() });
    updateDeskStatus(booking.deskId, 'away');
    toast.info('Away mode activated. You have up to 20 min — your slot time still counts!');
  };

  const handleImBack = () => {
    if (!booking) return;
    const t = Date.now();
    // Accumulate away time
    const awayDuration = booking.awayStartedAt ? t - booking.awayStartedAt : 0;
    const newTotalAwayMs = (booking.totalAwayMs ?? 0) + awayDuration;
    updateBooking({
      id: booking.id,
      status: 'checked_in',
      awayStartedAt: null,
      lastConfirmedAt: t,
      totalAwayMs: newTotalAwayMs,
    });
    updateDeskStatus(booking.deskId, 'occupied');
    toast.success('Welcome back!');
  };

  const handleEndSession = () => {
    if (!booking) return;
    freeDesk(booking.id);
    toast.success('Session ended. Desk has been freed. Check your history!');
    setTimeout(() => router.replace('/history'), 600);
  };

  const handleStillHereConfirm = () => {
    if (!booking) return;
    updateBooking({ id: booking.id, lastConfirmedAt: Date.now(), needsConfirmation: false });
    toast.success("Confirmed! You're good to go.");
  };

  const handleStillHereAbandoned = useCallback(() => {
    if (!booking) return;
    doAutoRelease(booking, 'abandoned', `Desk ${desk?.number ?? ''} auto-released — no response`);
  }, [booking, desk, doAutoRelease]);

  const handleReportSubmit = (text: string) => {
    if (!booking) return;
    recordIssue(booking.id, text);
    setShowReportModal(false);
    toast.success('Issue reported. Thank you!', {
      description: 'Library staff will review your report.',
    });
  };

  if (loading) return (
    <AuthGuard requireRole="student">
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <BookingsSkeleton />
        </div>
      </div>
    </AuthGuard>
  );

  const sessionRemaining = booking ? booking.expiresAt - now : 0;
  const awayRemaining = booking?.awayStartedAt ? (booking.awayStartedAt + 20 * 60 * 1000) - now : 0;
  const awayPct = booking?.awayStartedAt ? Math.max(0, (awayRemaining / (20 * 60 * 1000)) * 100) : 100;

  const startTimeStr = booking
    ? new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const endTimeStr = booking
    ? new Date(booking.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <AuthGuard requireRole="student">
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-xl mx-auto space-y-4">

              {/* Header row */}
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">My Session</h1>
                <button
                  onClick={() => router.push('/history')}
                  className="flex items-center gap-1.5 text-sm text-[#1e3a8a] font-semibold hover:underline"
                >
                  <History size={15} />
                  View History
                </button>
              </div>

              {!booking ? (
                /* Empty state */
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                    <CalendarDays size={28} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-700">No active session</p>
                    <p className="text-sm text-slate-400 mt-1">Book a desk from the floor map</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold hover:bg-[#1e40af] transition-all shadow-md"
                    >
                      Book a Desk <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => router.push('/history')}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
                    >
                      <History size={15} />
                      History
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Active session card */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-2xl font-bold text-slate-800">Desk {desk?.number ?? booking.deskId}</h2>
                          <StatusBadge status={booking.status as 'checked_in' | 'away'} />
                        </div>
                        <p className="text-xs text-slate-400">
                          {desk?.zone} · Booked {startTimeStr} → {endTimeStr} ({booking.durationHours}h slot)
                        </p>
                      </div>
                    </div>

                    {/* ── SESSION COUNTDOWN ── */}
                    <div className={`rounded-2xl p-5 text-center space-y-1.5 ${
                      booking.status === 'away' ? 'bg-[#fef3c7]' : 'bg-slate-50'
                    }`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {booking.status === 'away' ? 'Slot Time Remaining (still counting)' : 'Session Active'}
                      </p>
                      <div className="flex items-baseline justify-center gap-1">
                        {sessionRemaining > 0 ? (
                          <span className={`text-5xl font-bold tracking-tight font-mono ${
                            booking.status === 'away' ? 'text-[#f59e0b]' :
                            sessionRemaining < 5 * 60 * 1000 ? 'text-[#dc2626]' : 'text-[#1e3a8a]'
                          }`}>
                            {formatCountdown(sessionRemaining)}
                          </span>
                        ) : (
                          <span className="text-2xl font-bold text-red-500">Expired</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">Slot ends at {endTimeStr}</p>

                      {/* ⚠️ Away explanation */}
                      {booking.status === 'away' && (
                        <div className="mt-2 bg-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700 text-left flex gap-2">
                          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>Your slot time keeps counting while away.</strong> This prevents seat hoarding.
                            Return within 20 min or your desk will be released.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ── AWAY COUNTDOWN (only when away) ── */}
                    {booking.status === 'away' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wide flex items-center gap-1.5">
                            <Coffee size={13} />
                            Away Grace Period
                          </span>
                          <span className="text-sm font-mono font-bold text-[#f59e0b]">
                            {awayRemaining > 0 ? formatMMSS(awayRemaining) : '00:00'}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#f59e0b] rounded-full transition-all duration-1000"
                            style={{ width: `${awayPct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Return within this time or your desk will be auto-released
                        </p>

                        <button
                          onClick={handleImBack}
                          className="w-full py-3 rounded-xl bg-[#10b981] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-md shadow-emerald-100"
                        >
                          <Coffee size={16} />
                          I&apos;m Back!
                        </button>
                      </div>
                    )}

                    {/* Needs confirmation warning */}
                    {booking.needsConfirmation && (
                      <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>Presence check — confirm you&apos;re still here!</span>
                      </div>
                    )}

                    {/* Away button (only when checked in) */}
                    {booking.status === 'checked_in' && (
                      <button
                        onClick={handleGoAway}
                        className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold flex items-center justify-center gap-2 hover:border-[#f59e0b] hover:text-[#f59e0b] hover:bg-[#fef3c7] transition-all"
                      >
                        <Coffee size={17} />
                        I&apos;m Away
                        <span className="text-slate-400 font-normal text-xs">(max 20 min · slot keeps counting)</span>
                      </button>
                    )}

                    {/* End session */}
                    <button
                      onClick={handleEndSession}
                      className="w-full py-3 rounded-xl bg-[#dc2626] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-700 active:scale-[0.98] transition-all shadow-md shadow-red-100"
                    >
                      <LogOut size={17} />
                      End Session Early
                    </button>

                    {/* Report issue */}
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-400 hover:text-[#1e3a8a] hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <MessageSquare size={13} />
                      Report an issue with this desk
                    </button>
                  </div>

                  {/* Desk info card */}
                  {desk && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Desk Details</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] text-slate-400 font-medium">Zone</p>
                          <p className="text-sm font-bold text-slate-700 mt-0.5">{desk.zone}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <p className="text-[10px] text-slate-400 font-medium">Duration</p>
                          <p className="text-sm font-bold text-slate-700 mt-0.5">{booking.durationHours}h booked</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                          <p className="text-[10px] text-slate-400 font-medium">Amenities</p>
                          <div className="flex gap-2 flex-wrap mt-1">
                            {desk.amenities.map(a => (
                              <span key={a} className="text-xs px-2 py-0.5 bg-blue-50 text-[#1e3a8a] rounded-lg font-medium">{a}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick nav to history */}
                  <button
                    onClick={() => router.push('/history')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-sm"
                  >
                    <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <History size={16} className="text-[#1e3a8a]" />
                      </div>
                      View past bookings & history
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Modals */}
        {booking?.needsConfirmation && (
          <StillHereModal
            booking={booking}
            deskNumber={desk?.number ?? booking.deskId}
            onConfirm={handleStillHereConfirm}
            onAbandoned={handleStillHereAbandoned}
          />
        )}

        {showReportModal && booking && (
          <ReportIssueModal
            bookingId={booking.id}
            deskNumber={desk?.number ?? booking.deskId}
            onClose={() => setShowReportModal(false)}
            onSubmit={handleReportSubmit}
          />
        )}
      </div>
    </AuthGuard>
  );
}
