'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  user_id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'DONOR' | 'RECIPIENT' | 'VOLUNTEER';
  profile_id?: number;
  organization_name?: string;
  vehicle_type?: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: 'ADMIN' | 'DONOR' | 'RECIPIENT' | 'VOLUNTEER') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_CREDENTIALS = {
  ADMIN: { email: 'admin@foodrescue.org', password: 'Password123!' },
  DONOR: { email: 'chef.marcus@grandmetro.com', password: 'Password123!' },
  RECIPIENT: { email: 'director@hopeharbor.org', password: 'Password123!' },
  VOLUNTEER: { email: 'david.courier@rescuevolunteers.net', password: 'Password123!' },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  const switchDemoRole = async (role: 'ADMIN' | 'DONOR' | 'RECIPIENT' | 'VOLUNTEER') => {
    setLoading(true);
    const creds = DEMO_CREDENTIALS[role];
    await login(creds.email, creds.password);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchDemoRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
