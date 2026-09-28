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

const CACHED_ADMINS_KEY = 'wedding_cached_admins';

export const DEFAULT_FALLBACK_ADMINS: Array<AdminUser & { password?: string }> = [
  {
    id: 'user-owner-1',
    username: 'asepsulistiyono1',
    name: 'Asep Sulistiyono (Owner / Pemilik Website)',
    email: 'asepsulistiyono1@gmail.com',
    role: 'super_admin',
    isOwner: true,
    active: true,
    password: 'owner123',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'user-super-1',
    username: 'superadmin',
    name: 'Rizky & Siti',
    email: 'superadmin@wedding.com',
    role: 'super_admin',
    isOwner: false,
    weddingSlug: 'rizky_dan_siti',
    coupleNames: 'Rizky & Siti',
    phone: '081234567890',
    notes: 'Paket Platinum 500 Undangan (Gedung Mulia)',
    password: 'super123',
    active: true,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'user-super-2',
    username: 'thomas_juwita',
    name: 'Thomas & Juwita',
    email: 'thomas@wedding.local',
    role: 'super_admin',
    isOwner: false,
    weddingSlug: 'thomas_dan_juwita',
    coupleNames: 'Thomas & Juwita',
    phone: '081298765432',
    notes: 'Paket Diamond 1000 Undangan (Outdoor Garden)',
    password: 'mempelai123',
    active: true,
    createdAt: '2026-09-15T09:00:00Z',
  },
  {
    id: 'user-admin-1',
    username: 'adminwo',
    name: 'Admin WO (Reception Desk)',
    email: 'admin@wedding.com',
    role: 'admin',
    isOwner: false,
    active: true,
    createdBy: 'user-super-1',
    createdByName: 'Rizky & Siti',
    weddingSlug: 'rizky_dan_siti',
    password: 'admin123',
    createdAt: '2026-09-05T14:30:00Z',
  },
];

export function getCachedAdminsList(): Array<AdminUser & { password?: string }> {
  const merged = [...DEFAULT_FALLBACK_ADMINS];
  try {
    const raw = localStorage.getItem(CACHED_ADMINS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (!item || !item.username) continue;
          const idx = merged.findIndex(
            (u) =>
              u.id === item.id ||
              u.username.toLowerCase() === String(item.username).toLowerCase()
          );
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...item };
          } else {
            merged.push(item);
          }
        }
      }
    }
  } catch {
    // ignore storage parse error
  }
  return merged;
}

export function saveCachedAdminUser(userToSave: AdminUser & { password?: string }) {
  try {
    const list = getCachedAdminsList();
    const idx = list.findIndex(
      (u) =>
        u.id === userToSave.id ||
        u.username.toLowerCase() === userToSave.username.toLowerCase()
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...userToSave };
    } else {
      list.push(userToSave);
    }
    localStorage.setItem(CACHED_ADMINS_KEY, JSON.stringify(list));
  } catch {
    // ignore storage write error
  }
}

function authenticateWithLocalCache(
  identifier: string,
  password: string
): { success: boolean; user?: AdminUser; token?: string; error?: string } {
  const cleanId = identifier.trim().toLowerCase();
  const admins = getCachedAdminsList();

  const matched = admins.find(
    (u) =>
      u.username.toLowerCase() === cleanId ||
      (u.email && u.email.toLowerCase() === cleanId) ||
      (u.weddingSlug && u.weddingSlug.toLowerCase() === cleanId)
  );

  if (matched && matched.active !== false) {
    const isOwnerFlag = Boolean(
      matched.isOwner ||
        matched.username.toLowerCase() === 'asepsulistiyono1' ||
        matched.email?.toLowerCase() === 'asepsulistiyono1@gmail.com'
    );
    const defaultPass = isOwnerFlag
      ? 'owner123'
      : matched.role === 'super_admin'
      ? 'super123'
      : 'admin123';
    const customPass = matched.password;

    const valid = customPass
      ? password === customPass ||
        (isOwnerFlag && (password === 'owner123' || password === 'super123'))
      : password === defaultPass ||
        (isOwnerFlag && (password === 'owner123' || password === 'super123'));

    if (valid) {
      const userObj: AdminUser = {
        ...matched,
        isOwner: isOwnerFlag,
      };
      return {
        success: true,
        user: userObj,
        token: `token_${matched.role}_${matched.id}_${Date.now()}`,
      };
    }
  }

  return {
    success: false,
    error: 'Kredensial tidak valid. Silakan periksa kembali username dan kata sandi Anda.',
  };
}

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
          saveCachedAdminUser(data.user);
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
    }).catch(() => {});

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

    // Step B: Verify against backend multi-tenant Super Admin / Admin WO database (with automatic retry)
    for (let attempt = 0; attempt < 2; attempt++) {
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

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.user) {
            saveCachedAdminUser({ ...data.user, password });
            setUser(data.user);
            setToken(data.token);
            return { success: true };
          }
          // If server returned 401/400, check local cache in case user was created/reset on client
          const localCheck = authenticateWithLocalCache(cleanInput, password);
          if (localCheck.success && localCheck.user) {
            setUser(localCheck.user);
            setToken(localCheck.token || null);
            return { success: true };
          }
          return { success: false, error: data.error || 'Login gagal.' };
        }
      } catch {
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 450));
        }
      }
    }

    // Step C: Fallback to cached & default accounts so login never fails on transient server reload
    const fallbackResult = authenticateWithLocalCache(cleanInput, password);
    if (fallbackResult.success && fallbackResult.user) {
      setUser(fallbackResult.user);
      setToken(fallbackResult.token || null);
      return { success: true };
    }

    return {
      success: false,
      error: fallbackResult.error || 'Username atau kata sandi tidak sesuai.',
    };
  };

  const loginWithGoogle = async () => {
    try {
      const credential = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await credential.user.getIdToken();
      setToken(idToken);

      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            saveCachedAdminUser(data.user);
            setUser(data.user);
            return { success: true };
          }
        }
      } catch {
        // Fallback if backend route is unreachable
      }

      const email = (credential.user.email || '').toLowerCase();
      const isOwnerFlag = email === 'asepsulistiyono1@gmail.com';
      const fallbackUser: AdminUser = {
        id: credential.user.uid,
        username: email ? email.split('@')[0] : 'google_admin',
        name: credential.user.displayName || (email ? email.split('@')[0] : 'Pengelola'),
        email: email || 'google@wedding.local',
        role: 'super_admin',
        weddingSlug: 'rizky_dan_siti',
        coupleNames: 'Rizky & Siti',
        active: true,
        isOwner: isOwnerFlag,
        createdAt: new Date().toISOString(),
      };
      saveCachedAdminUser(fallbackUser);
      setUser(fallbackUser);
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
