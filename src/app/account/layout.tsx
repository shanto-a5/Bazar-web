import type { Metadata } from "next";
import { AuthGate } from "@/components/auth-gate";
import { AccountNav } from "@/components/account-nav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-6">
      <AuthGate>
        <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
          <AccountNav />
          <div className="min-w-0">{children}</div>
        </div>
      </AuthGate>
    </div>
  );
}
