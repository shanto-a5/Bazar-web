"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";
import { QuickAccountForm } from "@/components/quick-account";
import { useSession } from "@/components/session-provider";

/**
 * Session gate for private screens.
 *
 * `login` (the default) is the general account wall: it sends a signed-out
 * visitor to the login page with a `next` so they return where they were.
 * `quick` is the ordering wall used by the cart and checkout: instead of a
 * sign-in/register choice it offers the phone-only quick account inline, so a
 * guest can go straight to ordering. Either way the guarded screen is never
 * rendered for an anonymous visitor.
 */
export function AuthGate({
  children,
  gate = "login",
}: {
  children: React.ReactNode;
  gate?: "login" | "quick";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    if (gate !== "login" || status !== "anonymous") return;
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
  }, [gate, pathname, router, status]);

  if (status === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-500" />
      </div>
    );
  }

  if (status === "authenticated") return <>{children}</>;

  if (gate === "quick") {
    return (
      <div className="mx-auto w-full max-w-md rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <QuickAccountForm />
      </div>
    );
  }

  return (
    <div className="flex justify-center py-20">
      <Spinner className="text-brand-500" />
    </div>
  );
}
