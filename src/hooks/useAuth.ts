import { useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  credits: number;
  unlimited_until: string | null;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isUnlimited: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, credits, unlimited_until')
      .eq('id', uid)
      .maybeSingle();
    if (error) return;
    setProfile(data as Profile);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;
    const loadingTimeout = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8_000);

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await fetchProfile(data.session.user.id);
      }
      setLoading(false);
      window.clearTimeout(loadingTimeout);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
        window.clearTimeout(loadingTimeout);
      })();
    });

    return () => {
      mounted = false;
      window.clearTimeout(loadingTimeout);
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  }, []);

  const isUnlimited = !!profile?.unlimited_until && new Date(profile.unlimited_until) > new Date();

  return { user, session, profile, loading, isUnlimited, refreshProfile, signOut };
}
