'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, CheckCircle, XCircle, AlertTriangle, Coffee,
  ArrowRight, History, MapPin, Timer, TrendingUp,
  CalendarDays, Trash2,
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useDeskGuard } from '@/context/DeskGuardContext';
import { Booking, BookingStatus } from '@/lib/types';
import { toast } from 'sonner';

// ── Helpers ─────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms <= 0) return '—';
  const totalMins = Math.floor(ms / 60000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Status config ────────────────────────────────────────────
const STATUS_CONFIG: Record<BookingStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  ended:      { label: 'Completed',  icon: CheckCircle,    color: 'text-[#10b981]', bg: 'bg-[#d1fae5]' },
  expired:    { label: 'Expired',    icon: Clock,          color: 'text-amber-600', bg: 'bg-amber-50'   },
  abandoned:  { label: 'Abandoned',  icon: AlertTriangle,  color: 'text-[#dc2626]', bg: 'bg-[#fee2e2]'  },
  checked_in: { label: 'Active',     icon: Timer,          color: 'text-[#1e3a8a]', bg: 'bg-blue-50'    },
  away:       { label: 'Away',       icon: Coffee,         color: 'text-[#f59e0b]', bg: 'bg-[#fef3c7]'  },
  booked:     { label: 'Booked',     icon: CalendarDays,   color: 'text-slate-500', bg: 'bg-slate-100'  },
};

// ── Booking Row ──────────────────────────────────────────────
function BookingRow({ booking, deskNumber, zone }: {
  booking: Booking;
  deskNumber: string;
  zone: string;
}) {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.booked;
  const Icon = cfg.icon;

  const actualDurationMs = booking.endedAt
    ? booking.endedAt - booking.startTime
    : Date.now() - booking.startTime;

  const activeDurationMs = actualDurationMs - (booking.totalAwayMs ?? 0);
  const awayDurationMs = booking.totalAwayMs ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Row header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={18} className={cfg.color} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Desk {deskNumber}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin size={10} />
              {zone} · {formatDate(booking.startTime)}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-400">{formatTime(booking.startTime)}</p>
          <p className="text-xs text-slate-400">→ {booking.endedAt ? formatTime(booking.endedAt) : '—'}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Booked Slot</p>
          <p className="text-sm font-bold text-slate-700 mt-1">{booking.durationHours}h</p>
        </div>
        <div className="bg-[#d1fae5]/60 rounded-xl p-3 text-center">
          <p className="text-[10px] text-[#10b981] font-medium uppercase tracking-wide">Active Time</p>
          <p className="text-sm font-bold text-[#10b981] mt-1">{formatDuration(activeDurationMs)}</p>
        </div>
        <div className={`rounded-xl p-3 text-center ${awayDurationMs > 0 ? 'bg-[#fef3c7]/60' : 'bg-slate-50'}`}>
          <p className={`text-[10px] font-medium uppercase tracking-wide ${awayDurationMs > 0 ? 'text-[#f59e0b]' : 'text-slate-400'}`}>
            Away Time
          </p>
          <p className={`text-sm font-bold mt-1 ${awayDurationMs > 0 ? 'text-[#f59e0b]' : 'text-slate-400'}`}>
            {awayDurationMs > 0 ? formatDuration(awayDurationMs) : '—'}
          </p>
        </div>
      </div>

      {/* Issue report (if any) */}
      {booking.issueReport && (
        <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <AlertTriangle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">
            <span className="font-semibold">Reported: </span>{booking.issueReport}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function HistoryPage() {
  const { state, getUserBookings } = useDeskGuard();
  const router = useRouter();

  const bookings = useMemo(() => {
    if (!state.currentUser) return [];
    return getUserBookings(state.currentUser.id);
  }, [state.currentUser, getUserBookings]);

  // Stats across all bookings
  const stats = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'ended');
    const totalActiveMs = completed.reduce((sum, b) => {
      const actualMs = b.endedAt ? b.endedAt - b.startTime : 0;
      return sum + actualMs - (b.totalAwayMs ?? 0);
    }, 0);
    const totalAwayMs = completed.reduce((sum, b) => sum + (b.totalAwayMs ?? 0), 0);
    const abandonedCount = bookings.filter(b => b.status === 'abandoned').length;
    return {
      total: bookings.length,
      completed: completed.length,
      abandoned: abandonedCount,
      totalActiveMs,
      totalAwayMs,
    };
  }, [bookings]);

  const getDesk = (deskId: string) => state.desks.find(d => d.id === deskId);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    bookings.forEach(b => {
      const label = formatDate(b.startTime);
      if (!groups[label]) groups[label] = [];
      groups[label].push(b);
    });
    return groups;
  }, [bookings]);

  const dateKeys = Object.keys(grouped);

  return (
    <AuthGuard requireRole="student">
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-2xl mx-auto space-y-6">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Booking History</h1>
                  <p className="text-sm text-slate-400 mt-0.5">All your past desk sessions</p>
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold hover:bg-[#1e40af] transition-all shadow-md"
                >
                  Book a Desk <ArrowRight size={15} />
                </button>
              </div>

              {/* Stats strip */}
              {bookings.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                      <History size={16} className="text-[#1e3a8a]" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Total Sessions</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                    <div className="w-8 h-8 rounded-xl bg-[#d1fae5] flex items-center justify-center mx-auto mb-2">
                      <TrendingUp size={16} className="text-[#10b981]" />
                    </div>
                    <p className="text-2xl font-bold text-[#10b981]">{formatDuration(stats.totalActiveMs)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Total Study Time</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                    <div className="w-8 h-8 rounded-xl bg-[#fef3c7] flex items-center justify-center mx-auto mb-2">
                      <Coffee size={16} className="text-[#f59e0b]" />
                    </div>
                    <p className="text-2xl font-bold text-[#f59e0b]">{formatDuration(stats.totalAwayMs)}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Total Away Time</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${stats.abandoned > 0 ? 'bg-[#fee2e2]' : 'bg-slate-100'}`}>
                      <XCircle size={16} className={stats.abandoned > 0 ? 'text-[#dc2626]' : 'text-slate-400'} />
                    </div>
                    <p className={`text-2xl font-bold ${stats.abandoned > 0 ? 'text-[#dc2626]' : 'text-slate-800'}`}>
                      {stats.abandoned}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Abandoned</p>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {bookings.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                    <CalendarDays size={28} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-700">No booking history yet</p>
                    <p className="text-sm text-slate-400 mt-1">Your sessions will appear here after you complete them</p>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold hover:bg-[#1e40af] transition-all shadow-md"
                  >
                    Book Your First Desk <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Grouped list */}
              {dateKeys.map(dateKey => (
                <div key={dateKey} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      {dateKey}
                    </p>
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-xs text-slate-400">{grouped[dateKey].length} session{grouped[dateKey].length > 1 ? 's' : ''}</span>
                  </div>
                  {grouped[dateKey].map(b => {
                    const d = getDesk(b.deskId);
                    return (
                      <BookingRow
                        key={b.id}
                        booking={b}
                        deskNumber={d?.number ?? b.deskId}
                        zone={d?.zone ?? 'Unknown'}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Bottom nudge */}
              {bookings.length > 0 && (
                <p className="text-center text-xs text-slate-400 pb-4">
                  Showing all {bookings.length} sessions · Data stored locally in your browser
                </p>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
