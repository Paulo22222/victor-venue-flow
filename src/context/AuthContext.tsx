import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'organizer' | 'viewer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
  signIn: (email: string, password: string) => Promise<AppRole>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string): Promise<AppRole> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) console.warn('[auth] fetchRole error:', error.message);
    return (data?.role as AppRole) || 'viewer';
  };

  useEffect(() => {
    let active = true;

    // 1) Subscribe FIRST — handles SIGNED_IN/SIGNED_OUT after page load
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // defer to avoid deadlock with the auth callback
        setTimeout(async () => {
          const r = await fetchRole(newSession.user.id);
          if (active) setRole(r);
        }, 0);
      } else {
        setRole(null);
      }
    });

    // 2) THEN check existing session — finishes initial loading only after role resolves
    (async () => {
      const { data: { session: existing } } = await supabase.auth.getSession();
      if (!active) return;
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        const r = await fetchRole(existing.user.id);
        if (active) setRole(r);
      }
      if (active) setLoading(false);
    })();

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string): Promise<AppRole> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const userId = data.user?.id;
    if (!userId) throw new Error('Falha ao obter usuário');
    const r = await fetchRole(userId);
    setRole(r);
    return r;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{
      user, session, role, loading,
      isAdmin: role === 'admin',
      isOrganizer: role === 'organizer',
      signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
