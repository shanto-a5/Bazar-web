import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-6xl font-black text-brand-500">404</p>
      <h1 className="text-2xl font-bold text-ink">We couldn&apos;t find that page</h1>
      <p className="max-w-md text-sm text-ink-muted">
        The page you are looking for may have been moved or no longer exists.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          Go home
        </Link>
        <Link href="/catalogue" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand-400">
          Browse products
        </Link>
      </div>
    </div>
  );
}
