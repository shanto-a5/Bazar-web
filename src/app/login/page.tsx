import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next && next.startsWith("/") ? next : "/account";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to track orders, save products and check out faster."
      footer={
        <>
          New to Bazar?{" "}
          <Link href="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link>
        </>
      }
    >
      <LoginForm next={target} />
    </AuthShell>
  );
}
