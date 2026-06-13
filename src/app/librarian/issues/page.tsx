'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle, MessageSquare, CheckCircle, Clock,
  User, MapPin, RefreshCw, Search, ChevronDown, XCircle,
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useDeskGuard } from '@/context/DeskGuardContext';
import { Booking } from '@/lib/types';
import { formatRelativeTime } from '@/lib/timerHelpers';
import { toast } from 'sonner';

type TabFilter = 'all' | 'unresolved' | 'resolved';

const COMMON_ISSUES = [
  'Chair is broken / missing',
  'Power outlet not working',
  'WiFi signal is poor',
  'Monitor / screen issue',
  'Desk is dirty / unclean',
  'Other issue',
];

function IssueCard({
  booking,
  deskNumber,
  zone,
  studentName,
  studentEmail,
  onResolve,
}: {
  booking: Booking;
  deskNumber: string;
  zone: string;
  studentName: string;
  studentEmail: string;
  onResolve: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isResolved = booking.status === 'ended' || booking.status === 'expired';
  const ts = booking.endedAt ?? booking.startTime;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      isResolved ? 'border-slate-100 opacity-70' : 'border-amber-200'
    }`}>
      <div className="flex items-start gap-4 p-5">
        {/* Severity indicator */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isResolved ? 'bg-slate-100' : 'bg-amber-50'
        }`}>
          {isResolved
            ? <CheckCircle size={18} className="text-slate-400" />
            : <AlertTriangle size={18} className="text-[#f59e0b]" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-slate-800">Desk {deskNumber}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{zone}</span>
                {!isResolved && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-[#f59e0b] animate-pulse">
                    Needs Attention
                  </span>
                )}
                {isResolved && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#d1fae5] text-[#10b981]">
                    Session Ended
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1"><User size={10} />{studentName}</span>
                <span className="flex items-center gap-1"><Clock size={10} />{formatRelativeTime(ts)}</span>
              </div>
            </div>
          </div>

          {/* Issue text */}
          <div className="mt-3 flex items-start gap-2 bg-amber-50/60 rounded-xl px-3 py-2.5">
            <MessageSquare size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 leading-relaxed">{booking.issueReport}</p>
          </div>

          {/* Expanded student details */}
          {expanded && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 mb-1">Student</p>
                <p className="text-xs font-semibold text-slate-700">{studentName}</p>
                <p className="text-[10px] text-slate-400">{studentEmail}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 mb-1">Booking</p>
                <p className="text-[10px] font-mono text-slate-500 break-all">{booking.id}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium"
            >
              <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              {expanded ? 'Less details' : 'More details'}
            </button>

            {!isResolved && (
              <button
                onClick={onResolve}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#10b981] text-white text-xs font-bold hover:bg-emerald-600 transition-all"
              >
                <CheckCircle size={12} />
                Mark Resolved
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IssueReportsPage() {
  const { state, resetDesk } = useDeskGuard();
  const [tab, setTab] = useState<TabFilter>('unresolved');
  const [search, setSearch] = useState('');

  const getDesk = (deskId: string) => state.desks.find(d => d.id === deskId);
  const getUser = (userId: string) => state.users.find(u => u.id === userId);

  const allIssues: Booking[] = useMemo(() =>
    state.bookings
      .filter(b => b.issueReport)
      .sort((a, b) => (b.endedAt ?? b.startTime) - (a.endedAt ?? a.startTime)),
    [state.bookings]
  );

  const unresolvedIssues = allIssues.filter(b =>
    ['checked_in', 'away', 'booked'].includes(b.status)
  );
  const resolvedIssues = allIssues.filter(b =>
    ['ended', 'expired', 'abandoned'].includes(b.status)
  );

  const displayed = useMemo(() => {
    let list = tab === 'all' ? allIssues :
               tab === 'unresolved' ? unresolvedIssues : resolvedIssues;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => {
        const desk = getDesk(b.deskId);
        const user = getUser(b.userId);
        return (
          desk?.number.toLowerCase().includes(q) ||
          user?.name.toLowerCase().includes(q) ||
          b.issueReport?.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [tab, allIssues, unresolvedIssues, resolvedIssues, search]);

  const handleResolve = (booking: Booking) => {
    const desk = getDesk(booking.deskId);
    resetDesk(booking.id);
    toast.success(`Issue on Desk ${desk?.number} marked resolved & desk freed ✅`);
  };

  return (
    <AuthGuard requireRole="librarian">
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 space-y-5">

              {/* Header */}
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-black text-slate-800">Issue Reports</h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Desk issues reported by students during their sessions
                  </p>
                </div>
                {unresolvedIssues.length > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <AlertTriangle size={14} className="text-[#f59e0b]" />
                    <span className="text-sm font-bold text-[#f59e0b]">
                      {unresolvedIssues.length} need attention
                    </span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-slate-800">{allIssues.length}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Total Reports</p>
                </div>
                <div className="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-[#f59e0b]">{unresolvedIssues.length}</p>
                  <p className="text-xs text-amber-400 font-medium mt-0.5">Needs Attention</p>
                </div>
                <div className="bg-[#d1fae5]/50 rounded-2xl border border-[#10b981]/20 shadow-sm p-4 text-center">
                  <p className="text-2xl font-black text-[#10b981]">{resolvedIssues.length}</p>
                  <p className="text-xs text-[#10b981]/70 font-medium mt-0.5">Session Ended</p>
                </div>
              </div>

              {/* Tabs + Search */}
              <div className="flex gap-3 flex-wrap items-center">
                <div className="flex gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
                  {([
                    { key: 'unresolved', label: 'Needs Attention', count: unresolvedIssues.length },
                    { key: 'resolved', label: 'Session Ended', count: resolvedIssues.length },
                    { key: 'all', label: 'All', count: allIssues.length },
                  ] as const).map(({ key, label, count }) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        tab === key
                          ? 'bg-[#1e3a8a] text-white'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {label}
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tab === key ? 'bg-white/20' : 'bg-slate-100'
                      }`}>{count}</span>
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 min-w-40">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search desk, student, or issue…"
                    className="w-full h-9 pl-8 pr-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 focus:border-[#1e3a8a]"
                  />
                </div>
              </div>

              {/* Issue list */}
              {allIssues.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto">
                    <CheckCircle size={24} className="text-[#10b981]" />
                  </div>
                  <p className="text-base font-semibold text-slate-700">No issue reports yet</p>
                  <p className="text-sm text-slate-400">
                    Students can report desk issues from their My Session page.
                    Reports will appear here automatically.
                  </p>
                </div>
              ) : displayed.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
                  <XCircle size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No issues match your filter</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayed.map(booking => {
                    const desk = getDesk(booking.deskId);
                    const user = getUser(booking.userId);
                    if (!desk || !user) return null;
                    return (
                      <IssueCard
                        key={booking.id}
                        booking={booking}
                        deskNumber={desk.number}
                        zone={desk.zone}
                        studentName={user.name}
                        studentEmail={user.email}
                        onResolve={() => handleResolve(booking)}
                      />
                    );
                  })}
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
