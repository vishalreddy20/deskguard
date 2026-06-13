// ============================================================
// DeskGuard — Timer Helper Functions (Pure Functions)
//
// NOTE: In production, this logic runs server-side via a scheduled job
// (e.g., Supabase Edge Function / cron) every 1 minute, using server
// timestamps as source of truth. Client-side intervals here simulate
// that behavior for demo purposes.
// ============================================================

import { Booking } from './types';

/**
 * Checks whether a session has expired based on expiresAt timestamp.
 * Production: called by server cron every 1 min.
 * Demo: called every 10s via setInterval in /my-bookings.
 */
export function checkExpiry(booking: Booking, now: number): boolean {
  return (
    (booking.status === 'checked_in' || booking.status === 'away') &&
    now >= booking.expiresAt
  );
}

/**
 * Checks whether an "away" status has exceeded the 20-minute limit.
 * Production: called by server cron every 1 min.
 * Demo: called every 10s via setInterval in /my-bookings.
 */
export function checkAwayTimeout(booking: Booking, now: number): boolean {
  const AWAY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
  return (
    booking.status === 'away' &&
    booking.awayStartedAt !== null &&
    now - booking.awayStartedAt >= AWAY_TIMEOUT_MS
  );
}

/**
 * Checks whether a user needs to confirm their presence.
 *
 * DEMO VALUE: 2 minutes (so judges can trigger it live within the demo window).
 * PRODUCTION VALUE: 2 hours (2 * 60 * 60 * 1000 ms).
 *
 * Production: called by server cron every 1 min, sends push notification.
 * Demo: called every 10s via setInterval in /my-bookings.
 */
export function checkStillHere(booking: Booking, now: number): boolean {
  const DEMO_STILL_HERE_THRESHOLD_MS = 2 * 60 * 1000; // 2 min (demo)
  // const PRODUCTION_STILL_HERE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours (production)
  return (
    booking.status === 'checked_in' &&
    !booking.needsConfirmation &&
    now - booking.lastConfirmedAt >= DEMO_STILL_HERE_THRESHOLD_MS
  );
}

/**
 * Formats a duration in ms as a countdown string "Xh Ym Zs"
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0h 0m 0s';
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Formats MM:SS for modal countdowns
 */
export function formatMMSS(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Formats a relative time string (e.g. "5m ago", "2h ago")
 */
export function formatRelativeTime(ts: number | null): string {
  if (!ts) return 'Unknown';
  const diffMs = Date.now() - ts;
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h ${diffMins % 60}m ago`;
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
