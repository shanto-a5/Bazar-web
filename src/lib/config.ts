/** Public runtime configuration. Only `NEXT_PUBLIC_*` values are available in the browser. */

const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** Base URL of the Bazar API, without a trailing slash. Empty means "not configured". */
export const apiBaseUrl = rawApiBase.replace(/\/+$/, "");

/** Public origin of this website, without a trailing slash. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

/** Abort a request after this many milliseconds. */
export const requestTimeoutMs = 15_000;

/** Default revalidation window (seconds) for public catalogue reads. */
export const catalogRevalidateSeconds = 60;

/** Site name used in titles, Open Graph and structured data. */
export const siteName = "Bazar";

/** Default meta description. */
export const siteDescription =
  "Shop thousands of products from trusted sellers across Bangladesh. Fast delivery, secure checkout and cash on delivery.";
