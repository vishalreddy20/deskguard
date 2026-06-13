'use client';

import { X, Monitor, Copy, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Booking, Desk } from '@/lib/types';
import { toast } from 'sonner';

interface BookingModalProps {
  booking: Booking;
  desk: Desk;
  onClose: () => void;
  onGoToCheckin: () => void;
}

export default function BookingModal({
  booking,
  desk,
  onClose,
  onGoToCheckin,
}: BookingModalProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(booking.id);
    setCopied(true);
    toast.success('Booking code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const expiresAt = new Date(booking.expiresAt);
  const timeStr = expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto mb-3">
            <Monitor className="text-[#10b981]" size={22} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Booking Confirmed!</h2>
          <p className="text-sm text-slate-500">
            Desk <span className="font-semibold text-slate-700">{desk.number}</span> · {desk.zone}
          </p>
          <p className="text-xs text-slate-400">Session until {timeStr}</p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <QRCodeSVG
              value={booking.id}
              size={160}
              fgColor="#1e3a8a"
              level="M"
              includeMargin={false}
            />
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Show this code at the desk scanner — or copy the code below for manual check-in
        </p>

        {/* Code display */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-2">
          <code className="text-xs text-slate-600 font-mono truncate flex-1">{booking.id}</code>
          <button
            onClick={copyCode}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            {copied ? (
              <CheckCircle size={14} className="text-[#10b981]" />
            ) : (
              <Copy size={14} className="text-slate-500" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={onGoToCheckin}
            className="w-full py-2.5 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold hover:bg-[#1e40af] active:scale-[0.98] transition-all"
          >
            Go to Check-In
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
