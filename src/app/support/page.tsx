'use client';

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import {
  HelpCircle, Mail, Phone, ChevronDown, ChevronUp,
  MessageCircle, Clock, BookOpen, AlertCircle, Wifi,
  Timer, LifeBuoy, Sparkles,
} from 'lucide-react';

// ── FAQ Data ─────────────────────────────────────────────────
const FAQS = [
  {
    category: 'Booking',
    icon: BookOpen,
    color: 'text-[#1e3a8a]',
    bg: 'bg-blue-50',
    items: [
      {
        q: 'How long can I book a desk for?',
        a: 'You can book a desk for 1, 2, or 3 hours at a time. Select your preferred duration when confirming a booking from the Floor Map.',
      },
      {
        q: 'Can I extend my session?',
        a: 'Session extension is not currently available. If you need more time, you can re-book a desk after your session ends — provided it is still available.',
      },
      {
        q: 'Can I book multiple desks at once?',
        a: 'No. DeskGuard allows one active desk booking per student at a time to ensure fair access for everyone.',
      },
      {
        q: 'How do I check in to my booked desk?',
        a: 'After booking, you will receive a unique booking code. Go to the Check In page and enter this code (or scan the QR code) to activate your session. You must check in within 15 minutes of booking or your slot may be released.',
      },
    ],
  },
  {
    category: 'Away & Timers',
    icon: Timer,
    color: 'text-[#f59e0b]',
    bg: 'bg-amber-50',
    items: [
      {
        q: 'What happens if I go away temporarily?',
        a: "Tap \"I'm Away\" on the My Session page. You have a 20-minute grace period. If you don't return within 20 minutes, your desk will be automatically released to other students.",
      },
      {
        q: 'Does the session timer pause when I am away?',
        a: 'No — and this is intentional. Your session countdown continues while you are away. This prevents desk hoarding. The 20-minute away timer is a separate grace period for short breaks.',
      },
      {
        q: 'Why was my desk released automatically?',
        a: "DeskGuard periodically checks your presence. If you miss the \"Still Here?\" confirmation prompt or exceed 20 minutes in away mode, your desk is freed for other students.",
      },
    ],
  },
  {
    category: 'Technical Issues',
    icon: Wifi,
    color: 'text-[#10b981]',
    bg: 'bg-emerald-50',
    items: [
      {
        q: 'My booking code is not working at check-in. What do I do?',
        a: 'Ensure you are entering the exact code shown after booking (including any hyphens). If the issue persists, your session may have expired — please re-book from the Floor Map.',
      },
      {
        q: 'The floor map is not showing available desks.',
        a: 'Try refreshing the page. All desk status data is stored locally in your browser. If the issue persists, clear your browser cache or contact library staff.',
      },
      {
        q: 'I ended my session but the desk still shows as occupied.',
        a: 'This is a display refresh issue. Try navigating away and returning to the Floor Map. If it persists for more than 5 minutes, contact library staff using the details below.',
      },
    ],
  },
];

// ── Accordion Item ───────────────────────────────────────────
function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
        open ? 'border-[#1e3a8a]/30 shadow-sm' : 'border-slate-100'
      }`}
      onClick={() => setOpen((v) => !v)}
    >
      <div className={`flex items-start justify-between gap-3 px-4 py-3.5 ${open ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'} transition-colors`}>
        <p className={`text-sm font-semibold leading-snug ${open ? 'text-[#1e3a8a]' : 'text-slate-700'}`}>{q}</p>
        <div className="flex-shrink-0 mt-0.5">
          {open
            ? <ChevronUp size={16} className="text-[#1e3a8a]" />
            : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-blue-50/30 border-t border-[#1e3a8a]/10">
          <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function SupportPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 space-y-8">

              {/* ── Hero header ── */}
              <div className="bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl p-6 text-white relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
                <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full" />

                <div className="relative flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                        <LifeBuoy size={20} className="text-white" />
                      </div>
                      <h1 className="text-2xl font-bold">Support Centre</h1>
                    </div>
                    <p className="text-blue-200 text-sm max-w-md leading-relaxed">
                      Need help with your desk booking? Browse our FAQs below or reach out
                      directly — we&apos;re here to help.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs bg-white/15 px-3 py-1.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    Library Staff Available
                  </div>
                </div>

                {/* Quick contact row inside hero */}
                <div className="relative mt-5 grid grid-cols-2 gap-3">
                  <a
                    href="tel:+917997998995"
                    className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors">
                      <Phone size={15} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-blue-200 font-medium uppercase tracking-wide">Call Us</p>
                      <p className="text-sm font-bold text-white tracking-wide">+91 7997998995</p>
                    </div>
                  </a>
                  <a
                    href="mailto:vd0602@srmist.edu.in"
                    className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 group-hover:bg-white/25 transition-colors">
                      <Mail size={15} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-blue-200 font-medium uppercase tracking-wide">Email Us</p>
                      <p className="text-sm font-bold text-white truncate">vd0602@srmist.edu.in</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* ── Contact cards ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                {/* Phone */}
                <a
                  href="tel:+917997998995"
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#1e3a8a]/30 transition-all p-5 flex flex-col gap-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#1e3a8a] flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-blue-200">
                    <Phone size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                    <p className="text-base font-bold text-slate-800 group-hover:text-[#1e3a8a] transition-colors">
                      +91 7997998995
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock size={11} />
                      Mon–Sat, 9 AM – 6 PM IST
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#1e3a8a] flex items-center gap-1 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    Tap to call →
                  </span>
                </a>

                {/* Email */}
                <a
                  href="mailto:vd0602@srmist.edu.in"
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-5 flex flex-col gap-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#10b981] flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-emerald-200">
                    <Mail size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p>
                    <p className="text-sm font-bold text-slate-800 break-all group-hover:text-[#10b981] transition-colors">
                      vd0602@srmist.edu.in
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock size={11} />
                      Response within 24 hours
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#10b981] flex items-center gap-1 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    Tap to email →
                  </span>
                </a>

                {/* Live Chat — Coming Soon */}
                <div className="relative bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm p-5 flex flex-col gap-3 overflow-hidden">
                  {/* Coming Soon ribbon */}
                  <div className="absolute top-3 right-3">
                    <span className="flex items-center gap-1 text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      <Sparkles size={9} />
                      Coming Soon
                    </span>
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                    <MessageCircle size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Live Chat</p>
                    <p className="text-sm font-bold text-slate-400">Chat with Staff</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Real-time chat support is a planned feature and will be available in a future update.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Operating Hours ── */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Clock size={16} className="text-[#1e3a8a]" />
                  </div>
                  <h2 className="text-base font-bold text-slate-800">Library Support Hours</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { day: 'Monday – Friday', hours: '8:00 AM – 8:00 PM', available: true },
                    { day: 'Saturday', hours: '9:00 AM – 6:00 PM', available: true },
                    { day: 'Sunday', hours: '10:00 AM – 4:00 PM', available: true },
                    { day: 'Public Holidays', hours: 'Closed', available: false },
                  ].map(({ day, hours, available }) => (
                    <div key={day} className={`rounded-xl p-3 ${available ? 'bg-slate-50' : 'bg-red-50'}`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{day}</p>
                      <p className={`text-sm font-bold mt-1 ${available ? 'text-slate-700' : 'text-[#dc2626]'}`}>{hours}</p>
                      <div className={`flex items-center gap-1 mt-1.5 ${available ? 'text-[#10b981]' : 'text-[#dc2626]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-[#10b981]' : 'bg-[#dc2626]'}`} />
                        <span className="text-[10px] font-medium">{available ? 'Open' : 'Closed'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── FAQ Sections ── */}
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <HelpCircle size={16} className="text-[#1e3a8a]" />
                  </div>
                  <h2 className="text-base font-bold text-slate-800">Frequently Asked Questions</h2>
                </div>

                {FAQS.map(({ category, icon: CatIcon, color, bg, items }) => (
                  <div key={category} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Category header */}
                    <div className={`px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5`}>
                      <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                        <CatIcon size={14} className={color} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700">{category}</h3>
                      <span className="ml-auto text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {items.length} questions
                      </span>
                    </div>

                    {/* FAQ items */}
                    <div className="p-4 space-y-2">
                      {items.map(({ q, a }) => (
                        <AccordionItem key={q} q={q} a={a} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Still need help? ── */}
              <div className="bg-gradient-to-r from-[#d1fae5] to-[#e0f2fe] rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={18} className="text-[#1e3a8a]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">Still need help?</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    If your issue is not covered above, please contact us directly by phone or email.
                    Library staff are available during operating hours.
                  </p>
                </div>
                <div className="hidden sm:flex flex-col gap-2 flex-shrink-0">
                  <a
                    href="tel:+917997998995"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#1e3a8a] bg-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <Phone size={12} /> +91 7997998995
                  </a>
                  <a
                    href="mailto:vd0602@srmist.edu.in"
                    className="flex items-center gap-1.5 text-xs font-bold text-[#10b981] bg-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <Mail size={12} /> vd0602@srmist.edu.in
                  </a>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
