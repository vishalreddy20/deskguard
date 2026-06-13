'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Activity, Coffee, Clock, User, MapPin,
  RefreshCw, Search, ChevronDown, CheckCircle,
  AlertTriangle, Filter,
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useDeskGuard } from '@/context/DeskGuardContext';
import { Booking, Desk } from '@/lib/types';
import { formatMMSS } from '@/lib/timerHelpers';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'checked_in' | 'away' | 'booked';
type SortKey = 'expiry' | 'desk' | 'student';

function getStatusColor(status: string) {
  if (status === 'away') return { dot: 'bg-[#f59e0b] animate-pulse', badge: 'bg-[#fef3c7] text-[#f59e0b]', row: 'bg-amber-50/40' };
  if (status === 'checked_in') return { dot: 'bg-[#10b981] animate-pulse', badge: 'bg-[#d1fae5] text-[#10b981]', row: '' };
  return { dot: 'bg-[#1e3a8a]', badge: 'bg-blue-50 text-[#1e3a8a]', row: '' };
}

export default function LiveSessionsPage() {
  const { state, resetDesk } = useDeskGuard();
  const [now, setNow] = useState(Date.now());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('expiry');

  // Live 1-second clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const getDesk = (id: string) => state.desks.find(d => d.id === id);
  const getUser = (id: string) => state.users.find(u => u.id === id);

  const sessions = useMemo(() => {
    let list = state.bookings.filter(b =>
      ['checked_in', 'away', 'booked'].includes(b.status)
    );

    if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => {
        const desk = getDesk(b.deskId);
        const user = getUser(b.userId);
        return (
          desk?.number.toLowerCase().includes(q) ||
          desk?.zone.toLowerCase().includes(q) ||
          user?.name.toLowerCase().includes(q) ||
          user?.email.toLowerCase().includes(q)
        );
      });
    }

    list.sort((a, b) => {
      if (sortKey === 'expiry') return a.expiresAt - b.expiresAt;
      if (sortKey === 'desk') {
        const da = getDesk(a.deskId)?.number ?? '';
        const db = getDesk(b.deskId)?.number ?? '';
        return da.localeCompare(db);
      }
      if (sortKey === 'student') {
        const ua = getUser(a.userId)?.name ?? '';
        const ub = getUser(b.userId)?.name ?? '';
        return ua.localeCompare(ub);
      }
      return 0;
    });

    return list;
  }, [state.bookings, state.desks, state.users, statusFilter, search, sortKey, now]);

  const counts = useMemo(() => ({
    all: state.bookings.filter(b => ['checked_in', 'away', 'booked'].includes(b.status)).length,
    checked_in: state.bookings.filter(b => b.status === 'checked_in').length,
    away: state.bookings.filter(b => b.status === 'away').length,
    booked: state.bookings.filter(b => b.status === 'booked').length,
  }), [state.bookings]);

  const handleFreeDesk = (booking: Booking, deskNumber: string) => {
    resetDesk(booking.id);
    toast.success(`Desk ${deskNumber} freed ✅`);
  };

  return (
    <AuthGuard requireRole="librarian">
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">

              {/* Header */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-black text-slate-800">Live Sessions</h1>
                  <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    {counts.all} active · updates every second
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400 bg-white border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <Clock size={12} />
                  {new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>

              {/* Status filter tabs */}
              <div className="flex gap-2 flex-wrap">
                {([
                  { key: 'all', label: 'All Sessions', count: counts.all },
                  { key: 'checked_in', label: 'Active', count: counts.checked_in },
                  { key: 'away', label: 'Away', count: counts.away },
                  { key: 'booked', label: 'Pending Check-In', count: counts.booked },
                ] as const).map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      statusFilter === key
                        ? 'bg-[#1e3a8a] text-white shadow-md shadow-blue-100'
                        : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      statusFilter === key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>{count}</span>
                  </button>
                ))}
              </div>

              {/* Search + Sort */}
              <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search desk, zone, or student name…"
                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 text-sm text-slate-500">
                  <Filter size={13} />
                  <span className="text-xs font-medium">Sort:</span>
                  <select
                    value={sortKey}
                    onChange={e => setSortKey(e.target.value as SortKey)}
                    className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none pr-1 py-2"
                  >
                    <option value="expiry">Expiry (soonest first)</option>
                    <option value="desk">Desk Number</option>
                    <option value="student">Student Name</option>
                  </select>
                </div>
              </div>

              {/* Sessions table */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                    <CheckCircle size={36} className="text-slate-200" />
                    <div className="text-center">
                      <p className="text-base font-semibold text-slate-600">No sessions found</p>
                      <p className="text-sm mt-1">
                        {search || statusFilter !== 'all'
                          ? 'Try changing your search or filter.'
                          : 'No students are currently using the library.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Table header */}
                    <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Status</span>
                      <span>Desk</span>
                      <span>Student</span>
                      <span>Booked</span>
                      <span>Session Left</span>
                      <span>Away Grace</span>
                      <span>Action</span>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-50">
                      {sessions.map(booking => {
                        const desk = getDesk(booking.deskId);
                        const user = getUser(booking.userId);
                        if (!desk || !user) return null;

                        const cfg = getStatusColor(booking.status);
                        const remaining = Math.max(0, booking.expiresAt - now);
                        const awayRemaining = booking.awayStartedAt
                          ? Math.max(0, booking.awayStartedAt + 20 * 60 * 1000 - now)
                          : null;
                        const isExpiringSoon = remaining < 10 * 60 * 1000 && remaining > 0;

                        return (
                          <div
                            key={booking.id}
                            className={`grid grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-slate-50/60 transition-colors ${cfg.row}`}
                          >
                            {/* Status dot */}
                            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />

                            {/* Desk */}
                            <div>
                              <p className="text-sm font-bold text-slate-800">{desk.number}</p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <MapPin size={9} />
                                {desk.zone}
                              </p>
                            </div>

                            {/* Student */}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-700 truncate">{user.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                            </div>

                            {/* Duration */}
                            <div className="text-right">
                              <p className="text-xs font-semibold text-slate-600">{booking.durationHours}h slot</p>
                            </div>

                            {/* Session remaining */}
                            <div className="text-right w-20">
                              <p className={`text-sm font-mono font-bold ${
                                isExpiringSoon ? 'text-[#dc2626]' : 'text-slate-700'
                              }`}>
                                {remaining > 0 ? formatMMSS(remaining) : <span className="text-[#dc2626]">Expired</span>}
                              </p>
                              <p className="text-[9px] text-slate-400">remaining</p>
                            </div>

                            {/* Away grace */}
                            <div className="text-right w-16">
                              {awayRemaining !== null ? (
                                <>
                                  <p className="text-xs font-mono font-bold text-[#f59e0b]">
                                    {formatMMSS(awayRemaining)}
                                  </p>
                                  <p className="text-[9px] text-slate-400">grace</p>
                                </>
                              ) : (
                                <p className="text-[10px] text-slate-300">—</p>
                              )}
                            </div>

                            {/* Action */}
                            <button
                              onClick={() => handleFreeDesk(booking, desk.number)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-500 hover:bg-[#dc2626] hover:text-white hover:border-[#dc2626] transition-all whitespace-nowrap"
                            >
                              <RefreshCw size={10} />
                              Free
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 text-center">
                      Showing {sessions.length} session{sessions.length !== 1 ? 's' : ''} · Live — synced across all tabs
                    </div>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
