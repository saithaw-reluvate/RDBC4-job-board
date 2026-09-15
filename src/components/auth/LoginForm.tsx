"use client";

import { useCallback } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/components/auth/AuthProvider";
import { signIn } from "@/lib/data/auth";
import { useFormState } from "@/lib/forms/useFormState";
import {
  compactErrors,
  email as validateEmail,
  required,
} from "@/lib/forms/validators";

interface LoginFormValues {
  email: string;
  password: string;
  [key: string]: string;
}

const INITIAL_VALUES: LoginFormValues = { email: "", password: "" };

export function LoginForm() {
  const { setUser } = useAuth();

  const validate = useCallback(
    (values: LoginFormValues) =>
      compactErrors<LoginFormValues>({
        email: validateEmail(values.email),
        password: required(values.password, "Password"),
      }),
    [],
  );

  const onSubmit = useCallback(
    async (values: LoginFormValues) => {
      const user = await signIn({
        email: values.email.trim(),
        password: values.password,
      });
      setUser(user);
      // A full navigation, not router.push: the destination for an employer
      // is middleware-gated, and Next.js's client Router Cache can otherwise
      // replay a redirect it cached from an earlier anonymous visit to the
      // same URL instead of re-running middleware against the session that
      // was just established.
      window.location.href = user.role === "employer" ? "/employer" : "/";
    },
    [setUser],
  );

  const form = useFormState<LoginFormValues>({
    initialValues: INITIAL_VALUES,
    validate,
    onSubmit,
  });

  return (
    <form ref={form.formRef} onSubmit={form.handleSubmit} noValidate className="space-y-5">
      <Field
        id="email"
        label="Email address"
        required
        error={form.errorFor("email")}
      >
        <Input
          {...form.fieldProps("email")}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
      </Field>

      <Field
        id="password"
        label="Password"
        required
        error={form.errorFor("password")}
      >
        <Input
          {...form.fieldProps("password")}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </Field>

      {form.submitError && <Alert variant="error">{form.submitError}</Alert>}

      <Button type="submit" size="lg" fullWidth loading={form.submitting}>
        {form.submitting ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
