'use client';

// ============================================================
// DeskGuard — Global Context
// Manages: users, desks, bookings, currentUser
// All state synced to localStorage via useEffect
// ============================================================

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';
import {
  DeskGuardState,
  DeskGuardAction,
  User,
  Desk,
  Booking,
  DeskStatus,
} from '@/lib/types';
import {
  getUsers,
  saveUsers,
  getDesks,
  saveDesks,
  getBookings,
  saveBookings,
  getCurrentUser,
  saveCurrentUser,
  isDesksSeeded,
} from '@/lib/storage';
import { generateSeedDesks } from '@/lib/seedData';

// ─────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────

function reducer(state: DeskGuardState, action: DeskGuardAction): DeskGuardState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };

    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };

    case 'SEED_DESKS':
      return { ...state, desks: action.payload };

    case 'UPDATE_DESK_STATUS':
      return {
        ...state,
        desks: state.desks.map((d) =>
          d.id === action.payload.deskId
            ? { ...d, status: action.payload.status }
            : d,
        ),
      };

    case 'ADD_BOOKING':
      return { ...state, bookings: [...state.bookings, action.payload] };

    case 'UPDATE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === action.payload.id ? { ...b, ...action.payload } : b,
        ),
      };

    case 'FREE_DESK':
      return {
        ...state,
        desks: state.desks.map((d) =>
          d.id === action.payload.deskId ? { ...d, status: 'available' } : d,
        ),
        bookings: state.bookings.map((b) =>
          b.id === action.payload.bookingId
            ? {
                ...b,
                status: 'ended' as const,
                endedAt: action.payload.endedAt,
                totalAwayMs: action.payload.totalAwayMs,
              }
            : b,
        ),
      };

    case 'RESET_STATE':
      return action.payload;

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────
// Context Shape
// ─────────────────────────────────────────────────────────

interface DeskGuardContextValue {
  state: DeskGuardState;
  dispatch: React.Dispatch<DeskGuardAction>;
  // Convenience helpers
  login: (email: string, password: string) => { ok: boolean; error?: string };
  signup: (name: string, email: string, password: string, role: 'student' | 'librarian') => { ok: boolean; error?: string };
  logout: () => void;
  bookDesk: (deskId: string, durationHours: number) => { ok: boolean; booking?: Booking; error?: string };
  getActiveBooking: (userId: string) => Booking | undefined;
  getDeskById: (id: string) => Desk | undefined;
  freeDesk: (bookingId: string) => void;
  updateBooking: (partial: Partial<Booking> & { id: string }) => void;
  updateDeskStatus: (deskId: string, status: DeskStatus) => void;
  resetDesk: (bookingId: string) => void;
  getUserBookings: (userId: string) => Booking[];
  recordIssue: (bookingId: string, report: string) => void;
}

const DeskGuardContext = createContext<DeskGuardContextValue | null>(null);

// ─────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────

export function DeskGuardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    users: [],
    desks: [],
    bookings: [],
    currentUser: null,
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    const users = getUsers();
    const bookings = getBookings();
    const currentUser = getCurrentUser();

    let desks = getDesks();
    if (!isDesksSeeded()) {
      desks = generateSeedDesks();
      saveDesks(desks);
    }

    dispatch({
      type: 'RESET_STATE',
      payload: { users, desks, bookings, currentUser },
    });
  }, []);

  // ─────────────────────────────────────────────────────────
  // Cross-tab real-time sync
  // When a student books/checks-in/goes-away in another tab,
  // this fires and re-hydrates the librarian dashboard instantly.
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only react to DeskGuard keys
      if (!e.key || !e.key.startsWith('deskguard_')) return;
      // Re-read all state from localStorage
      const users = getUsers();
      const bookings = getBookings();
      const currentUser = getCurrentUser();
      const desks = getDesks();
      dispatch({
        type: 'RESET_STATE',
        payload: { users, desks, bookings, currentUser },
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  // Sync state changes to localStorage
  useEffect(() => {
    if (state.users.length > 0) saveUsers(state.users);
  }, [state.users]);

  useEffect(() => {
    if (state.desks.length > 0) saveDesks(state.desks);
  }, [state.desks]);

  useEffect(() => {
    saveBookings(state.bookings);
  }, [state.bookings]);

  useEffect(() => {
    saveCurrentUser(state.currentUser);
  }, [state.currentUser]);

  // ─────────────────────────────────────────────
  // Auth helpers
  // ─────────────────────────────────────────────

  const login = useCallback(
    (email: string, password: string): { ok: boolean; error?: string } => {
      const user = state.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
      );
      if (!user) return { ok: false, error: 'Invalid credentials. Please try again.' };
      dispatch({ type: 'SET_CURRENT_USER', payload: user });
      return { ok: true };
    },
    [state.users],
  );

  const signup = useCallback(
    (
      name: string,
      email: string,
      password: string,
      role: 'student' | 'librarian',
    ): { ok: boolean; error?: string } => {
      const exists = state.users.some(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );
      if (exists) return { ok: false, error: 'An account with this email already exists.' };

      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        password,
        role,
        createdAt: Date.now(),
      };
      dispatch({ type: 'ADD_USER', payload: newUser });
      dispatch({ type: 'SET_CURRENT_USER', payload: newUser });
      return { ok: true };
    },
    [state.users],
  );

  const logout = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_USER', payload: null });
  }, []);

  // ─────────────────────────────────────────────
  // Booking helpers
  // ─────────────────────────────────────────────

  const bookDesk = useCallback(
    (deskId: string, durationHours: number): { ok: boolean; booking?: Booking; error?: string } => {
      if (!state.currentUser) return { ok: false, error: 'Not logged in.' };

      const desk = state.desks.find((d) => d.id === deskId);
      if (!desk || desk.status !== 'available')
        return { ok: false, error: 'Desk is no longer available.' };

      const now = Date.now();
      const booking: Booking = {
        id: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        deskId,
        userId: state.currentUser.id,
        status: 'booked',
        startTime: now,
        expiresAt: now + durationHours * 60 * 60 * 1000,
        lastConfirmedAt: now,
        awayStartedAt: null,
        needsConfirmation: false,
        durationHours,
      };

      dispatch({ type: 'ADD_BOOKING', payload: booking });
      dispatch({ type: 'UPDATE_DESK_STATUS', payload: { deskId, status: 'occupied' } });
      return { ok: true, booking };
    },
    [state.currentUser, state.desks],
  );

  const getActiveBooking = useCallback(
    (userId: string): Booking | undefined => {
      return state.bookings.find(
        (b) =>
          b.userId === userId &&
          ['booked', 'checked_in', 'away'].includes(b.status),
      );
    },
    [state.bookings],
  );

  const getDeskById = useCallback(
    (id: string): Desk | undefined => state.desks.find((d) => d.id === id),
    [state.desks],
  );

  const freeDesk = useCallback(
    (bookingId: string) => {
      const booking = state.bookings.find((b) => b.id === bookingId);
      if (!booking) return;
      const endedAt = Date.now();
      // Calculate total away time accumulated during the session
      const totalAwayMs = booking.totalAwayMs ?? 0;
      dispatch({
        type: 'FREE_DESK',
        payload: { deskId: booking.deskId, bookingId, endedAt, totalAwayMs },
      });
    },
    [state.bookings],
  );

  const updateBooking = useCallback(
    (partial: Partial<Booking> & { id: string }) => {
      dispatch({ type: 'UPDATE_BOOKING', payload: partial });
    },
    [],
  );

  const updateDeskStatus = useCallback((deskId: string, status: DeskStatus) => {
    dispatch({ type: 'UPDATE_DESK_STATUS', payload: { deskId, status } });
  }, []);

  const resetDesk = useCallback(
    (bookingId: string) => {
      const booking = state.bookings.find((b) => b.id === bookingId);
      if (!booking) return;
      dispatch({ type: 'UPDATE_BOOKING', payload: { id: bookingId, status: 'ended', endedAt: Date.now() } });
      dispatch({ type: 'UPDATE_DESK_STATUS', payload: { deskId: booking.deskId, status: 'available' } });
    },
    [state.bookings],
  );

  const getUserBookings = useCallback(
    (userId: string): Booking[] => {
      return state.bookings
        .filter((b) => b.userId === userId)
        .sort((a, b) => b.startTime - a.startTime);
    },
    [state.bookings],
  );

  const recordIssue = useCallback(
    (bookingId: string, report: string) => {
      dispatch({ type: 'UPDATE_BOOKING', payload: { id: bookingId, issueReport: report } });
    },
    [],
  );

  return (
    <DeskGuardContext.Provider
      value={{
        state,
        dispatch,
        login,
        signup,
        logout,
        bookDesk,
        getActiveBooking,
        getDeskById,
        freeDesk,
        updateBooking,
        updateDeskStatus,
        resetDesk,
        getUserBookings,
        recordIssue,
      }}
    >
      {children}
    </DeskGuardContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

export function useDeskGuard(): DeskGuardContextValue {
  const ctx = useContext(DeskGuardContext);
  if (!ctx) throw new Error('useDeskGuard must be used inside <DeskGuardProvider>');
  return ctx;
}
