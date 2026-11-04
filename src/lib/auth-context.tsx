'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase/client';
import { Pengguna, UserRole } from './types';

interface AuthContextType {
  user: Pengguna | null;
  authUser: any | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, kataSandi: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authUser: null,
  role: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [user, setUser] = useState<Pengguna | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('pengguna')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setUser(data as Pengguna);
      } else {
        // Fallback for new user or admin setup
        const isDefaultAdmin = email.toLowerCase().includes('admin');
        const fallbackUser: Pengguna = {
          id: userId,
          nama: email.split('@')[0],
          email: email,
          peran: isDefaultAdmin ? 'admin' : 'guru',
          status_aktif: true,
          dibuat_pada: new Date().toISOString(),
          diperbarui_pada: new Date().toISOString(),
        };
        setUser(fallbackUser);

        // Try to insert profile if allowed
        try {
          await supabase.from('pengguna').upsert(fallbackUser);
        } catch (e) {
          // Ignore if permission denied
        }
      }
    } catch (err) {
      console.error('Error fetching pengguna profile:', err);
      // Fallback local profile
      setUser({
        id: userId,
        nama: email.split('@')[0],
        email: email,
        peran: email.includes('admin') ? 'admin' : 'guru',
        status_aktif: true,
        dibuat_pada: new Date().toISOString(),
        diperbarui_pada: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setAuthUser(session.user);
          await fetchProfile(session.user.id, session.user.email || '');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setAuthUser(session.user);
          await fetchProfile(session.user.id, session.user.email || '');
        } else {
          setAuthUser(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, kataSandi: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: kataSandi,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setAuthUser(data.user);
        await fetchProfile(data.user.id, data.user.email || email);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Gagal login' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setAuthUser(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (authUser) {
      await fetchProfile(authUser.id, authUser.email || '');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        role: user?.peran || null,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

