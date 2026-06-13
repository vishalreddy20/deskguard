// ============================================================
// DeskGuard — localStorage Helpers
// ============================================================

import { User, Desk, Booking } from './types';

const KEYS = {
  USERS: 'deskguard_users',
  DESKS: 'deskguard_desks',
  BOOKINGS: 'deskguard_bookings',
  CURRENT_USER: 'deskguard_current_user',
  LAST_SEEN_ABANDONED: 'deskguard_last_seen_abandoned',
} as const;

// Generic helpers
function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error(`DeskGuard: failed to write "${key}" to localStorage`);
  }
}

// Users
export const getUsers = (): User[] => getItem<User[]>(KEYS.USERS) ?? [];
export const saveUsers = (users: User[]): void => setItem(KEYS.USERS, users);

// Desks
export const getDesks = (): Desk[] => getItem<Desk[]>(KEYS.DESKS) ?? [];
export const saveDesks = (desks: Desk[]): void => setItem(KEYS.DESKS, desks);

// Bookings
export const getBookings = (): Booking[] =>
  getItem<Booking[]>(KEYS.BOOKINGS) ?? [];
export const saveBookings = (bookings: Booking[]): void =>
  setItem(KEYS.BOOKINGS, bookings);

// Session
export const getCurrentUser = (): User | null =>
  getItem<User>(KEYS.CURRENT_USER);
export const saveCurrentUser = (user: User | null): void =>
  setItem(KEYS.CURRENT_USER, user);
export const clearCurrentUser = (): void => {
  if (typeof window !== 'undefined') localStorage.removeItem(KEYS.CURRENT_USER);
};

// Librarian meta
export const getLastSeenAbandonedCount = (): number =>
  getItem<number>(KEYS.LAST_SEEN_ABANDONED) ?? 0;
export const saveLastSeenAbandonedCount = (count: number): void =>
  setItem(KEYS.LAST_SEEN_ABANDONED, count);

// Utility: check if desks have been seeded
export const isDesksSeeded = (): boolean => getDesks().length > 0;
