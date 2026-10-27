"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/components/ui";
import { useSession } from "@/components/session-provider";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "My orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/reviews", label: "My reviews" },
  { href: "/account/following", label: "Followed stores" },
  { href: "/account/profile", label: "Profile & security" },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();

  return (
    <div className="flex flex-col gap-2">
      {user && (
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <p className="truncate font-semibold text-ink">{user.name}</p>
          <p className="truncate text-sm text-ink-muted">{user.email}</p>
        </div>
      )}
      <nav
        aria-label="Account"
        className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0"
      >
        {LINKS.map((link) => {
          const active = link.href === "/account" ? pathname === "/account" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-brand-50 text-brand-700" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        className="self-start rounded-lg px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger-soft"
        onClick={async () => {
          await logout(false);
          router.push("/");
        }}
      >
        Sign out
      </button>
    </div>
  );
}