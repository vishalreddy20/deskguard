'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Monitor, AlertTriangle, Search, RefreshCw, Users,
  CheckCircle, Coffee, Zap, Wifi, VolumeX, ChevronRight,
  TrendingUp, Clock, Activity, MessageSquare, ArrowRight,
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useDeskGuard } from '@/context/DeskGuardContext';
import { Booking, Desk, DeskZone } from '@/lib/types';
import { formatMMSS, formatRelativeTime } from '@/lib/timerHelpers';
import { getLastSeenAbandonedCount, saveLastSeenAbandonedCount } from '@/lib/storage';
import { ZONE_DESCRIPTIONS } from '@/lib/seedData';
import { toast } from 'sonner';

// ── Types ───────────────────────────────────────────────────
type ZoneFilter = 'All' | DeskZone;
const ZONE_FILTERS: ZoneFilter[] = ['All', 'Zone A', 'Zone B', 'Silent Zone'];

const WARNING_THRESHOLD_MS = 90 * 1000; // 90s demo / 2h production

// ── DeskCard (read-only, librarian view) ────────────────────
function LibrarianDeskCard({
  desk,
  booking,
  onClick,
}: {
  desk: Desk;
  booking?: Booking;
  onClick?: () => void;
}) {
  const style =
    desk.status === 'available'
      ? 'bg-[#d1fae5] border-[#10b981] text-[#10b981] hover:scale-105'
      : desk.status === 'away'
      ? 'bg-[#fef3c7] border-[#f59e0b] text-[#f59e0b] hover:scale-105'
      : 'bg-[#fee2e2] border-[#dc2626] text-[#dc2626] hover:scale-105';

  const label = desk.number.startsWith('S-')
    ? 'S' + desk.number.slice(2).replace(/^0/, '')
    : desk.number.replace(/^[A-Z]-0?/, '');

  return (
    <button
      onClick={onClick}
      title={`${desk.number} — ${desk.status}`}
      className={`w-12 h-12 rounded-xl border-2 text-[10px] font-bold transition-all duration-150 flex flex-col items-center justify-center cursor-pointer ${style}`}
    >
      <span>{label}</span>
      {desk.status === 'away' && <span className="text-[7px] opacity-70">away</span>}
    </button>
  );
}

// ── Stat Card ───────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, accent, pulse,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; pulse?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 transition-all hover:shadow-md ${accent}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <Icon size={18} className="text-slate-300" />
      </div>
      <div className="flex items-end gap-2">
        <p className="text-4xl font-black text-slate-800 leading-none">{value}</p>
        {sub && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full mb-0.5 ${
            pulse ? 'bg-red-100 text-[#dc2626] animate-pulse' : 'bg-slate-100 text-slate-500'
          }`}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Session Row ─────────────────────────────────────────────
function SessionRow({ booking, desk, users, now, onReset }: {
  booking: Booking;
  desk: Desk;
  users: { id: string; name: string; email: string }[];
  now: number;
  onReset: () => void;
}) {
  const user = users.find(u => u.id === booking.userId);
  const remaining = Math.max(0, booking.expiresAt - now);
  const awayRemaining = booking.awayStartedAt ? Math.max(0, (booking.awayStartedAt + 20 * 60 * 1000) - now) : 0;

  return (
    <div className={`flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors ${
      desk.status === 'away' ? 'bg-amber-50/30' : ''
    }`}>
      {/* Status dot */}
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
        desk.status === 'away' ? 'bg-[#f59e0b] animate-pulse' :
        desk.status === 'occupied' ? 'bg-[#10b981] animate-pulse' : 'bg-slate-300'
      }`} />

      {/* Desk */}
      <div className="w-20 flex-shrink-0">
        <p className="text-sm font-bold text-slate-800">{desk.number}</p>
        <p className="text-[10px] text-slate-400">{desk.zone.replace('Zone ', 'Z').replace('Silent Zone', 'Silent')}</p>
      </div>

      {/* Student */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate">{user?.name ?? 'Unknown'}</p>
        <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
      </div>

      {/* Status */}
      <div className="flex-shrink-0 text-right">
        {desk.status === 'away' ? (
          <div>
            <span className="text-[10px] font-bold text-[#f59e0b] flex items-center gap-1 justify-end">
              <Coffee size={10} /> Away
            </span>
            <span className="text-xs font-mono text-[#f59e0b]">{formatMMSS(awayRemaining)}</span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-[#10b981] flex items-center gap-1 justify-end">
            <Activity size={10} /> Active
          </span>
        )}
      </div>

      {/* Time remaining */}
      <div className="w-20 text-right flex-shrink-0">
        <p className={`text-xs font-mono font-bold ${remaining < 10 * 60 * 1000 ? 'text-[#dc2626]' : 'text-slate-600'}`}>
          {formatMMSS(remaining)}
        </p>
        <p className="text-[9px] text-slate-400">remaining</p>
      </div>

      {/* Reset action */}
      <button
        onClick={onReset}
        className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-[#dc2626] hover:text-white hover:border-[#dc2626] transition-all"
      >
        <RefreshCw size={11} />
        Free
      </button>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function LibrarianPage() {
  const { state, resetDesk } = useDeskGuard();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('All');
  const [deskSearch, setDeskSearch] = useState('');
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [newAbandonedCount, setNewAbandonedCount] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // Live clock (1s)
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // ── Stats ──────────────────────────────────────────────────
  const totalDesks = state.desks.length;
  const occupiedDesks = state.desks.filter(d => d.status === 'occupied').length;
  const awayDesks = state.desks.filter(d => d.status === 'away').length;
  const freeDesks = state.desks.filter(d => d.status === 'available').length;
  const occupancyPct = totalDesks > 0 ? Math.round(((occupiedDesks + awayDesks) / totalDesks) * 100) : 0;

  const abandonedBookings = useMemo(() =>
    state.bookings.filter(b => b.status === 'abandoned'), [state.bookings]);
  const abandonedCount = abandonedBookings.length;

  const activeBookings = useMemo(() =>
    state.bookings.filter(b => ['checked_in', 'away'].includes(b.status)), [state.bookings]);

  const issueReports = useMemo(() =>
    state.bookings.filter(b => b.issueReport), [state.bookings]);

  // Track new abandoned
  useEffect(() => {
    const lastSeen = getLastSeenAbandonedCount();
    setNewAbandonedCount(Math.max(0, abandonedCount - lastSeen));
  }, [abandonedCount]);

  // Warning rows (approaching threshold)
  const warningBookings = useMemo(() =>
    state.bookings.filter(b =>
      b.status === 'checked_in' && b.lastConfirmedAt &&
      now - b.lastConfirmedAt >= WARNING_THRESHOLD_MS
    ), [state.bookings, now]);

  // ── Floor map desks filtered ───────────────────────────────
  const filteredDesks = useMemo(() => {
    let desks = state.desks;
    if (zoneFilter !== 'All') desks = desks.filter(d => d.zone === zoneFilter);
    if (deskSearch) desks = desks.filter(d => d.number.toLowerCase().includes(deskSearch.toLowerCase()));
    return desks;
  }, [state.desks, zoneFilter, deskSearch]);

  const desksByZone = useMemo(() => {
    const g: Record<DeskZone, Desk[]> = { 'Zone A': [], 'Zone B': [], 'Silent Zone': [] };
    filteredDesks.forEach(d => g[d.zone].push(d));
    return g;
  }, [filteredDesks]);

  const zonesToShow: DeskZone[] = zoneFilter === 'All'
    ? ['Zone A', 'Zone B', 'Silent Zone']
    : [zoneFilter as DeskZone];

  const ZONE_ICONS: Record<DeskZone, React.ElementType> = {
    'Zone A': Zap, 'Zone B': Wifi, 'Silent Zone': VolumeX,
  };

  // ── Actions ────────────────────────────────────────────────
  const handleReset = useCallback((bookingId: string, deskNumber: string) => {
    resetDesk(bookingId);
    saveLastSeenAbandonedCount(abandonedCount);
    setNewAbandonedCount(0);
    setSelectedDesk(null);
    toast.success(`Desk ${deskNumber} freed and made available ✅`);
  }, [resetDesk, abandonedCount]);

  const getBookingForDesk = (deskId: string) =>
    activeBookings.find(b => b.deskId === deskId);

  const getUser = (userId: string) =>
    state.users.find(u => u.id === userId);

  if (loading) {
    return (
      <AuthGuard requireRole="librarian">
        <div className="flex h-screen bg-[#f8fafc]">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#1e3a8a]/20 border-t-[#1e3a8a] rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requireRole="librarian">
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">

              {/* ── Header ─────────────────────────────────── */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-black text-slate-800">Librarian Dashboard</h1>
                  <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    Live — updates every second
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-white border border-slate-100 rounded-xl px-3 py-2">
                  <Clock size={13} />
                  {new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>

              {/* ── Stat Cards ────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard label="Total Desks"  value={totalDesks}     icon={Monitor}       accent="border-slate-100" />
                <StatCard label="Occupied"     value={occupiedDesks}  icon={Users}         accent="border-slate-100" sub={`${occupancyPct}%`} />
                <StatCard label="Away"         value={awayDesks}      icon={Coffee}        accent={awayDesks > 0 ? 'border-amber-200' : 'border-slate-100'} />
                <StatCard label="Free"         value={freeDesks}      icon={CheckCircle}   accent="border-slate-100" />
                <StatCard label="Abandoned"    value={abandonedCount} icon={AlertTriangle} accent={abandonedCount > 0 ? 'border-red-200' : 'border-slate-100'} sub={newAbandonedCount > 0 ? `+${newAbandonedCount} new` : undefined} pulse={newAbandonedCount > 0} />
              </div>

              {/* ── Occupancy Bar ─────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#1e3a8a]" />
                    <p className="text-sm font-bold text-slate-700">Current Occupancy</p>
                  </div>
                  <p className="text-sm font-black text-slate-800">{occupancyPct}%</p>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                  <div
                    className="h-full bg-[#dc2626] rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((occupiedDesks / totalDesks) * 100)}%` }}
                  />
                  <div
                    className="h-full bg-[#f59e0b] rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((awayDesks / totalDesks) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center gap-5 mt-2 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />Occupied ({occupiedDesks})</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />Away ({awayDesks})</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-200" />Free ({freeDesks})</span>
                </div>
              </div>

              {/* ── 2-column grid: Floor Map + Active Sessions ── */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* ── LIVE FLOOR MAP ───────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Monitor size={14} className="text-[#1e3a8a]" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-800">Live Floor Map</h2>
                    </div>
                    <div className="flex gap-1.5">
                      {ZONE_FILTERS.map(z => (
                        <button
                          key={z}
                          onClick={() => { setZoneFilter(z); setSelectedDesk(null); }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            zoneFilter === z ? 'bg-[#1e3a8a] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {z === 'Silent Zone' ? 'Silent' : z === 'All' ? 'All' : z}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                    {zonesToShow.map(zone => {
                      const ZoneIcon = ZONE_ICONS[zone];
                      const zoneDesks = desksByZone[zone];
                      const avail = zoneDesks.filter(d => d.status === 'available').length;
                      return (
                        <div key={zone}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <ZoneIcon size={13} className="text-[#1e3a8a]" />
                              <p className="text-xs font-bold text-slate-600">
                                {zone === 'Zone A' ? 'Zone A: Collaborative' :
                                 zone === 'Zone B' ? 'Zone B: General Study' : 'Silent Zone'}
                              </p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              avail > zoneDesks.length / 2 ? 'bg-[#d1fae5] text-[#10b981]' :
                              avail > 2 ? 'bg-[#fef3c7] text-[#f59e0b]' : 'bg-[#fee2e2] text-[#dc2626]'
                            }`}>
                              {avail}/{zoneDesks.length} free
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {zoneDesks.map(desk => (
                              <LibrarianDeskCard
                                key={desk.id}
                                desk={desk}
                                booking={getBookingForDesk(desk.id)}
                                onClick={() => setSelectedDesk(selectedDesk?.id === desk.id ? null : desk)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desk detail tooltip */}
                  {selectedDesk && (() => {
                    const bk = getBookingForDesk(selectedDesk.id);
                    const usr = bk ? getUser(bk.userId) : null;
                    const remaining = bk ? Math.max(0, bk.expiresAt - now) : 0;
                    return (
                      <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-800">Desk {selectedDesk.number}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                selectedDesk.status === 'available' ? 'bg-[#d1fae5] text-[#10b981]' :
                                selectedDesk.status === 'away' ? 'bg-[#fef3c7] text-[#f59e0b]' :
                                'bg-[#fee2e2] text-[#dc2626]'
                              }`}>{selectedDesk.status}</span>
                            </div>
                            {usr && (
                              <p className="text-xs text-slate-500 mt-0.5">{usr.name} · {usr.email}</p>
                            )}
                            {bk && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                Expires: {new Date(bk.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' '}· {formatMMSS(remaining)} left
                              </p>
                            )}
                          </div>
                          {bk && (
                            <button
                              onClick={() => handleReset(bk.id, selectedDesk.number)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dc2626] text-white text-xs font-bold hover:bg-red-700 transition-all"
                            >
                              <RefreshCw size={11} />
                              Free Desk
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Legend */}
                  <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-5 text-[10px] font-medium text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#10b981]" />Available</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#dc2626]" />Occupied</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#f59e0b]" />Away</span>
                    <span className="ml-auto text-slate-300">Click a desk for details</span>
                  </div>
                </div>

                {/* ── ACTIVE SESSIONS ──────────────────────── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Activity size={14} className="text-[#10b981]" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-800">Active Sessions</h2>
                      <span className="text-[10px] font-bold bg-[#d1fae5] text-[#10b981] px-2 py-0.5 rounded-full">
                        {activeBookings.length} live
                      </span>
                    </div>
                    <button
                      onClick={() => router.push('/librarian/sessions')}
                      className="text-xs text-[#1e3a8a] font-semibold flex items-center gap-1 hover:underline"
                    >
                      View all <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-80">
                    {activeBookings.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                        <CheckCircle size={28} className="text-slate-200" />
                        <p className="text-sm font-medium">No active sessions</p>
                      </div>
                    ) : (
                      activeBookings.slice(0, 8).map(booking => {
                        const desk = state.desks.find(d => d.id === booking.deskId);
                        if (!desk) return null;
                        return (
                          <SessionRow
                            key={booking.id}
                            booking={booking}
                            desk={desk}
                            users={state.users}
                            now={now}
                            onReset={() => handleReset(booking.id, desk.number)}
                          />
                        );
                      })
                    )}
                  </div>

                  {activeBookings.length > 8 && (
                    <div className="border-t border-slate-100 px-5 py-3 text-center">
                      <button
                        onClick={() => router.push('/librarian/sessions')}
                        className="text-xs text-[#1e3a8a] font-semibold hover:underline"
                      >
                        +{activeBookings.length - 8} more sessions → View all
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Abandoned / Warning Queue ────────────── */}
              {(abandonedBookings.length > 0 || warningBookings.length > 0) && (
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-red-100 bg-red-50/50 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertTriangle size={16} className="text-[#dc2626]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Action Required</h2>
                      <p className="text-xs text-slate-500">Abandoned desks and at-risk sessions needing attention</p>
                    </div>
                    <span className="ml-auto text-xs font-bold bg-[#dc2626] text-white px-2.5 py-1 rounded-full">
                      {abandonedBookings.length + warningBookings.length} need action
                    </span>
                  </div>

                  <div className="divide-y divide-slate-50">
                    {[...abandonedBookings.map(b => ({ ...b, _type: 'abandoned' as const })),
                      ...warningBookings.map(b => ({ ...b, _type: 'warning' as const }))
                    ].map(booking => {
                      const desk = state.desks.find(d => d.id === booking.deskId);
                      if (!desk) return null;
                      const user = getUser(booking.userId);
                      const lastTs = booking.awayStartedAt ?? booking.lastConfirmedAt;
                      return (
                        <div key={booking.id} className={`flex items-center gap-4 px-5 py-4 ${
                          booking._type === 'abandoned' ? 'bg-red-50/30' : 'bg-amber-50/30'
                        }`}>
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            booking._type === 'abandoned' ? 'bg-[#dc2626]' : 'bg-[#f59e0b] animate-pulse'
                          }`} />
                          <div className="w-16 flex-shrink-0">
                            <p className="text-sm font-bold text-slate-800">{desk.number}</p>
                            <p className="text-[10px] text-slate-400">{desk.zone}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{user?.name ?? 'Unknown Student'}</p>
                            <p className="text-[10px] text-slate-400">Last active: {formatRelativeTime(lastTs)}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            booking._type === 'abandoned' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#fef3c7] text-[#f59e0b]'
                          }`}>
                            {booking._type === 'abandoned' ? 'Abandoned' : 'At Risk'}
                          </span>
                          <button
                            onClick={() => handleReset(booking.id, desk.number)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dc2626] text-white text-xs font-bold hover:bg-red-700 active:scale-95 transition-all"
                          >
                            <RefreshCw size={11} />
                            Free Desk
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── All Clear when nothing abandoned ─────── */}
              {abandonedBookings.length === 0 && warningBookings.length === 0 && (
                <div className="bg-white rounded-2xl border border-[#d1fae5] shadow-sm p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#d1fae5] flex items-center justify-center">
                    <CheckCircle size={20} className="text-[#10b981]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">All Clear — No Action Needed 🎉</p>
                    <p className="text-xs text-slate-400 mt-0.5">All desks are either available or actively in use.</p>
                  </div>
                </div>
              )}

              {/* ── Issue Reports quick view ──────────────── */}
              {issueReports.length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                        <MessageSquare size={14} className="text-[#f59e0b]" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-800">Reported Desk Issues</h2>
                      <span className="text-[10px] font-bold bg-amber-100 text-[#f59e0b] px-2 py-0.5 rounded-full">
                        {issueReports.length} report{issueReports.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => router.push('/librarian/issues')}
                      className="text-xs text-[#1e3a8a] font-semibold flex items-center gap-1 hover:underline"
                    >
                      View all <ChevronRight size={13} />
                    </button>
                  </div>
                  {issueReports.slice(0, 3).map(booking => {
                    const desk = state.desks.find(d => d.id === booking.deskId);
                    const user = getUser(booking.userId);
                    return (
                      <div key={booking.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-amber-50 last:border-0">
                        <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">
                            {desk?.number} — <span className="font-normal text-slate-500">{booking.issueReport}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Reported by {user?.name} · {formatRelativeTime(booking.endedAt ?? booking.startTime)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Quick nav cards ───────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Live Sessions', href: '/librarian/sessions', icon: Activity, bg: 'bg-blue-50', color: 'text-[#1e3a8a]', count: activeBookings.length },
                  { label: 'Floor Monitor', href: '/librarian/floor', icon: Monitor, bg: 'bg-emerald-50', color: 'text-[#10b981]', count: freeDesks + ' free' },
                  { label: 'Issue Reports', href: '/librarian/issues', icon: MessageSquare, bg: 'bg-amber-50', color: 'text-[#f59e0b]', count: issueReports.length },
                  { label: 'Check-In Support', href: '/librarian/checkin-support', icon: CheckCircle, bg: 'bg-purple-50', color: 'text-purple-600', count: '→' },
                ].map(({ label, href, icon: Icon, bg, color, count }) => (
                  <button
                    key={href}
                    onClick={() => router.push(href)}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-left hover:shadow-md hover:border-slate-200 transition-all group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon size={16} className={color} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{label}</p>
                        <p className={`text-lg font-black ${color}`}>{count}</p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </button>
                ))}
              </div>

            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
