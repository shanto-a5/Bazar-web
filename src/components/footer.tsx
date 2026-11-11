"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { siteName } from "@/lib/config";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="text-lg font-extrabold tracking-tight text-brand-600">{siteName}</p>
          <p className="mt-2 text-sm text-ink-muted">{t("footerTagline")}</p>
        </div>
        <nav aria-label={t("shopHeading")} className="text-sm">
          <h2 className="mb-3 font-semibold text-ink">{t("shopHeading")}</h2>
          <ul className="space-y-2 text-ink-muted">
            <li>
              <Link className="hover:text-brand-600" href="/catalogue">
                {t("allProducts")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-600" href="/categories">
                {t("categories")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-600" href="/catalogue?sort=new">
                {t("newArrivals")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-600" href="/settings">
                {t("settings")}
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={t("account")} className="text-sm">
          <h2 className="mb-3 font-semibold text-ink">{t("account")}</h2>
          <ul className="space-y-2 text-ink-muted">
            <li>
              <Link className="hover:text-brand-600" href="/account">
                {t("myAccount")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-600" href="/account/orders">
                {t("myOrders")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-600" href="/account/wishlist">
                {t("wishlist")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-600" href="/account/addresses">
                {t("addresses")}
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={t("supportHeading")} className="text-sm">
          <h2 className="mb-3 font-semibold text-ink">{t("supportHeading")}</h2>
          <ul className="space-y-2 text-ink-muted">
            <li>
              <Link className="hover:text-brand-600" href="/help">
                {t("helpCentre")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-600" href="/help#returns">
                {t("returns")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-brand-600" href="/help#delivery">
                {t("delivery")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line py-5">
        <p className="container-page text-center text-xs text-ink-faint">
          © {year} {siteName}. {t("allRightsReserved")}
        </p>
      </div>
    </footer>
  );
}
