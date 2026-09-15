"use client";

import { useCallback } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { RoleToggle } from "@/components/auth/RoleToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { signUp } from "@/lib/data/auth";
import { useFormState } from "@/lib/forms/useFormState";
import {
  compactErrors,
  email as validateEmail,
  matches,
  minLength,
  required,
} from "@/lib/forms/validators";
import type { UserRole } from "@/types/user";

const PASSWORD_MIN = 8;

interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  companyName: string;
  [key: string]: string;
}

const INITIAL_VALUES: SignupFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "seeker",
  companyName: "",
};

export function SignupForm() {
  const { setUser } = useAuth();

  const validate = useCallback(
    (values: SignupFormValues) =>
      compactErrors<SignupFormValues>({
        name: required(values.name, values.role === "employer" ? "Your name" : "Full name"),
        email: validateEmail(values.email),
        password: minLength(values.password, PASSWORD_MIN, "Password"),
        confirmPassword: matches(
          values.confirmPassword,
          values.password,
          "Passwords do not match.",
        ),
        companyName:
          values.role === "employer"
            ? required(values.companyName, "Company name")
            : undefined,
      }),
    [],
  );

  const onSubmit = useCallback(
    async (values: SignupFormValues) => {
      const user = await signUp({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role as UserRole,
        ...(values.role === "employer"
          ? { companyName: values.companyName.trim() }
          : {}),
      });
      setUser(user);
      // Full navigation, not router.push — see LoginForm.tsx for why.
      window.location.href = user.role === "employer" ? "/employer" : "/";
    },
    [setUser],
  );

  const form = useFormState<SignupFormValues>({
    initialValues: INITIAL_VALUES,
    validate,
    onSubmit,
  });

  const isEmployer = form.values.role === "employer";

  return (
    <form ref={form.formRef} onSubmit={form.handleSubmit} noValidate className="space-y-5">
      <RoleToggle
        value={form.values.role as UserRole}
        onChange={(role) => form.setValue("role", role)}
      />

      {isEmployer && (
        <Field
          id="companyName"
          label="Company name"
          required
          error={form.errorFor("companyName")}
        >
          <Input
            {...form.fieldProps("companyName")}
            type="text"
            autoComplete="organization"
            placeholder="Acme Inc."
          />
        </Field>
      )}

      <Field
        id="name"
        label={isEmployer ? "Your name" : "Full name"}
        required
        error={form.errorFor("name")}
      >
        <Input
          {...form.fieldProps("name")}
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
        />
      </Field>

      <Field id="email" label="Email address" required error={form.errorFor("email")}>
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
        hint={`At least ${PASSWORD_MIN} characters.`}
        error={form.errorFor("password")}
      >
        <Input
          {...form.fieldProps("password", { hasHint: true })}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </Field>

      <Field
        id="confirmPassword"
        label="Confirm password"
        required
        error={form.errorFor("confirmPassword")}
      >
        <Input
          {...form.fieldProps("confirmPassword")}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </Field>

      {form.submitError && <Alert variant="error">{form.submitError}</Alert>}

      <Button type="submit" size="lg" fullWidth loading={form.submitting}>
        {form.submitting ? "Creating account…" : "Sign Up"}
      </Button>
    </form>
  );
}
