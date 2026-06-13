'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Monitor, Zap, Wifi, VolumeX, RefreshCw,
  CheckCircle, Clock, Coffee, TrendingUp, Users,
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useDeskGuard } from '@/context/DeskGuardContext';
import { Desk, DeskZone, Booking } from '@/lib/types';
import { formatMMSS } from '@/lib/timerHelpers';
import { ZONE_DESCRIPTIONS } from '@/lib/seedData';
import { toast } from 'sonner';

const ZONE_ICONS: Record<DeskZone, React.ElementType> = {
  'Zone A': Zap,
  'Zone B': Wifi,
  'Silent Zone': VolumeX,
};
const ZONES: DeskZone[] = ['Zone A', 'Zone B', 'Silent Zone'];

function DeskTile({
  desk, booking, user, now, onFree, onClick, isSelected,
}: {
  desk: Desk;
  booking?: Booking;
  user?: { name: string; email: string };
  now: number;
  onFree: () => void;
  onClick: () => void;
  isSelected: boolean;
}) {
  const remaining = booking ? Math.max(0, booking.expiresAt - now) : 0;
  const awayRemaining = booking?.awayStartedAt
    ? Math.max(0, booking.awayStartedAt + 20 * 60 * 1000 - now)
    : 0;

  const color =
    desk.status === 'available' ? 'border-[#10b981] bg-[#d1fae5]' :
    desk.status === 'away'      ? 'border-[#f59e0b] bg-[#fef3c7]' :
                                  'border-[#dc2626] bg-[#fee2e2]';
  const textColor =
    desk.status === 'available' ? 'text-[#10b981]' :
    desk.status === 'away'      ? 'text-[#f59e0b]' :
                                  'text-[#dc2626]';

  const label = desk.number.replace(/^[A-Z]-0?/, d => d === 'S-' ? 'S' : '').replace(/^[AB]-0?/, '');

  return (
    <button
      onClick={onClick}
      className={`relative w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95 ${color} ${
        isSelected ? 'ring-2 ring-offset-1 ring-[#1e3a8a] scale-110' : ''
      }`}
      title={`${desk.number} — ${desk.status}${user ? ` — ${user.name}` : ''}`}
    >
      <span className={`text-xs font-black ${textColor}`}>{desk.number.split('-')[0]}-{desk.number.split('-')[1]?.replace(/^0/, '')}</span>
      {desk.status === 'away' && (
        <span className="text-[7px] text-[#f59e0b] font-bold">away</span>
      )}
      {desk.status === 'occupied' && remaining > 0 && remaining < 10 * 60 * 1000 && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-[#dc2626] border border-white" title="Expiring soon" />
      )}
    </button>
  );
}

export default function FloorMonitorPage() {
  const { state, resetDesk } = useDeskGuard();
  const [now, setNow] = useState(Date.now());
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [activeZone, setActiveZone] = useState<DeskZone | 'All'>('All');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const getBooking = (deskId: string) =>
    state.bookings.find(b => b.deskId === deskId && ['checked_in', 'away', 'booked'].includes(b.status));
  const getUser = (userId: string) => state.users.find(u => u.id === userId);

  const desksByZone = useMemo(() => {
    const g: Record<DeskZone, Desk[]> = { 'Zone A': [], 'Zone B': [], 'Silent Zone': [] };
    state.desks.forEach(d => g[d.zone].push(d));
    return g;
  }, [state.desks]);

  const zonesToShow = activeZone === 'All' ? ZONES : [activeZone as DeskZone];

  const totalDesks = state.desks.length;
  const available = state.desks.filter(d => d.status === 'available').length;
  const occupied = state.desks.filter(d => d.status === 'occupied').length;
  const away = state.desks.filter(d => d.status === 'away').length;

  const selectedBooking = selectedDesk ? getBooking(selectedDesk.id) : undefined;
  const selectedUser = selectedBooking ? getUser(selectedBooking.userId) : undefined;
  const selRemaining = selectedBooking ? Math.max(0, selectedBooking.expiresAt - now) : 0;
  const selAwayRemaining = selectedBooking?.awayStartedAt
    ? Math.max(0, selectedBooking.awayStartedAt + 20 * 60 * 1000 - now) : 0;

  const handleFreeSelected = () => {
    if (!selectedBooking || !selectedDesk) return;
    resetDesk(selectedBooking.id);
    toast.success(`Desk ${selectedDesk.number} freed ✅`);
    setSelectedDesk(null);
  };

  return (
    <AuthGuard requireRole="librarian">
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />

          <main className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
              <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">

                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h1 className="text-2xl font-black text-slate-800">Floor Monitor</h1>
                    <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                      Real-time desk status · click any desk for details
                    </p>
                  </div>
                  <div className="text-xs font-mono text-slate-400 bg-white border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-1.5">
                    <Clock size={12} />
                    {new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Total', value: totalDesks, icon: Monitor, color: 'text-slate-600', bg: 'bg-slate-100' },
                    { label: 'Available', value: available, icon: CheckCircle, color: 'text-[#10b981]', bg: 'bg-[#d1fae5]' },
                    { label: 'Occupied', value: occupied, icon: Users, color: 'text-[#dc2626]', bg: 'bg-[#fee2e2]' },
                    { label: 'Away', value: away, icon: Coffee, color: 'text-[#f59e0b]', bg: 'bg-[#fef3c7]' },
                  ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={18} className={color} />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-800">{value}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Occupancy bar */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-[#1e3a8a]" />
                      <span className="text-sm font-bold text-slate-700">Occupancy</span>
                    </div>
                    <span className="text-sm font-black text-slate-800">
                      {totalDesks > 0 ? Math.round(((occupied + away) / totalDesks) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#dc2626] transition-all duration-700 rounded-l-full" style={{ width: `${(occupied / totalDesks) * 100}%` }} />
                    <div className="h-full bg-[#f59e0b] transition-all duration-700" style={{ width: `${(away / totalDesks) * 100}%` }} />
                  </div>
                  <div className="flex gap-4 mt-1.5 text-[10px] font-medium text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#dc2626]" />Occupied ({occupied})</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" />Away ({away})</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]" />Available ({available})</span>
                  </div>
                </div>

                {/* Zone tabs */}
                <div className="flex gap-2">
                  {(['All', ...ZONES] as const).map(z => (
                    <button
                      key={z}
                      onClick={() => { setActiveZone(z); setSelectedDesk(null); }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        activeZone === z
                          ? 'bg-[#1e3a8a] text-white shadow-md shadow-blue-100'
                          : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {z === 'Silent Zone' ? '🔇 Silent' : z}
                    </button>
                  ))}
                </div>

                {/* Zones + desk grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  {/* Map panel */}
                  <div className="xl:col-span-2 space-y-4">
                    {zonesToShow.map(zone => {
                      const ZIcon = ZONE_ICONS[zone];
                      const zoneDesks = desksByZone[zone];
                      const zAvail = zoneDesks.filter(d => d.status === 'available').length;
                      const zTotal = zoneDesks.length;
                      return (
                        <div key={zone} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <ZIcon size={15} className="text-[#1e3a8a]" />
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  {zone === 'Zone A' ? 'Zone A — Collaborative' :
                                   zone === 'Zone B' ? 'Zone B — General Study' :
                                   '🔇 Silent Zone'}
                                </p>
                                <p className="text-[10px] text-slate-400">{ZONE_DESCRIPTIONS[zone]}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                zAvail > zTotal / 2 ? 'bg-[#d1fae5] text-[#10b981]' :
                                zAvail > 2 ? 'bg-[#fef3c7] text-[#f59e0b]' :
                                'bg-[#fee2e2] text-[#dc2626]'
                              }`}>
                                {zAvail}/{zTotal} free
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {zoneDesks.map(desk => {
                              const bk = getBooking(desk.id);
                              const usr = bk ? getUser(bk.userId) : undefined;
                              return (
                                <DeskTile
                                  key={desk.id}
                                  desk={desk}
                                  booking={bk}
                                  user={usr}
                                  now={now}
                                  isSelected={selectedDesk?.id === desk.id}
                                  onClick={() => setSelectedDesk(
                                    selectedDesk?.id === desk.id ? null : desk
                                  )}
                                  onFree={() => {
                                    if (bk) { resetDesk(bk.id); toast.success(`Desk ${desk.number} freed ✅`); }
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Legend */}
                    <div className="flex items-center gap-6 text-xs text-slate-400 font-medium px-1">
                      <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-md bg-[#d1fae5] border-2 border-[#10b981]" />Available</span>
                      <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-md bg-[#fee2e2] border-2 border-[#dc2626]" />Occupied</span>
                      <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-md bg-[#fef3c7] border-2 border-[#f59e0b]" />Away</span>
                      <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#dc2626]" />Expiring &lt;10 min</span>
                    </div>
                  </div>

                  {/* Detail panel */}
                  <div className="space-y-4">
                    {!selectedDesk ? (
                      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 space-y-2">
                        <Monitor size={28} className="mx-auto text-slate-200" />
                        <p className="text-sm font-medium">Click any desk to see details</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-[#1e3a8a]/20 shadow-sm overflow-hidden">
                        <div className={`px-5 py-4 border-b ${
                          selectedDesk.status === 'available' ? 'bg-[#d1fae5]/40 border-[#10b981]/20' :
                          selectedDesk.status === 'away' ? 'bg-[#fef3c7]/40 border-[#f59e0b]/20' :
                          'bg-[#fee2e2]/40 border-[#dc2626]/20'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xl font-black text-slate-800">{selectedDesk.number}</p>
                              <p className="text-xs text-slate-400">{selectedDesk.zone}</p>
                            </div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              selectedDesk.status === 'available' ? 'bg-[#d1fae5] text-[#10b981]' :
                              selectedDesk.status === 'away' ? 'bg-[#fef3c7] text-[#f59e0b]' :
                              'bg-[#fee2e2] text-[#dc2626]'
                            }`}>{selectedDesk.status}</span>
                          </div>
                        </div>

                        <div className="p-5 space-y-3">
                          {selectedDesk.status === 'available' ? (
                            <div className="flex items-center gap-2 text-[#10b981]">
                              <CheckCircle size={16} />
                              <span className="text-sm font-semibold">Desk is available for booking</span>
                            </div>
                          ) : selectedBooking && selectedUser ? (
                            <>
                              <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Student</p>
                                <p className="text-sm font-bold text-slate-800">{selectedUser.name}</p>
                                <p className="text-xs text-slate-500">{selectedUser.email}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-50 rounded-xl p-3 text-center">
                                  <p className="text-[10px] text-slate-400 font-medium mb-1">Session Left</p>
                                  <p className={`text-lg font-black font-mono ${selRemaining < 10 * 60 * 1000 ? 'text-[#dc2626]' : 'text-[#1e3a8a]'}`}>
                                    {formatMMSS(selRemaining)}
                                  </p>
                                </div>
                                <div className={`rounded-xl p-3 text-center ${selAwayRemaining > 0 ? 'bg-[#fef3c7]/60' : 'bg-slate-50'}`}>
                                  <p className="text-[10px] text-slate-400 font-medium mb-1">Away Grace</p>
                                  <p className={`text-lg font-black font-mono ${selAwayRemaining > 0 ? 'text-[#f59e0b]' : 'text-slate-300'}`}>
                                    {selAwayRemaining > 0 ? formatMMSS(selAwayRemaining) : '—'}
                                  </p>
                                </div>
                              </div>

                              <p className="text-[10px] text-slate-400 text-center">
                                Expires at {new Date(selectedBooking.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>

                              <button
                                onClick={handleFreeSelected}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#dc2626] text-white text-sm font-bold hover:bg-red-700 active:scale-95 transition-all"
                              >
                                <RefreshCw size={14} />
                                Force Free This Desk
                              </button>
                            </>
                          ) : null}

                          <div className="text-[10px] text-slate-300 space-y-0.5">
                            {selectedDesk.amenities.map(a => (
                              <p key={a}>• {a}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Zone summary */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Zone Summary</p>
                      {ZONES.map(zone => {
                        const zd = desksByZone[zone];
                        const za = zd.filter(d => d.status === 'available').length;
                        const pct = Math.round((za / zd.length) * 100);
                        return (
                          <div key={zone}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-600">
                                {zone === 'Silent Zone' ? '🔇 Silent' : zone}
                              </span>
                              <span className="text-xs font-bold text-slate-500">{za}/{zd.length}</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  pct > 50 ? 'bg-[#10b981]' : pct > 20 ? 'bg-[#f59e0b]' : 'bg-[#dc2626]'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
