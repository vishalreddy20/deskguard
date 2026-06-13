'use client';

import { Timer, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Booking } from '@/lib/types';
import { formatMMSS } from '@/lib/timerHelpers';
import { toast } from 'sonner';

interface StillHereModalProps {
  booking: Booking;
  deskNumber: string;
  onConfirm: () => void;
  onAbandoned: () => void;
}

// DEMO VALUE: 30 seconds auto-release countdown.
// PRODUCTION VALUE: 2 minutes (2 * 60 * 1000 ms).
const AUTO_RELEASE_DEMO_MS = 30 * 1000;

export default function StillHereModal({
  booking,
  deskNumber,
  onConfirm,
  onAbandoned,
}: StillHereModalProps) {
  const [remaining, setRemaining] = useState(AUTO_RELEASE_DEMO_MS);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(interval);
          toast.error(`Desk ${deskNumber} auto-released — you didn't respond in time`);
          onAbandoned();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [deskNumber, onAbandoned]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <Timer className="text-red-600" size={28} />
        </div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Still Here?</h2>
        </div>

        {/* Body */}
        <p className="text-sm text-slate-600 leading-relaxed">
          Tap below to confirm you&apos;re still using{' '}
          <span className="font-semibold text-slate-800">Desk {deskNumber}</span>.{' '}
          This prompt appears periodically to keep desks available for others.
        </p>

        {/* Confirm button */}
        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold hover:bg-[#1e40af] active:scale-[0.98] transition-all shadow-md"
        >
          Yes, I&apos;m Here
        </button>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-1.5 text-red-500">
          <Clock size={14} />
          <span className="text-sm font-mono font-semibold">
            Auto-release in {formatMMSS(remaining)}
          </span>
        </div>

        {/* Note */}
        <p className="text-xs text-slate-400">
          {/* DEMO: 30s countdown. PRODUCTION: 2 minutes */}
          Demo: 30-second response window · Production: 2 minutes
        </p>
      </div>
    </div>
  );
}
