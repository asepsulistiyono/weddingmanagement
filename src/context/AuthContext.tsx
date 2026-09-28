import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import type { AdminUser } from '../types.ts';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
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
  // Store token in memory (never in localStorage) per security best practices
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('wedding_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('wedding_auth_user');
    }
  }, [user]);

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
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: usernameOrEmail.trim(), 
          email: usernameOrEmail.trim(), 
          password 
        })
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
    signOut(auth).catch(() => {});
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
