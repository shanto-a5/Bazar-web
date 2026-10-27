import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthShell title="Invalid reset link">
        <p className="text-sm text-ink-muted">
          This password reset link is missing its token. Please{" "}
          <Link href="/forgot-password" className="font-semibold text-brand-600 hover:underline">
            request a new link
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Enter and confirm your new password below.">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
