import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import type { Session } from '@supabase/supabase-js';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import type { AdminUser } from '../types.ts';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  supabaseSession: Session | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  quickDemoLogin: (role: 'owner' | 'super_admin' | 'admin') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('wedding_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  // Store token in memory (never in localStorage)
  const [token, setToken] = useState<string | null>(null);
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('wedding_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('wedding_auth_user');
    }
  }, [user]);

  // Helper to sync a Supabase Auth session with backend AdminUser profile
  const syncSupabaseUserWithBackend = async (session: Session) => {
    try {
      setSupabaseSession(session);
      setToken(session.access_token);
      const res = await fetch('/api/auth/supabase-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          uid: session.user.id,
          email: session.user.email,
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split('@')[0],
          role: session.user.user_metadata?.role,
          weddingSlug: session.user.user_metadata?.weddingSlug,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error('Failed to sync Supabase session with backend:', err);
    }
  };

  // 1. Listen to Supabase Auth session & state changes
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        syncSupabaseUserWithBackend(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session);
      if (session) {
        syncSupabaseUserWithBackend(session);
      } else {
        setToken(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
        } catch (err) {
          console.error('Failed to get Firebase ID token:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    const cleanInput = usernameOrEmail.trim();

    // Step A: If Supabase is configured, try Supabase Auth signInWithPassword first
    if (isSupabaseConfigured) {
      const emailCandidate = cleanInput.includes('@')
        ? cleanInput
        : cleanInput.toLowerCase() === 'asepsulistiyono1'
        ? 'asepsulistiyono1@gmail.com'
        : `${cleanInput.toLowerCase()}@wedding.local`;

      try {
        const { data: supaData, error: supaError } = await supabase.auth.signInWithPassword({
          email: emailCandidate,
          password,
        });

        if (!supaError && supaData.session) {
          await syncSupabaseUserWithBackend(supaData.session);
          return { success: true };
        }
      } catch {
        // Fallback to backend multi-tenant auth check below
      }
    }

    // Step B: Verify against backend multi-tenant Super Admin / Admin WO database
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanInput,
          email: cleanInput,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login gagal.' };
      }

      setUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch {
      return { success: false, error: 'Koneksi ke server gagal.' };
    }
  };

  const loginWithGoogle = async () => {
    // Support Supabase Google OAuth if configured, or Firebase Google Sign-In popup
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await credential.user.getIdToken();
      setToken(idToken);

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal verifikasi akun Google.' };
      }

      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      return {
        success: false,
        error: err?.message || 'Gagal masuk menggunakan akun Google.',
      };
    }
  };

  const quickDemoLogin = async (role: 'owner' | 'super_admin' | 'admin') => {
    if (role === 'owner') {
      await login('asepsulistiyono1', 'owner123');
    } else if (role === 'super_admin') {
      await login('superadmin', 'super123');
    } else {
      await login('adminwo', 'admin123');
    }
  };

  const logout = () => {
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch(() => {});
    }
    signOut(auth).catch(() => {});
    setSupabaseSession(null);
    setUser(null);
    setToken(null);
  };

  const isOwner = Boolean(
    user?.isOwner ||
    user?.username?.toLowerCase() === 'asepsulistiyono1' ||
    user?.email?.toLowerCase() === 'asepsulistiyono1@gmail.com'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        supabaseSession,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'super_admin' || isOwner,
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin' || isOwner,
        isOwner,
        login,
        loginWithGoogle,
        quickDemoLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
