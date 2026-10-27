import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send you a link to set a new password."
      footer={
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">Back to sign in</Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
