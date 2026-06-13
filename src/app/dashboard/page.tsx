'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Zap, Wifi, VolumeX, X, Zap as PowerIcon, Globe, CheckCircle } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import DeskCard from '@/components/ui/DeskCard';
import BookingModal from '@/components/modals/BookingModal';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';
import { useDeskGuard } from '@/context/DeskGuardContext';
import { Desk, DeskZone, Booking } from '@/lib/types';
import { ZONE_DESCRIPTIONS } from '@/lib/seedData';
import { toast } from 'sonner';

type TabId = 'All Zones' | DeskZone;

const TABS: TabId[] = ['All Zones', 'Zone A', 'Zone B', 'Silent Zone'];
const ZONE_ICONS: Record<DeskZone, React.ElementType> = {
  'Zone A': Zap,
  'Zone B': Wifi,
  'Silent Zone': VolumeX,
};

const DURATION_OPTIONS = [
  { label: '1 Hour', hours: 1 },
  { label: '2 Hours', hours: 2 },
  { label: '3 Hours', hours: 3 },
];

export default function DashboardPage() {
  const { state, bookDesk, getDeskById } = useDeskGuard();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>('All Zones');
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const [hoveredDesk, setHoveredDesk] = useState<Desk | null>(null);
  const [duration, setDuration] = useState(2);
  const [loading, setLoading] = useState(true);
  const [confirmingBooking, setConfirmingBooking] = useState(false);
  const [newBooking, setNewBooking] = useState<{ booking: Booking; desk: Desk } | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [panelVisible, setPanelVisible] = useState(false);

  // Loading skeleton delay
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // Live clock
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Animate panel in when desk selected
  useEffect(() => {
    if (selectedDesk) {
      setPanelVisible(false);
      const t = setTimeout(() => setPanelVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setPanelVisible(false);
    }
  }, [selectedDesk?.id]);

  const handleDeskClick = useCallback((desk: Desk) => {
    if (desk.status === 'available') {
      setSelectedDesk((prev) => prev?.id === desk.id ? null : desk);
    } else if (desk.status === 'occupied') {
      toast.error(`Desk ${desk.number} is occupied.`, {
        description: 'This desk is currently in use. Choose an available (green) desk.',
        duration: 3000,
      });
      setSelectedDesk(null);
    } else if (desk.status === 'away') {
      toast.warning(`Desk ${desk.number} is temporarily away.`, {
        description: "This desk may become free soon if the user does not return in time.",
        duration: 3000,
      });
      setSelectedDesk(null);
    }
  }, []);

  const handleConfirmBooking = useCallback(() => {
    if (!selectedDesk) return;
    setConfirmingBooking(true);

    const result = bookDesk(selectedDesk.id, duration);
    if (!result.ok || !result.booking) {
      toast.error(result.error ?? 'Booking failed');
      setConfirmingBooking(false);
      return;
    }

    const updatedDesk = getDeskById(selectedDesk.id);
    toast.success(`Desk ${selectedDesk.number} booked successfully!`, {
      description: `${duration}h session until ${new Date(Date.now() + duration * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    });
    setNewBooking({ booking: result.booking, desk: updatedDesk ?? selectedDesk });
    setSelectedDesk(null);
    setConfirmingBooking(false);
  }, [selectedDesk, duration, bookDesk, getDeskById]);

  const filteredDesks = activeTab === 'All Zones'
    ? state.desks
    : state.desks.filter((d) => d.zone === activeTab);

  // Group by zone
  const desksByZone: Record<DeskZone, Desk[]> = {
    'Zone A': [],
    'Zone B': [],
    'Silent Zone': [],
  };
  filteredDesks.forEach((d) => desksByZone[d.zone].push(d));

  const zonesToShow: DeskZone[] = activeTab === 'All Zones'
    ? ['Zone A', 'Zone B', 'Silent Zone']
    : [activeTab as DeskZone];

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const totalDesks = state.desks.length;
  const availableCount = state.desks.filter((d) => d.status === 'available').length;
  const occupiedCount = state.desks.filter((d) => d.status === 'occupied').length;
  const awayCount = state.desks.filter((d) => d.status === 'away').length;

  if (loading) return (
    <AuthGuard requireRole="student">
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <DashboardSkeleton />
        </div>
      </div>
    </AuthGuard>
  );

  return (
    <AuthGuard requireRole="student">
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />

          <main className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-0">
            {/* Wrapper that lets the left scroll independently */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-5 p-4 lg:p-6">

              {/* ── Left panel: map (scrolls) ── */}
              <div className="flex-1 min-w-0 space-y-4 overflow-y-auto pr-1">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800">Library Map – Ground Floor</h1>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                      <Clock size={14} />
                      <span className="font-mono">{formattedDate}, {formattedTime}</span>
                    </div>
                  </div>
                  {/* Live stats strip */}
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d1fae5] text-[#10b981] rounded-full">
                      <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                      {availableCount} Available
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fee2e2] text-[#dc2626] rounded-full">
                      <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
                      {occupiedCount} Occupied
                    </span>
                    <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#fef3c7] text-[#f59e0b] rounded-full">
                      <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                      {awayCount} Away
                    </span>
                  </div>
                </div>

                {/* Zone tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); setSelectedDesk(null); }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        activeTab === tab
                          ? 'bg-[#1e3a8a] text-white shadow-md shadow-blue-200 scale-105'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-[#1e3a8a] hover:text-[#1e3a8a] hover:scale-105'
                      }`}
                    >
                      {tab === 'Silent Zone' ? '🤫 Silent' : tab}
                    </button>
                  ))}
                </div>

                {/* Hint text */}
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981] inline-block" />
                  Click a <strong className="text-[#10b981]">green</strong> desk to book it
                  &nbsp;·&nbsp;
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#dc2626] inline-block" />
                  <strong className="text-[#dc2626]">Red</strong> = occupied
                  &nbsp;·&nbsp;
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b] inline-block" />
                  <strong className="text-[#f59e0b]">Amber</strong> = away
                </p>

                {/* Zone sections */}
                <div className="space-y-4">
                  {zonesToShow.map((zone) => {
                    const ZoneIcon = ZONE_ICONS[zone];
                    const zoneDesks = desksByZone[zone];
                    const avail = zoneDesks.filter((d) => d.status === 'available').length;
                    const total = zoneDesks.length;
                    const pct = Math.round((avail / total) * 100);

                    return (
                      <div key={zone} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        {/* Zone header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <ZoneIcon size={17} className="text-[#1e3a8a]" />
                              <h2 className="text-sm font-bold text-slate-800">
                                {zone === 'Zone A' ? 'Zone A: Main Collaborative' :
                                 zone === 'Zone B' ? 'Zone B: General Study' :
                                 'Silent Zone'}
                              </h2>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 ml-6">
                              {ZONE_DESCRIPTIONS[zone]}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              pct > 50 ? 'bg-[#d1fae5] text-[#10b981]' :
                              pct > 20 ? 'bg-[#fef3c7] text-[#f59e0b]' :
                              'bg-[#fee2e2] text-[#dc2626]'
                            }`}>
                              {avail} / {total} Free
                            </span>
                          </div>
                        </div>

                        {/* Desk grid */}
                        <div className="flex flex-wrap gap-2">
                          {zoneDesks.map((desk) => (
                            <DeskCard
                              key={desk.id}
                              desk={desk}
                              isSelected={selectedDesk?.id === desk.id}
                              onClick={handleDeskClick}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Right panel: sticky legend + detail ── */}
              <div className="lg:w-72 xl:w-80 flex-shrink-0 space-y-4 lg:overflow-y-auto lg:sticky lg:top-0 pb-6">

                {/* Status legend */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">Status Legend</p>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Available', color: 'bg-[#10b981]', bg: 'bg-[#d1fae5]', sub: 'Click to book' },
                      { label: 'Occupied', color: 'bg-[#dc2626]', bg: 'bg-[#fee2e2]', sub: 'In use' },
                      { label: 'Away (max 20m)', color: 'bg-[#f59e0b]', bg: 'bg-[#fef3c7]', sub: 'Temporarily away' },
                      { label: 'Selected', color: 'bg-[#1e3a8a]', bg: 'bg-blue-100', sub: 'Your pick' },
                    ].map(({ label, color, bg, sub }) => (
                      <div key={label} className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                          <div className={`w-3 h-3 rounded-md ${color}`} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{label}</p>
                          <p className="text-[10px] text-slate-400">{sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desk booking panel — slides in when a desk is selected */}
                {selectedDesk && selectedDesk.status === 'available' ? (
                  <div
                    className={`bg-white rounded-2xl border-2 border-[#1e3a8a]/30 shadow-xl shadow-blue-100/60 p-5 space-y-4 transition-all duration-300 ${
                      panelVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                  >
                    {/* Panel header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#d1fae5] text-[#10b981] rounded-full text-xs font-bold mb-2">
                          <CheckCircle size={11} />
                          Available
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Desk {selectedDesk.number}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{selectedDesk.zone}</p>
                      </div>
                      <button
                        onClick={() => setSelectedDesk(null)}
                        className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Zone description */}
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 leading-relaxed">
                      {ZONE_DESCRIPTIONS[selectedDesk.zone]}
                    </p>

                    {/* Amenities */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDesk.amenities.map((a) => (
                          <span
                            key={a}
                            className="text-xs px-2.5 py-1 bg-blue-50 text-[#1e3a8a] rounded-lg font-semibold flex items-center gap-1"
                          >
                            {a.includes('Power') ? <PowerIcon size={10} /> : <Globe size={10} />}
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Duration picker */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                        Booking Duration
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {DURATION_OPTIONS.map((opt) => {
                          const endTime = new Date(Date.now() + opt.hours * 3600000);
                          const timeStr = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          return (
                            <button
                              key={opt.hours}
                              onClick={() => setDuration(opt.hours)}
                              className={`py-2 px-1 rounded-xl text-xs font-bold border-2 transition-all ${
                                duration === opt.hours
                                  ? 'border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-md'
                                  : 'border-slate-200 text-slate-600 hover:border-[#1e3a8a] hover:text-[#1e3a8a]'
                              }`}
                            >
                              <div>{opt.label.replace(' Hour', 'h').replace('s', '')}</div>
                              <div className={`text-[9px] mt-0.5 ${duration === opt.hours ? 'text-blue-200' : 'text-slate-400'}`}>
                                ~{timeStr}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Confirm button */}
                    <button
                      onClick={handleConfirmBooking}
                      disabled={confirmingBooking}
                      className="w-full py-3 rounded-xl bg-[#1e3a8a] text-white text-sm font-bold hover:bg-[#1e40af] active:scale-[0.97] transition-all disabled:opacity-60 shadow-lg shadow-blue-200"
                    >
                      {confirmingBooking ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Booking...
                        </span>
                      ) : (
                        `Confirm ${duration}h Booking`
                      )}
                    </button>
                  </div>
                ) : !selectedDesk ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                      <Wifi size={22} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">No desk selected</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Click any <span className="text-[#10b981] font-semibold">green</span> desk on the map to see booking options
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </main>
        </div>

        {/* Booking modal */}
        {newBooking && (
          <BookingModal
            booking={newBooking.booking}
            desk={newBooking.desk}
            onClose={() => setNewBooking(null)}
            onGoToCheckin={() => { setNewBooking(null); router.push('/checkin'); }}
          />
        )}
      </div>
    </AuthGuard>
  );
}
