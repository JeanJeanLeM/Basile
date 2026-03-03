import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

/** Normalized user shape for compatibility with components (uid, email). */
export interface AuthUser {
  id: string;
  uid: string;
  email?: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ? toAuthUser(s.user) : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ? toAuthUser(s.user) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isGuest = !user;

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password });

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({ provider: 'google' });

  const signOut = () => supabase.auth.signOut();

  const getToken = async (): Promise<string> => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s?.access_token) throw new Error('Not authenticated');
    return s.access_token;
  };

  return {
    user,
    session,
    isGuest,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    getToken,
  };
}

function toAuthUser(u: User): AuthUser {
  return {
    id: u.id,
    uid: u.id,
    email: u.email ?? undefined,
    name: u.user_metadata?.name ?? u.user_metadata?.full_name ?? undefined,
  };
}
