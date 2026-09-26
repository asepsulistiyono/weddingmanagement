import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AdminUser } from '../types.ts';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickDemoLogin: (role: 'owner' | 'super_admin' | 'admin') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('wedding_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('wedding_auth_token');
  });

  useEffect(() => {
    if (user && token) {
      localStorage.setItem('wedding_auth_user', JSON.stringify(user));
      localStorage.setItem('wedding_auth_token', token);
    } else {
      localStorage.removeItem('wedding_auth_user');
      localStorage.removeItem('wedding_auth_token');
    }
  }, [user, token]);

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
