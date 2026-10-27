"use client";

import { useState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { useSession } from "@/components/session-provider";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { ApiError } from "@/lib/api/client";

export default function ProfilePage() {
  const api = getBrowserApi();
  const { user, setUser, logout } = useSession();

  const [profile, setProfile] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
  const [profileState, setProfileState] = useState<{ error?: string; success?: string; busy?: boolean }>({});

  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [passwordState, setPasswordState] = useState<{ error?: string; success?: string; busy?: boolean }>({});

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setProfileState({ busy: true });
    try {
      const result = await api.updateProfile({ name: profile.name.trim(), email: profile.email.trim(), phone: profile.phone.trim() });
      setUser(result.user);
      setProfileState({ success: "Profile updated." });
    } catch (err) {
      setProfileState({ error: err instanceof ApiError ? err.message : "Could not update your profile." });
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    if (passwords.next.length < 8) {
      setPasswordState({ error: "New password must be at least 8 characters." });
      return;
    }
    setPasswordState({ busy: true });
    try {
      if (user?.hasPassword) {
        await api.changePassword({ currentPassword: passwords.current, newPassword: passwords.next });
        setPasswordState({ success: "Password changed. Other sessions were signed out." });
      } else {
        await api.setInitialPassword({ newPassword: passwords.next });
        setPasswordState({ success: "Password set. Your account is now secured." });
      }
      setPasswords({ current: "", next: "" });
    } catch (err) {
      setPasswordState({ error: err instanceof ApiError ? err.message : "Could not update your password." });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">Profile &amp; security</h1>

      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <h2 className="font-bold text-ink">Personal details</h2>
        <form onSubmit={saveProfile} className="mt-3 grid gap-3 sm:grid-cols-2">
          {profileState.error && <div className="sm:col-span-2"><Alert>{profileState.error}</Alert></div>}
          {profileState.success && <div className="sm:col-span-2"><Alert tone="success">{profileState.success}</Alert></div>}
          <Field label="Full name" htmlFor="name"><Input id="name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></Field>
          <Field label="Email" htmlFor="email"><Input id="email" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} /></Field>
          <Field label="Mobile number" htmlFor="phone"><Input id="phone" inputMode="numeric" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} /></Field>
          <div className="sm:col-span-2"><Button type="submit" disabled={profileState.busy}>Save changes</Button></div>
        </form>
      </section>

      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <h2 className="font-bold text-ink">{user?.hasPassword ? "Change password" : "Set a password"}</h2>
        {!user?.hasPassword && (
          <p className="mt-1 text-sm text-ink-muted">
            You signed in with a quick account. Set a password to secure it.
          </p>
        )}
        <form onSubmit={savePassword} className="mt-3 grid gap-3 sm:grid-cols-2">
          {passwordState.error && <div className="sm:col-span-2"><Alert>{passwordState.error}</Alert></div>}
          {passwordState.success && <div className="sm:col-span-2"><Alert tone="success">{passwordState.success}</Alert></div>}
          {user?.hasPassword && (
            <Field label="Current password" htmlFor="current"><Input id="current" type="password" autoComplete="current-password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} /></Field>
          )}
          <Field label="New password" htmlFor="next"><Input id="next" type="password" autoComplete="new-password" value={passwords.next} onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} /></Field>
          <div className="sm:col-span-2"><Button type="submit" disabled={passwordState.busy}>{user?.hasPassword ? "Change password" : "Set password"}</Button></div>
        </form>
      </section>

      <section className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <h2 className="font-bold text-ink">Sessions</h2>
        <p className="mt-1 text-sm text-ink-muted">Sign out of every device if you think your account was accessed elsewhere.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => logout(false)}>Sign out</Button>
          <Button variant="danger" onClick={() => logout(true)}>Sign out everywhere</Button>
        </div>
      </section>
    </div>
  );
}
