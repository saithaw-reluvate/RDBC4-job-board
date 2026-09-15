export type UserRole = "seeker" | "employer";

/**
 * Mock-only user shape for demonstrating the frontend auth experience.
 * No authentication mechanism, token, or session model is implied or decided.
 */
export interface MockUser {
  name: string;
  email: string;
  role: UserRole;
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
}
