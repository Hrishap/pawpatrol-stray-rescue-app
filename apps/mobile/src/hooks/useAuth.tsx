import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import i18n from '../lib/i18n';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** Set when the backend couldn't be reached or the profile failed to load. */
  error: string | null;
  retry: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  // Returns true when a profile was loaded. A `false` result for a signed-in
  // user means the account no longer exists on this backend (e.g. the row was
  // deleted, or the app is pointed at a different/reset database) — the stored
  // session is stale and must not leave the app stuck.
  const loadProfile = useCallback(async (userId: string): Promise<boolean> => {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!data) return false;

    setProfile(data);
    if (data.language_code && i18n.language !== data.language_code) {
      i18n.changeLanguage(data.language_code);
    }
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (cancelled) return;

        const currentSession = data.session;
        if (!currentSession) {
          setSession(null);
          setProfile(null);
          return;
        }

        const found = await loadProfile(currentSession.user.id);
        if (cancelled) return;

        if (found) {
          setSession(currentSession);
        } else {
          // Stale session for a deleted account — clear it and start clean at
          // onboarding rather than hanging on a profile that will never load.
          await supabase.auth.signOut();
          setSession(null);
          setProfile(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt, loadProfile]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        setProfile(null);
        return;
      }
      try {
        await loadProfile(newSession.user.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = async () => {
    if (session) await loadProfile(session.user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, error, retry, refreshProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
