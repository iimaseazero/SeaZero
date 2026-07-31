'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getBrowserClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
  adminEmail?: string;
}

export default function AuthProvider({
  children,
  adminEmail,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getBrowserClient();

    // The login server action stores tokens in HTTP-only cookies,
    // which the browser Supabase client can't access from localStorage.
    // Fetch the tokens from our API route and hydrate the client session.
    async function hydrateSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const { accessToken, refreshToken } = await res.json();
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            // setSession triggers onAuthStateChange, which will update user
            return;
          }
        }
      } catch {
        // Ignore fetch errors — fall through to getSession
      }

      // Fallback: try the browser client's own session (e.g. if OAuth was used)
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    }

    hydrateSession();

    // Listen for auth changes (including from setSession above)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin =
    !!user?.email &&
    !!adminEmail &&
    user.email.toLowerCase() === adminEmail.toLowerCase();

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
