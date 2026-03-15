'use client';

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { AdminUser } from '@/types';
import logger from '@/lib/logger';

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'portadora_eros_admin_auth';


export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => {
    if (globalThis.window === undefined) return null;
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed.username && parsed.isAuthenticated) {
          logger.info('Restored admin session', { username: parsed.username });
          return parsed;
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    return null;
  });
  const [isLoading] = useState<boolean>(globalThis.window === undefined);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = async (_u: string, _p: string): Promise<boolean> => {
    // Legacy hook — actual authentication is in /admin/login/actions.ts using Supabase
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    logger.info('Admin logged out');
  };

  const authContextValue = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user?.isAuthenticated,
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
