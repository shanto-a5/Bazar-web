"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { useSession } from "@/components/session-provider";
import { getBrowserApi } from "@/lib/api/bazar-api";
import type { Category } from "@/lib/types";

export function Header({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { status, user, logout } = useSession();
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const authenticated = status === "authenticated";
  const shownCartCount = authenticated ? cartCount : null;
  const shownUnread = authenticated ? unread : 0;

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    const api = getBrowserApi();
    api
      .cart()
      .then((cart) => active && setCartCount(cart.itemCount))
      .catch(() => active && setCartCount(null));
    api
      .unreadNotificationCount()
      .then((r) => active && setUnread(r.unreadCount))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [authenticated]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/catalogue?search=${encodeURIComponent(term)}` : "/catalogue");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Bazar home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-lg font-black text-white">
            B
          </span>
          <span className="hidden text-xl font-extrabold tracking-tight text-brand-600 sm:block">Bazar</span>
        </Link>

        <form onSubmit={onSubmit} role="search" className="flex min-w-0 flex-1 items-center">
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <div className="flex w-full items-center rounded-full border border-line bg-surface-muted focus-within:border-brand-400">
            <input
              id="site-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, brands and stores"
              className="h-10 w-full rounded-full bg-transparent px-4 text-sm outline-none placeholder:text-ink-faint"
            />
            <button
              type="submit"
              className="m-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500 text-white hover:bg-brand-600"
              aria-label="Search"
            >
              <SearchIcon />
            </button>
          </div>
        </form>

        <nav className="flex items-center gap-1">
          <Link
            href="/account/wishlist"
            className="hidden h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-brand-600 sm:grid"
            aria-label="Wishlist"
          >
            <HeartIcon />
          </Link>
          <Link
            href="/account/notifications"
            className="relative hidden h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-brand-600 sm:grid"
            aria-label="Notifications"
          >
            <BellIcon />
            {shownUnread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {shownUnread > 9 ? "9+" : shownUnread}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-brand-600"
            aria-label="Cart"
          >
            <CartIcon />
            {shownCartCount !== null && shownCartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {shownCartCount > 9 ? "9+" : shownCartCount}
              </span>
            )}
          </Link>

          {authenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-line px-2 py-1.5 text-sm font-medium hover:border-brand-400"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-24 truncate md:block">{user?.name ?? "Account"}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface-muted"
                  >
                    My account
                  </Link>
                  <Link
                    href="/account/orders"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface-muted"
                  >
                    My orders
                  </Link>
                  <Link
                    href="/account/wishlist"
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    Wishlist
                  </Link>
                  <Link
                    href="/account/notifications"
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    Notifications
                    {shownUnread > 0 && <Badge tone="brand" className="ml-2">{shownUnread}</Badge>}
                  </Link>
                  <Link
                    href="/account/addresses"
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    Addresses
                  </Link>
                  <hr className="my-1 border-line" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void logout();
                    }}
                    className="block w-full px-4 py-2 text-left text-sm font-medium text-danger hover:bg-danger-soft"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button size="sm" className="ml-1" onClick={() => router.push("/login")}>
              Sign in
            </Button>
          )}
        </nav>
      </div>

      {categories.length > 0 && (
        <div className="border-t border-line bg-surface">
          <div className="container-page no-scrollbar flex items-center gap-1 overflow-x-auto py-1.5 text-sm">
            {categories.slice(0, 12).map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-ink-muted hover:bg-brand-50 hover:text-brand-700"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.5" fill="currentColor" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 20s-7-4.6-7-9.6A4 4 0 0 1 12 7a4 4 0 0 1 7 3.4c0 5-7 9.6-7 9.6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5 1.5 5h-15S6 13 6 9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
