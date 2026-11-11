"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { useArea } from "@/components/area-provider";
import { useLanguage } from "@/components/language-provider";
import { useQuickCommerce } from "@/components/quick-commerce";
import { useSession } from "@/components/session-provider";
import { getBrowserApi } from "@/lib/api/bazar-api";

export function Header() {
  const router = useRouter();
  const { area, openSelector } = useArea();
  const { t } = useLanguage();
  const { cartCount, cartBouncing, openMiniCart } = useQuickCommerce();
  const { status, user, logout } = useSession();
  const [query, setQuery] = useState("");
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const authenticated = status === "authenticated";
  const shownUnread = authenticated ? unread : 0;

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    const api = getBrowserApi();
    api
      .unreadNotificationCount()
      .then((r) => active && setUnread(r.unreadCount))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [authenticated]);

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ unreadCount: number }>).detail;
      if (typeof detail?.unreadCount === "number") setUnread(detail.unreadCount);
    };
    window.addEventListener("bazar:notification-sync", sync);
    return () => window.removeEventListener("bazar:notification-sync", sync);
  }, []);

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
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={t("homeAria")}>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-lg font-black text-white">
            B
          </span>
          <span className="hidden text-xl font-extrabold tracking-tight text-brand-600 sm:block">Bazar</span>
        </Link>

        <button
          type="button"
          onClick={openSelector}
          aria-label={`${t("shoppingAreaAria")}: ${area?.name ?? t("selectArea")}`}
          className="flex max-w-44 shrink-0 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:border-brand-400 hover:bg-brand-100 sm:text-sm"
        >
          <span aria-hidden>📍</span>
          <span className="truncate">{area?.name ?? t("selectArea")}</span>
          <span aria-hidden className="text-[10px]">▾</span>
        </button>

        <form onSubmit={onSubmit} role="search" className="flex min-w-0 flex-1 items-center">
          <label htmlFor="site-search" className="sr-only">
            {t("searchProductsLabel")}
          </label>
          <div className="flex w-full items-center rounded-full border border-line bg-surface-muted focus-within:border-brand-400">
            <input
              id="site-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-10 w-full rounded-full bg-transparent px-4 text-sm outline-none placeholder:text-ink-faint"
            />
            <button
              type="submit"
              className="m-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500 text-white hover:bg-brand-600"
              aria-label={t("search")}
            >
              <SearchIcon />
            </button>
          </div>
        </form>

        <nav className="flex items-center gap-1">
          <Link
            href="/settings"
            className="grid h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-brand-600"
            aria-label={t("settings")}
          >
            <SettingsIcon />
          </Link>
          <Link
            href="/account/wishlist"
            className="hidden h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-brand-600 sm:grid"
            aria-label={t("wishlist")}
          >
            <HeartIcon />
          </Link>
          <Link
            href="/account/notifications"
            className="relative hidden h-10 w-10 place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-brand-600 sm:grid"
            aria-label={t("notifications")}
          >
            <BellIcon />
            {shownUnread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {shownUnread > 9 ? "9+" : shownUnread}
              </span>
            )}
          </Link>

          {/* STEP 4.1: Animated Cart header icon opening Mini-Cart instead of navigating to /cart */}
          <button
            type="button"
            onClick={openMiniCart}
            className={`relative grid h-10 w-10 place-items-center rounded-full text-ink-muted transition-transform duration-200 hover:bg-surface-muted hover:text-brand-600 ${
              cartBouncing ? "scale-125 bg-brand-50 text-brand-600" : "scale-100"
            }`}
            aria-label={t("cart")}
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>

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
                <span className="hidden max-w-24 truncate md:block">{user?.name ?? t("account")}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface-muted"
                  >
                    {t("myAccount")}
                  </Link>
                  <Link
                    href="/account/orders"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface-muted"
                  >
                    {t("myOrders")}
                  </Link>
                  <Link
                    href="/account/wishlist"
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("wishlist")}
                  </Link>
                  <Link
                    href="/account/notifications"
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("notifications")}
                    {shownUnread > 0 && (
                      <Badge tone="brand" className="ml-2">
                        {shownUnread}
                      </Badge>
                    )}
                  </Link>
                  <Link
                    href="/account/addresses"
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("addresses")}
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t("settings")}
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
                    {t("signOut")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button size="sm" className="ml-1" onClick={() => router.push("/login")}>
              {t("signIn")}
            </Button>
          )}
        </nav>
      </div>
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
      <path
        d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.5" fill="currentColor" />
      <circle cx="18" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20s-7-4.6-7-9.6A4 4 0 0 1 12 7a4 4 0 0 1 7 3.4c0 5-7 9.6-7 9.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5 1.5 5h-15S6 13 6 9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
