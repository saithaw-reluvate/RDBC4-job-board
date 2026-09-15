import { apiClient, ApiError } from "@/lib/data/client";
import type { SignInInput, SignUpInput, User } from "@/types/user";

/**
 * Data access for authentication. Session-cookie based (docs/BACKEND.md §3) —
 * no token is held or read here; the browser's cookie jar is the only state.
 */

/** The signed-in user, or null if there is no session. Never throws for that. */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await apiClient.get<User>("/auth/me/");
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) return null;
    throw error;
  }
}

export async function signIn(input: SignInInput): Promise<User> {
  return apiClient.post<User>("/auth/login/", input);
}

export async function signUp(input: SignUpInput): Promise<User> {
  return apiClient.post<User>("/auth/signup/", input);
}

export async function signOut(): Promise<void> {
  await apiClient.post("/auth/logout/");
}
