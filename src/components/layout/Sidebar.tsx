'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Map,
  CalendarDays,
  BookOpen,
  HelpCircle,
  Plus,
  BarChart3,
  X,
  Menu,
  LogOut,
  QrCode,
  History,
} from 'lucide-react';
import { useDeskGuard } from '@/context/DeskGuardContext';
import { useState } from 'react';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const STUDENT_NAV: NavItem[] = [
  { label: 'Floor Map', href: '/dashboard', icon: Map },
  { label: 'My Bookings', href: '/my-bookings', icon: CalendarDays },
  { label: 'History', href: '/history', icon: History },
  { label: 'Check In', href: '/checkin', icon: QrCode },
  { label: 'Resources', href: '/resources', icon: BookOpen },
  { label: 'Support', href: '/support', icon: HelpCircle },
];

const LIBRARIAN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/librarian', icon: BarChart3 },
  { label: 'Live Sessions', href: '/librarian/sessions', icon: CalendarDays },
  { label: 'Floor Monitor', href: '/librarian/floor', icon: Map },
  { label: 'Issue Reports', href: '/librarian/issues', icon: HelpCircle },
  { label: 'Check-In Support', href: '/librarian/checkin-support', icon: QrCode },
];

export default function Sidebar() {
  const { state, logout } = useDeskGuard();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = state.currentUser?.role === 'librarian' ? LIBRARIAN_NAV : STUDENT_NAV;

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully.');
    router.replace('/login');
  };

  const initials = state.currentUser?.name
    ? state.currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <Link
            href={state.currentUser?.role === 'librarian' ? '/librarian' : '/dashboard'}
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1e3a8a] flex items-center justify-center">
                <span className="text-white text-xs font-black">DG</span>
              </div>
              <span className="text-lg font-black text-[#1e3a8a] tracking-tight">DeskGuard</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 ml-9">Central Library</p>
      </div>

      {/* User card */}
      <div className="mx-3 mt-3 mb-1 bg-slate-50 rounded-xl p-3 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-[#1e3a8a] flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">
            {state.currentUser?.name ?? 'Guest'}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {state.currentUser?.email}
          </p>
        </div>
        <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
          state.currentUser?.role === 'librarian'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-blue-100 text-[#1e3a8a]'
        }`}>
          {state.currentUser?.role === 'librarian' ? 'Staff' : 'Student'}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                active
                  ? 'bg-[#d1fae5] text-[#10b981] font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon
                size={17}
                className={`transition-transform group-hover:scale-110 ${
                  active ? 'text-[#10b981]' : 'text-slate-400'
                }`}
              />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 pt-2 border-t border-slate-100 space-y-2 mt-2">
        {state.currentUser?.role === 'student' && (
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#1e3a8a] text-white text-sm font-bold hover:bg-[#1e40af] active:scale-[0.97] transition-all shadow-md shadow-blue-200"
          >
            <Plus size={16} />
            Book a Desk
          </Link>
        )}

        {/* Prominent logout button */}
        <button
          id="sidebar-logout"
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-all group"
        >
          <LogOut size={16} className="group-hover:text-red-500 transition-colors" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 rounded-xl bg-white shadow-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-white border-r border-slate-100 h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
