import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
  }) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMe = async (explicitToken?: string | null) => {
    const authToken = explicitToken ?? token;
    if (!authToken) {
      setUser(null);
      return;
    }
    const me = (await api.me(authToken)) as AuthUser;
    setUser(me);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = (await api.me(token)) as AuthUser;
        if (mounted) {
          setUser(me);
        }
      } catch (err) {
        api.clearToken();
        if (mounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    loading,
    error,
    login: async (identifier: string, password: string) => {
      setError(null);
      const data = await api.login(identifier, password);
      api.setToken(data.access_token);
      setToken(data.access_token);
      await refreshMe(data.access_token);
    },
    register: async (payload) => {
      setError(null);
      await api.register(payload);
      const data = await api.login(payload.username, payload.password);
      api.setToken(data.access_token);
      setToken(data.access_token);
      await refreshMe(data.access_token);
    },
    refreshMe: async () => {
      await refreshMe();
    },
    logout: () => {
      api.clearToken();
      setToken(null);
      setUser(null);
    },
  }), [user, token, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
