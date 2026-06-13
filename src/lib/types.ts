// ============================================================
// DeskGuard — TypeScript Types
// ============================================================

export type UserRole = 'student' | 'librarian';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // stored in plain text for demo only; use bcrypt in production
  role: UserRole;
  createdAt: number;
}

export type DeskStatus = 'available' | 'occupied' | 'away';

export type DeskZone = 'Zone A' | 'Zone B' | 'Silent Zone';

export interface Desk {
  id: string;
  number: string; // e.g. "A-01", "B-01", "S-01"
  zone: DeskZone;
  status: DeskStatus;
  amenities: string[];
}

export type BookingStatus =
  | 'booked'
  | 'checked_in'
  | 'away'
  | 'ended'
  | 'expired'
  | 'abandoned';

export interface Booking {
  id: string;
  deskId: string;
  userId: string;
  status: BookingStatus;
  startTime: number;
  expiresAt: number;
  lastConfirmedAt: number;
  awayStartedAt: number | null;
  needsConfirmation: boolean;
  durationHours: number;
  // ── History fields (populated when session ends) ──
  endedAt?: number;           // actual end timestamp
  totalAwayMs?: number;       // accumulated away time in ms
  issueReport?: string;       // optional issue report text
}

export interface DeskGuardState {
  users: User[];
  desks: Desk[];
  bookings: Booking[];
  currentUser: User | null;
}

export type DeskGuardAction =
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'SEED_DESKS'; payload: Desk[] }
  | { type: 'UPDATE_DESK_STATUS'; payload: { deskId: string; status: DeskStatus } }
  | { type: 'ADD_BOOKING'; payload: Booking }
  | { type: 'UPDATE_BOOKING'; payload: Partial<Booking> & { id: string } }
  | { type: 'FREE_DESK'; payload: { deskId: string; bookingId: string; endedAt: number; totalAwayMs: number } }
  | { type: 'RESET_STATE'; payload: DeskGuardState };
