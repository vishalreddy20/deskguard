'use client';

import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { BookOpen, Wifi, Zap, Coffee, Headphones } from 'lucide-react';

const resources = [
  {
    icon: Wifi,
    title: 'High-Speed WiFi',
    description: 'All desks have access to 1Gbps campus WiFi. Connect to "CentralLib-5G" using your student ID.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Zap,
    title: 'Power Outlets',
    description: 'Every desk has a dual power outlet and USB-A/C charging ports built in.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Headphones,
    title: 'Noise-Cancelling Pods',
    description: 'Available at the front desk on loan for 2-hour periods. ID required.',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: Coffee,
    title: 'Café Access',
    description: 'DeskGuard users get 10% off at the library café. Show your booking QR at checkout.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
];

export default function ResourcesPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Resources</h1>
              <p className="text-sm text-slate-500 mt-0.5">Library facilities and services available to all desk users</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map(({ icon: Icon, title, description, color, bg }) => (
                <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex gap-4">
                  <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={22} className={color} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
