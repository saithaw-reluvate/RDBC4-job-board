"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { DEFAULT_EMPLOYER_NAME } from "@/lib/data/auth";
import type { MockUser } from "@/types/user";

/**
 * Mock auth state for demonstrating the frontend flow. In-memory only — a
 * refresh clears it (docs/FRONTEND.md §10). No tokens, no storage, and no
 * authentication mechanism is implied.
 *
 * Employer pages deliberately do NOT gate on this: /employer always renders as
 * an authenticated employer, per the approved V1 scope.
 */
interface AuthContextValue {
  user: MockUser | null;
  signedIn: boolean;
  setUser: (user: MockUser | null) => void;
  signOut: () => void;
  /** Employer identity shown on employer surfaces, signed in or not. */
  employerName: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      signedIn: user !== null,
      setUser,
      signOut,
      employerName:
        user?.role === "employer" && user.name
          ? user.name
          : DEFAULT_EMPLOYER_NAME,
    }),
    [signOut, user],
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
