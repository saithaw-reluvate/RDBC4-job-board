export type UserRole = "seeker" | "employer";

/** The company profile attached to an employer account (docs/BACKEND.md §4). */
export interface Employer {
  id: string;
  name: string;
  contactEmail: string;
}

/**
 * The signed-in user. `name` is always the person; `employer` (present only
 * for role === "employer") carries the company identity separately — the two
 * are never conflated (docs/BACKEND.md §3).
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employer: Employer | null;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  /** Required when role === "employer", rejected otherwise (docs/BACKEND.md §6). */
  companyName?: string;
}
