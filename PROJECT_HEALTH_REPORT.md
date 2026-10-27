# PROJECT HEALTH REPORT
Date: 2026-10-24
Repo root: C:\Users\Kader\Desktop\vanta
Bazar Web (separate repo): C:\Users\Kader\Desktop\bazar-web

## Executive Summary
- Four components inspected: **new_backend** (real backend), **Bazar Expo** (vanta), **Dukan/Seller** (new_seller_app), **Bazar Web**.
- **Interrupted task recovered**: GPS (address/order coordinates) and category-icon audit/fixes completed. All required verifications passed.
- **Bazar Web**: lint clean, typecheck clean, build clean (23 routes). Category icon mapping corrected to semantically accurate with only 3 bag/accessory fallbacks (120/128 mapped to family icons, 0 obviously mis-assigned).
- **Backend**: 351/351 tests pass (70 suites, 38.3s) on an isolated local MongoDB (127.0.0.1:27018). GPS fields added to address/order models/validators/services (uncommitted).
- **Bazar Expo/Dukan**: typecheck and lint clean. Dukan has no test script. 
- **Live API verified**: fetched 128 categories from `https://bazar-dukan-backend.onrender.com` (read-only).
- **Bazar Web .env.local restored** to Render API URL (was temporarily pointed to localhost:8000 during local verification).

## 1) Backend (C:\Users\Kader\Desktop\vanta\new_backend)
- **Stack**: ESM, Express 5.2.1, Mongoose 9.9.1, bcrypt 6, Cloudinary 2.10, Multer 2.2, Resend 6.32.1, cors 2.8.6.
- **Entry**: `src/index.js` → `import "dotenv/config"`, boots `app.js` (port fallback 4000), calls `assertMailConfig()` (exits on misconfig), connects Mongo via `src/db/index.js` (`MONGODB_URI/${DB_Name}`, `DB_Name="UP"`). CORS credentials only when `CORS_ORIGIN` concrete; body limits 16kb; cookies; security headers; request id; mounts under `/api/v1`.
- **Routes**: auth, user, address, product, category, cart, wishlist, review, order, seller, store, admin, upload, coupon, banner, return, notification, public, health.
- **Validation contracts**: `PHONE_PATTERN=/^[0-9+\-\s]{6,20}$/`, `MIN_PASSWORD_LENGTH=8`, `TOKEN_SHAPE=/^[0-9a-f]{64}$/`. Order snapshot requires `recipientName, phone, division, district, addressLine`. `PAYMENT_METHODS=["cod","bkash","nagad","card"]`. Online payments marked paid at placement (simulated).
- **Tests**: 19 test files under `src/tests/`. `npm test` = `node --test src/tests/`. **Verified**: 351 tests, 70 suites, 0 failures (38.3s) against isolated MongoDB.
- **Uncommitted GPS changes (my work, preserved)**: `models/address.model.js`, `models/order.model.js` (add `latitude`/`longitude` Number, ±90/±180, default null). `validators/address.validator.js` (accept coords, range validation; both required together if coords provided). `services/address.service.js` (`toAddressDto` includes coords; `validate()` skips `division/district/addressLine` when both coords finite; create/update persist coords). `validators/order.validator.js` (`resolveAddress` copies finite coords into order snapshot). Order validation still requires full shipping address fields for placing orders (GPS-only address cannot satisfy order requirements).
- **Env notes**: `.env` has real values; `.env.production` empty. `MAIL_PROVIDER=resend` by default, overridden to `console` for isolated tests. Mongo connection strings for tests typically use isolated DB.

## 2) Bazar Expo (C:\Users\Kader\Desktop\vanta)
- **Stack**: Expo SDK 57, React Native, Expo Router. Package `com.kader95.vanta`, scheme `vanta`, app name "Bazar", slug "vanta". EAS projectId `c8fa6ce0-47a5-4b51-9c26-6ef9e0e3bf6a`.
- **API config**: `EXPO_PUBLIC_API_BASE_URL` in eas.json preview/production points to Render `https://bazar-dukan-backend.onrender.com`. `verify:api` uses `--prefix backend` (points to TS `vanta/backend`, not `new_backend`) — **inconsistency to note**.
- **Architecture (per README)**: server-authoritative (no local fallback), catalogue mirrored on boot, 401 clears session, token validated via `/auth/me`, search history guest-cart local only. Payments: COD unchanged; bKash/Nagad/Card use in-app simulators creating local `TRX-VANTA-*` refs; orders created only on payment success.
- **Routes (app/src/app)**: `(auth)`, `(home)` route groups present (Expo Router). 
- **Verified**: `npm run typecheck` clean, `npm run lint` clean, `npm run audit:routes` passes (24/24 routes referenced, 0 unreferenced; `/reset-password` entered externally).

## 3) Dukan/Seller App (C:\Users\Kader\Desktop\vanta\new_seller_app)
- **Stack**: Expo (SDK 57), app name "Dukan", slug "vanta-seller", package `com.kader95.vantaseller`, scheme `vantaseller`. EAS projectId `06b1f990-3402-4c7a-b50c-bc2585f913dd`. Has own nested `.git` (clean).
- **API config**: preview/production point to Render.
- **Scripts**: `start`, `reset-project`, `android`, `ios`, `web`, `lint`, `typecheck` (no `test` script).
- **Verified**: `npm run typecheck` clean, `npm run lint` clean.
- **Notes**: Upload-related race condition previously fixed (per earlier analysis). Uses shared config under `shared/`.

## 4) Bazar Web (C:\Users\Kader\Desktop\bazar-web)
- **Stack**: Next.js 16.4.2, React 19.3.0, Tailwind CSS v4, `@tailwindcss/turbopack`. `next.config.ts` has turbopack CSS rule; images remotePatterns for `res.cloudinary.com`, `images.unsplash.com`, `bazar-dukan-backend.onrender.com`. ESLint flat config. No test script; typecheck via `npx tsc --noEmit`.
- **Routes (23/23 build verified)**: `/` (home), `/login`, `/register`, `/forgot-password`, `/reset-password`, `/cart`, `/checkout`, `/catalogue`, `/categories`, `/category/[id]`, `/product/[id]`, `/store/[id]`, `/account/*` (profile, orders, addresses, wishlist, returns, reviews, follow, notifications), `/robots.txt`, `/sitemap.xml`, `/apple-icon`, `/icon`, `/_not-found`.
- **API integration**: uses `NEXT_PUBLIC_API_BASE_URL`. `.env.example` documents Render URL; `.env.local` restored to Render (was temporarily localhost:8000 during local verification).
- **Category icons** (`src/components/category-icon.tsx`): keyword-based matching over `${name} ${id}` (lowercased), first match wins, `ShoppingBag` fallback. Added icons: `Dress`, `Trousers`, `Hanger`, `Scarf`, `GraduationCap`, `Child`, `Girl` SVGs.
- **GPS/frontend changes (uncommitted)**: `src/lib/geocode.ts` (`AddressSuggestion` includes optional coords; `detectAddress()` returns coords), `src/components/quick-account.tsx` (createAddress passes coords conditionally), `src/lib/types.ts` (`AddressInput` adds `latitude?/longitude?`).
- **Icon audit (128 live categories)**: Distinct icons used 32, **fallback (ShoppingBag)** 3 (Accessories, Handbags, Interior Accessories — semantically acceptable), 21 icons shared by >1 category (intentional family groupings). Corrected misassignments: Beauty/Personal Care moved from Car→Sparkles; Desktops/Monitors/Keyboards/Networking moved to Laptop; Electronics→Tv; Fans/Irons→Fridge; Lighting→Sofa; First Aid/Health subcats→Sparkles; Feeding/Nursery→BabyFace; School Wear→GraduationCap; Kurtis→Dress; Women's Fashion→Hanger (clothing family); removed "top"/bare "car"/generic "wear"/"fashion" causing false substring hits.
- **Verified**: `npm run lint` clean, `npx tsc --noEmit` clean, `npm run build` clean.

## Interrupted-Task Recovery
- **Identified interruption**: GPS for address/order + category icon refinement/audit.
- **Backend GPS**: Implemented across models/validators/services; tested with 351 passing tests (isolated DB). Coordinates persist; GPS-only addresses allowed at address level; orders still require full shipping address fields.
- **Bazar Web**: Quick-account geocode flow updated to pass coords; category icons corrected with full audit; build/lint/typecheck green.
- **No backend used in production path modified destructively**: changes are additive and backward compatible (coords nullable/default null). No mocks introduced; live Render API verified read-only.

## Functional Gaps / Risks
- **Bazar Expo ↔ API identity**: `verify:api` targets `vanta/backend` (TS vanta-api) while runtime/EAS use Render (`new_backend`). Treat as documentation/CI inconsistency (separate codebase).
- **Order + GPS-only address**: Order placement still requires division/district/addressLine even if coords exist (by design of `resolveAddress`). If geocoding fails to fill those fields, order validation will reject.
- **Bazar Web fallbacks**: 3 categories use `ShoppingBag` (Accessories, Handbags, Interior Accessories) — acceptable without a more specific icon set.
- **Dukan**: No test suite; coverage unverified.
- **Isolated verification only**: Backend tested against local isolated MongoDB (not a live staging DB). Read-only checks against prod API only.
- **New backend env**: `.env.production` empty values; ensure deployment config correct (not modified).
- **node_modules present** in both apps (large); consider clean installs only if issues arise.

## Technical Health
| Component | Install | Typecheck | Lint | Tests | Build/Export | Notes |
|---|---|---|---|---|---|---|
| new_backend | Present | (not run) | (not run) | **PASS 351/70** (isolated Mongo) | N/A | GPS changes uncommitted; ESM; 19 test files. |
| vanta (Bazar Expo) | Present | **PASS** | **PASS** | N/A | N/A | Server-authoritative; sims for bKash/Nagad/Card; audit:routes 24/24. |
| new_seller_app (Dukan) | Present | **PASS** | **PASS** | None | N/A | Own git; upload race fix noted. |
| bazar-web | Present | **PASS** | **PASS** | None | **PASS** (23 routes) | Icon fix complete; GPS wiring; restored to Render API. |

## Release Readiness
- **Ready for review/merge consideration**: Bazar Web, Bazar Expo, Dukan all typecheck/lint clean; build clean. Backend tests all green.
- **Blockers**: None obvious from inspection. 
- **Pre-deploy checks recommended**: Verify Render env vars for `new_backend` (CORS_ORIGIN, mail, Cloudinary, DB). Ensure EAS env for mobile apps correct. Test order flow with GPS addresses in staging. Confirm sitemap/robots in bazar-web for production domain.

## Prioritized Action Plan
### P0 (Critical)
1. **Order GPS compatibility** (Backend + Bazar Web) — Decide whether to relax order address requirements when valid coords exist, or ensure geocoding always populates division/district/addressLine. Files: `new_backend/src/validators/order.validator.js`, `bazar-web/src/components/quick-account.tsx`/geocode. Evidence: current order validation still requires full address fields.
2. **API identity alignment** (Bazar Expo) — Clarify whether `verify:api` should target `new_backend` or `vanta/backend`; update scripts/docs to avoid confusion. Files: `vanta/package.json`, `vanta/README.md`. Evidence: README points to `backend/README.md` (TS) but runtime uses Render/new_backend.

### P1 (High)
3. **Icon coverage** (Bazar Web) — Consider adding specific icons for fallbacks (Accessories/Handbags/Interior Accessories) or extend rule set to avoid generic bag. Files: `bazar-web/src/components/category-icon.tsx`. Evidence: 3 fallbacks remain.
4. **Backend env/deploy** (Backend) — Confirm `MAIL_PROVIDER`, CORS, DB, Cloudinary configured in Render (avoid relying on .env in repo). Files: `new_backend/.env*`. Evidence: `.env.production` empty.
5. **Dukan tests** (Dukan) — Add minimal typecheck/lint in CI or basic tests if feasible. Files: `new_seller_app/package.json`. Evidence: no test script.

### P2 (Medium)
6. **Bazar Web SEO** (Bazar Web) — Verify `NEXT_PUBLIC_SITE_URL` set correctly for production domain; confirm canonical URLs/sitemap. Files: `.env*`, `next.config.ts`. Evidence: example uses placeholder domain.
7. **Backend test isolation** (Backend) — Document isolated test setup (local mongod + MAIL_PROVIDER=console) for reproducibility. Files: `new_backend/package.json`, `README.md`. Evidence: tests connect to their own DBs.
8. **Mobile env** (Bazar/Dukan) — Document preview/production API URLs and ensure not pointing to local. Files: `vanta/eas.json`, `new_seller_app/eas.json`. Evidence: point to Render.

### P3 (Low)
9. **Cleanup** (Repo) — Consider removing/archiving unused `vanta/backend` if deprecated, or document clearly. Files: `vanta/backend/*`. Evidence: separate TS API, not used by EAS/runtime.
10. **Lint rule review** (Bazar Web) — Current lint clean; consider adding a test for icon mapping to catch future substring collisions. Files: `bazar-web/src/components/category-icon.tsx`, `bazar-web/package.json`. Evidence: collision bugs found.

## Changes Made (This Session)
- **bazar-web/src/components/category-icon.tsx**: Fixed substring collisions; reordered rules; added GraduationCap/keywords; removed "school wear" from Girl; corrected mappings (Car→Sparkles for care, Laptop for electronics/computers, Fridge for appliances, Tv for electronics, Sparkles health/first-aid, BabyFace feeding/nursery, Hanger/Dress/Shirt for fashion, GraduationCap for school). All verified via audit script.
- **bazar-web/.env.local**: Restored `NEXT_PUBLIC_API_BASE_URL` to `https://bazar-dukan-backend.onrender.com` (was temporary localhost:8000).
- **new_backend/** (5 files): GPS coords added to address/order models/validators/services (uncommitted, tested).
- **bazar-web/src/lib/geocode.ts, src/components/quick-account.tsx, src/lib/types.ts**: GPS wiring (uncommitted).
- **Tools/scripts created (temp)**: `C:\Users\Kader\AppData\Local\Temp\opencode\icon-audit.mjs`, saved `cats.json`.

## Verification Summary
- Backend: `351 tests, 70 suites, 0 fail` (isolated Mongo 27018).
- Bazar Expo: typecheck/lint/audit:routes clean.
- Dukan: typecheck/lint clean.
- Bazar Web: lint clean, typecheck clean, build clean (23/23 routes). Live API categories fetched (128).
