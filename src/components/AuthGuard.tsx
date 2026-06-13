'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeskGuard } from '@/context/DeskGuardContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireRole?: 'student' | 'librarian';
}

/**
 * Client-side auth guard.
 * - Redirects unauthenticated users to /login.
 * - If requireRole is set, redirects users with wrong role to their home.
 * - Shows nothing (null) while determining auth state to avoid FOUC.
 */
export default function AuthGuard({ children, requireRole }: AuthGuardProps) {
  const { state } = useDeskGuard();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for hydration (state.desks length indicates context has loaded)
    if (state.desks.length === 0 && state.users.length === 0 && !state.currentUser) {
      // Still loading — give it a tick
      const t = setTimeout(() => setReady(true), 350);
      return () => clearTimeout(t);
    }
    setReady(true);
  }, [state]);

  useEffect(() => {
    if (!ready) return;

    if (!state.currentUser) {
      router.replace('/login');
      return;
    }

    if (requireRole && state.currentUser.role !== requireRole) {
      router.replace(state.currentUser.role === 'librarian' ? '/librarian' : '/dashboard');
    }
  }, [ready, state.currentUser, requireRole, router]);

  if (!ready || !state.currentUser) return null;
  if (requireRole && state.currentUser.role !== requireRole) return null;

  return <>{children}</>;
}
