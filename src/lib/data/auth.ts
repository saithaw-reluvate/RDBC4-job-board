import { delay } from "@/lib/mock/latency";
import { DEMO_EMPLOYER } from "@/lib/mock/jobs.mock";
import type { MockUser, SignInInput, SignUpInput, UserRole } from "@/types/user";

/**
 * Mock authentication for demonstrating the frontend experience only.
 *
 * No authentication mechanism is decided or implied here — no tokens, no
 * session model, no storage, no endpoints. Deciding that is a later backend
 * phase (docs/FRONTEND.md §16).
 */

/**
 * Sign-in role is inferred, since there is no role selector on the login screen.
 * Demo rule: an email containing "employer" signs in as an employer. This is
 * surfaced as a hint on the login page rather than left as hidden behaviour.
 */
export const EMPLOYER_EMAIL_HINT = "employer";

/**
 * Display name for employer surfaces when no employer is signed in. At
 * integration this is replaced by the authenticated employer from the backend.
 */
export const DEFAULT_EMPLOYER_NAME = DEMO_EMPLOYER;

function inferRole(email: string): UserRole {
  return email.toLowerCase().includes(EMPLOYER_EMAIL_HINT) ? "employer" : "seeker";
}

function nameFromEmail(email: string): string {
  const [local] = email.split("@");
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function signIn({ email }: SignInInput): Promise<MockUser> {
  await delay(400, 700);

  const role = inferRole(email);
  return {
    email,
    role,
    name: role === "employer" ? DEMO_EMPLOYER : nameFromEmail(email),
  };
}

export async function signUp({
  name,
  email,
  role,
}: SignUpInput): Promise<MockUser> {
  await delay(400, 700);
  return { name, email, role };
}
