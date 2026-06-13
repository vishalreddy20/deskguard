'use client';

import { Desk, DeskStatus } from '@/lib/types';

interface DeskCardProps {
  desk: Desk;
  isSelected: boolean;
  onClick: (desk: Desk) => void;
}

const STATUS_STYLES: Record<DeskStatus, { card: string; hover: string }> = {
  available: {
    card: 'bg-[#d1fae5] border-[#10b981] text-[#10b981]',
    hover: 'hover:scale-110 hover:shadow-lg hover:shadow-emerald-200 hover:bg-[#a7f3d0] cursor-pointer',
  },
  occupied: {
    card: 'bg-[#fee2e2] border-[#dc2626] text-[#dc2626]',
    hover: 'hover:scale-105 hover:shadow-md hover:shadow-red-100 cursor-pointer',
  },
  away: {
    card: 'bg-[#fef3c7] border-[#f59e0b] text-[#f59e0b]',
    hover: 'hover:scale-105 hover:shadow-md hover:shadow-amber-100 cursor-pointer',
  },
};

const SELECTED_STYLE = {
  card: 'bg-[#1e3a8a] border-[#1e3a8a] text-white shadow-lg shadow-blue-300',
  hover: 'cursor-pointer scale-110',
};

// Strip zone prefix: A-01 → 01, B-05 → 05, S-03 → S3
function getDeskLabel(number: string): string {
  // For silent zone, show "S" + number e.g. S-01 → S1
  if (number.startsWith('S-')) {
    return 'S' + number.slice(2).replace(/^0/, '');
  }
  // Zone A/B: A-01 → 01
  return number.replace(/^[A-Z]-0?/, '');
}

export default function DeskCard({ desk, isSelected, onClick }: DeskCardProps) {
  const styles = isSelected ? SELECTED_STYLE : STATUS_STYLES[desk.status];

  const statusLabel =
    desk.status === 'available' ? 'Click to book' :
    desk.status === 'away' ? 'Temporarily away' : 'Occupied';

  return (
    <button
      onClick={() => onClick(desk)}
      title={`Desk ${desk.number} — ${statusLabel}`}
      aria-label={`Desk ${desk.number} ${desk.status}`}
      className={`
        w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center
        text-[11px] font-bold transition-all duration-200 select-none
        active:scale-95
        ${styles.card} ${styles.hover}
      `}
    >
      <span className="leading-tight">{getDeskLabel(desk.number)}</span>
      {desk.status === 'away' && (
        <span className="text-[8px] leading-tight opacity-70 mt-0.5">away</span>
      )}
    </button>
  );
}
