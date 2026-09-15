import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue to NorthwindJobs."
      footerPrompt="New here?"
      footerLinkLabel="Create an account"
      footerLinkHref="/signup"
    >
      <LoginForm />
    </AuthCard>
  );
}
