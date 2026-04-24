'use client';

import { api } from '@/lib/api';
import {
    clearStoredSession,
    getStoredSession,
    persistSession,
    setAuthorizationToken,
    type AppRole,
    type AppUser,
    type AuthResponse,
} from '@/lib/auth-service';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

interface AuthContextValue {
  session: AuthResponse | null;
  user: AppUser | null;
  role: AppRole | null;
  isLoading: boolean;
  applySession: (session: AuthResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setSession(stored);
    }
    setIsLoading(false);
  }, []);

  const applySession = useCallback((newSession: AuthResponse) => {
    persistSession(newSession);
    setSession(newSession);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // best-effort logout call
    }
    clearStoredSession();
    setAuthorizationToken(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        role: session?.user.role ?? null,
        isLoading,
        applySession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
