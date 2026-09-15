"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ensureCsrfCookie } from "@/lib/data/client";
import { getCurrentUser, signOut as apiSignOut } from "@/lib/data/auth";
import type { User } from "@/types/user";

/**
 * Real session auth, hydrated from the backend on mount. The session itself
 * lives in an httpOnly cookie the browser manages — this context only mirrors
 * what `GET /api/auth/me` reports, so a refresh restores it rather than
 * clearing it (docs/BACKEND.md §3, §9).
 */
interface AuthContextValue {
  user: User | null;
  signedIn: boolean;
  /** True until the initial session check has completed. */
  loading: boolean;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  /** Employer identity shown on employer surfaces; "" until hydrated. */
  employerName: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // The CSRF cookie must exist before any authenticated write is attempted
    // (docs/BACKEND.md §4); fetching it alongside session hydration means
    // every page load establishes it, not just the login/signup screens.
    Promise.all([ensureCsrfCookie(), getCurrentUser()])
      .then(([, currentUser]) => {
        if (active) setUser(currentUser);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signedIn: user !== null,
      loading,
      setUser,
      signOut,
      employerName: user?.employer?.name ?? "",
    }),
    [loading, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
