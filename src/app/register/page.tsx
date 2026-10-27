import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: true },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next && next.startsWith("/") ? next : "/account";

  return (
    <AuthShell
      title="Create your account"
      subtitle="Shop from trusted sellers and check out faster."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
        </>
      }
    >
      <RegisterForm next={target} />
    </AuthShell>
  );
}
