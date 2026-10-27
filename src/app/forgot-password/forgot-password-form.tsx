"use client";

import { useState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { ApiError } from "@/lib/api/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await getBrowserApi().requestPasswordReset({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send a reset link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Alert tone="success">
        If an account exists for <strong>{email}</strong>, we have sent a password reset link.
        Please check your inbox (and spam folder).
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <Field label="Email" htmlFor="email" hint="We will email you a secure reset link.">
        <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" fullWidth disabled={busy}>
        {busy ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
