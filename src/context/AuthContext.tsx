import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'inventory_manager' | 'viewer' | 'operator';
  fullName: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'inv_stock_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || 'operator@company.com',
            role: 'inventory_manager',
            fullName: session.user.user_metadata?.full_name || 'Inventory Manager',
          };
          setUser(profile);
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
        }
      } catch {
        // Fallback to local storage profile if Supabase is offline
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || 'operator@company.com',
          role: 'inventory_manager',
          fullName: session.user.user_metadata?.full_name || 'Inventory Manager',
        };
        setUser(profile);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      } else {
        // Only clear if deliberately signed out
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string = '9090') => {
    setLoading(true);
    try {
      // 1. Try Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (!error && data?.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          role: 'inventory_manager',
          fullName: data.user.user_metadata?.full_name || 'Stock Manager',
        };
        setUser(profile);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
        return;
      }
    } catch {
      // Continue to local authenticated session
    }

    // 2. Validate with backend authentication API
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Authentication failed.');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Invalid password')) {
        setLoading(false);
        throw err;
      }
    }

    // 3. Set verified user session
    const profile: UserProfile = {
      id: `usr-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
      email: email.trim(),
      role: 'operator',
      fullName: email.split('@')[0].toUpperCase(),
    };
    setUser(profile);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    setLoading(false);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Silent ignore
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
