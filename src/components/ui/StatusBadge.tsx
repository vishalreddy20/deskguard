import { DeskStatus, BookingStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: DeskStatus | BookingStatus;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  available: { label: 'Available', dot: 'bg-[#10b981]', bg: 'bg-[#d1fae5]', text: 'text-[#10b981]' },
  occupied: { label: 'Occupied', dot: 'bg-[#dc2626]', bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]' },
  away: { label: 'Away', dot: 'bg-[#f59e0b]', bg: 'bg-[#fef3c7]', text: 'text-[#f59e0b]' },
  booked: { label: 'Booked', dot: 'bg-[#1e40af]', bg: 'bg-blue-100', text: 'text-[#1e40af]' },
  checked_in: { label: 'Checked In', dot: 'bg-[#10b981]', bg: 'bg-[#d1fae5]', text: 'text-[#10b981]' },
  ended: { label: 'Ended', dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-500' },
  expired: { label: 'Expired', dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-500' },
  abandoned: { label: 'Abandoned', dot: 'bg-[#dc2626]', bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]' },
  warning: { label: 'Warning', dot: 'bg-[#f59e0b]', bg: 'bg-[#fef3c7]', text: 'text-[#f59e0b]' },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
