"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, Input } from "@/components/ui";
import { useSession } from "@/components/session-provider";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { ApiError } from "@/lib/api/client";

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const { adoptSession } = useSession();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) {
      setError("Enter a valid Bangladeshi mobile number (e.g. 01712345678).");
      return;
    }
    setBusy(true);
    try {
      const result = await getBrowserApi().register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      adoptSession(result);
      router.push(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <Field label="Full name" htmlFor="name">
        <Input id="name" required autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" required autoComplete="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
      </Field>
      <Field label="Mobile number" htmlFor="phone" hint="We use this to contact you about deliveries.">
        <Input id="phone" inputMode="numeric" required autoComplete="tel" placeholder="01712345678" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => update("password", e.target.value)} />
      </Field>
      <Button type="submit" size="lg" fullWidth disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
