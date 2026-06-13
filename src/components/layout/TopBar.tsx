'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, User, LogOut, Settings, ChevronDown, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useDeskGuard } from '@/context/DeskGuardContext';
import { toast } from 'sonner';

// Sample notifications — in production these come from the DB
const SAMPLE_NOTIFICATIONS = [
  {
    id: '1',
    type: 'success' as const,
    title: 'Booking Confirmed',
    body: 'Your desk session is active and running.',
    time: 'Just now',
    read: false,
  },
  {
    id: '2',
    type: 'warning' as const,
    title: 'Session Expiring Soon',
    body: 'Your desk session expires in 15 minutes.',
    time: '5m ago',
    read: false,
  },
  {
    id: '3',
    type: 'info' as const,
    title: 'Desk Available',
    body: 'A Silent Zone desk is now available.',
    time: '12m ago',
    read: true,
  },
];

const NOTIFICATION_ICONS = {
  success: <CheckCircle size={14} className="text-[#10b981]" />,
  warning: <AlertTriangle size={14} className="text-[#f59e0b]" />,
  info: <Clock size={14} className="text-[#1e3a8a]" />,
};

export default function TopBar() {
  const { state, logout } = useDeskGuard();
  const router = useRouter();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [searchValue, setSearchValue] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const initials = state.currentUser?.name
    ? state.currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    setShowProfile(false);
    logout();
    toast.success('Signed out successfully.');
    router.replace('/login');
  };

  const handleProfileClick = () => {
    setShowProfile((v) => !v);
    setShowNotifications(false);
  };

  const handleBellClick = () => {
    setShowNotifications((v) => !v);
    setShowProfile(false);
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 lg:px-6 bg-white border-b border-slate-100 sticky top-0 z-30">
      {/* Left: spacer for mobile hamburger */}
      <div className="lg:hidden w-10" />

      {/* Search */}
      <div className="flex-1 max-w-md mx-auto lg:mx-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search zone or desk..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 focus:border-[#1e3a8a] transition-all"
          />
        </div>
      </div>

      {/* Right: notifications + profile */}
      <div className="flex items-center gap-1 ml-4">

        {/* ── Notification Bell ── */}
        <div ref={notifRef} className="relative">
          <button
            id="notif-bell"
            onClick={handleBellClick}
            className={`relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-all ${showNotifications ? 'bg-slate-100' : ''}`}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-[#1e3a8a] font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                    className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${!n.read ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.type === 'success' ? 'bg-emerald-100' :
                      n.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      {NOTIFICATION_ICONS[n.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-800 truncate">{n.title}</p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-[#1e3a8a] flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>

              {notifications.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-400">No notifications</div>
              )}
            </div>
          )}
        </div>

        {/* ── Profile Avatar + Dropdown ── */}
        <div ref={profileRef} className="relative">
          <button
            id="profile-menu"
            onClick={handleProfileClick}
            className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-all ${showProfile ? 'bg-slate-100' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Profile dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User info */}
              <div className="px-4 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1e3a8a] flex items-center justify-center text-white text-sm font-bold">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{state.currentUser?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{state.currentUser?.email}</p>
                    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 ${
                      state.currentUser?.role === 'librarian'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-[#1e3a8a]'
                    }`}>
                      {state.currentUser?.role === 'librarian' ? 'Librarian' : 'Student'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-2">
                <button
                  onClick={() => { setShowProfile(false); router.push('/my-bookings'); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                >
                  <User size={15} className="text-slate-400" />
                  My Bookings
                </button>
                <button
                  onClick={() => { setShowProfile(false); toast.info('Settings coming soon!'); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left"
                >
                  <Settings size={15} className="text-slate-400" />
                  Settings
                </button>

                <div className="h-px bg-slate-100 my-1.5" />

                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
