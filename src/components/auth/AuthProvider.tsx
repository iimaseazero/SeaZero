'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { usePathname } from 'next/navigation';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  loading: true,
  refreshAuth: async () => {},
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const loadSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [pathname]);

  const isAdmin =
    !!user?.email &&
    !!adminEmail &&
    user.email.toLowerCase() === adminEmail.toLowerCase();

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, refreshAuth: loadSession }}>
      {children}
    </AuthContext.Provider>
  );
}
