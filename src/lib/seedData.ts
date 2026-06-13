// ============================================================
// DeskGuard — Initial Desk Seed Data
// 50 desks: 24 Zone A, 16 Zone B, 10 Silent Zone
// Seeded with ~60% available, ~30% occupied, ~10% away
// ============================================================

import { Desk, DeskStatus, DeskZone } from './types';

function makeDesk(
  id: string,
  number: string,
  zone: DeskZone,
  status: DeskStatus,
): Desk {
  return {
    id,
    number,
    zone,
    status,
    amenities: ['Power Outlet', 'High-Speed WiFi'],
  };
}

// Deterministic seed pattern for demo realism
const ZONE_A_STATUSES: DeskStatus[] = [
  'available', 'occupied', 'occupied', 'available', 'away', 'available',
  'available', 'available', 'available', 'occupied', 'available', 'occupied',
  'available', 'available', 'away', 'available', 'occupied', 'available',
  'available', 'available', 'available', 'occupied', 'available', 'available',
];

const ZONE_B_STATUSES: DeskStatus[] = [
  'available', 'occupied', 'available', 'available',
  'away', 'available', 'occupied', 'available',
  'available', 'available', 'occupied', 'available',
  'available', 'away', 'available', 'available',
];

const SILENT_STATUSES: DeskStatus[] = [
  'occupied', 'occupied', 'available', 'occupied',
  'away', 'occupied', 'occupied', 'available',
  'available', 'available',
];

export function generateSeedDesks(): Desk[] {
  const desks: Desk[] = [];

  // Zone A — 24 desks
  for (let i = 1; i <= 24; i++) {
    const num = String(i).padStart(2, '0');
    desks.push(makeDesk(`A-${num}`, `A-${num}`, 'Zone A', ZONE_A_STATUSES[i - 1]));
  }

  // Zone B — 16 desks
  for (let i = 1; i <= 16; i++) {
    const num = String(i).padStart(2, '0');
    desks.push(makeDesk(`B-${num}`, `B-${num}`, 'Zone B', ZONE_B_STATUSES[i - 1]));
  }

  // Silent Zone — 10 desks
  for (let i = 1; i <= 10; i++) {
    const num = String(i).padStart(2, '0');
    desks.push(makeDesk(`S-${num}`, `S-${num}`, 'Silent Zone', SILENT_STATUSES[i - 1]));
  }

  return desks;
}

export const ZONE_DESCRIPTIONS: Record<string, string> = {
  'Zone A': 'Main Collaborative Area — moderate noise level permitted.',
  'Zone B': 'General Study Area — quiet conversation allowed.',
  'Silent Zone': 'Strict silence required. No phone calls or group discussions.',
};
