'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useDeskGuard } from '@/context/DeskGuardContext';
import { toast } from 'sonner';

type CheckInState = 'idle' | 'success' | 'error';

export default function CheckInPage() {
  const { state, updateBooking, getDeskById } = useDeskGuard();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [checkInState, setCheckInState] = useState<CheckInState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [checkedInDesk, setCheckedInDesk] = useState('');
  const [checkedInTime, setCheckedInTime] = useState('');

  const handleCheckIn = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your booking code.');
      setCheckInState('error');
      return;
    }

    if (!state.currentUser) {
      setErrorMsg('You must be logged in.');
      setCheckInState('error');
      return;
    }

    const booking = state.bookings.find((b) => b.id === trimmed);

    if (!booking) {
      setErrorMsg('Booking code not found. Please double-check and try again.');
      setCheckInState('error');
      return;
    }

    if (booking.userId !== state.currentUser.id) {
      setErrorMsg('This booking belongs to a different user.');
      setCheckInState('error');
      return;
    }

    if (booking.status === 'checked_in') {
      setErrorMsg('You are already checked in to this desk.');
      setCheckInState('error');
      return;
    }

    if (booking.status !== 'booked') {
      setErrorMsg(`This booking is no longer active (status: ${booking.status}).`);
      setCheckInState('error');
      return;
    }

    const now = Date.now();
    updateBooking({ id: booking.id, status: 'checked_in', lastConfirmedAt: now });

    const desk = getDeskById(booking.deskId);
    const deskNum = desk?.number ?? booking.deskId;
    const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setCheckedInDesk(deskNum);
    setCheckedInTime(timeStr);
    setCheckInState('success');
    toast.success(`Desk ${deskNum} checked in successfully!`);
  };

  return (
    <AuthGuard requireRole="student">
      <div className="flex h-screen bg-[#f8fafc]">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />

          <main className="flex-1 overflow-y-auto flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              {checkInState === 'success' ? (
                /* Success state */
                <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-8 text-center space-y-5">
                  <div className="relative inline-flex">
                    <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                      <QrCode size={36} className="text-slate-400" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center shadow-md">
                      <CheckCircle size={18} className="text-white" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Desk {checkedInDesk} Checked In</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Session started at <span className="font-semibold text-slate-700">{checkedInTime}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => router.push('/my-bookings')}
                    className="w-full py-3 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1e40af] transition-all shadow-md"
                  >
                    Go to My Session <ArrowRight size={16} />
                  </button>

                  <button
                    onClick={() => { setCheckInState('idle'); setCode(''); setErrorMsg(''); }}
                    className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Check in another desk
                  </button>
                </div>
              ) : (
                /* Input state */
                <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                      <QrCode size={26} className="text-[#1e3a8a]" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Check In to Your Desk</h1>
                    <p className="text-sm text-slate-500">
                      Enter the booking code from your confirmation screen
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="desk-code" className="text-sm font-semibold text-slate-700">
                      Enter Desk Code
                    </label>
                    <input
                      id="desk-code"
                      type="text"
                      value={code}
                      onChange={(e) => { setCode(e.target.value); setCheckInState('idle'); setErrorMsg(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
                      placeholder="booking-xxxxxxxx-xxxxxx"
                      className={`w-full h-11 px-4 rounded-xl border text-sm font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30 ${
                        checkInState === 'error' ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-[#1e3a8a]'
                      }`}
                    />
                    {checkInState === 'error' && errorMsg && (
                      <div className="flex items-start gap-2 text-red-500 text-sm">
                        <XCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                  </div>

                  <button
                    id="checkin-submit"
                    onClick={handleCheckIn}
                    className="w-full py-3 rounded-xl bg-[#1e3a8a] text-white text-sm font-semibold hover:bg-[#1e40af] active:scale-[0.98] transition-all shadow-md"
                  >
                    Check In
                  </button>

                  <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                    <p className="text-xs font-semibold text-slate-600">💡 Demo Tip</p>
                    <p className="text-xs text-slate-500">
                      After booking a desk, copy the code from the confirmation modal and paste it here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
