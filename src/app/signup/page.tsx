import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = { title: "Sign Up" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Find your next role, or start hiring in minutes."
      footerPrompt="Already have an account?"
      footerLinkLabel="Sign in"
      footerLinkHref="/login"
    >
      <SignupForm />
    </AuthCard>
  );
}
