"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { detectAddress } from "@/lib/geocode";

const STORAGE_KEY = "bazar.area-shopping.v1";

export interface AreaRef {
  name: string;
  slug: string;
}

interface StoredAreaRecord {
  name?: string;
  slug?: string;
  area?: string;
  pendingDiscovery?: boolean;
}

export function cleanAreaName(raw: string): string {
  return String(raw ?? "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ");
}

export function areaSlug(raw: string): string {
  return cleanAreaName(raw)
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

export function toAreaRef(raw: string): AreaRef | null {
  const name = cleanAreaName(raw);
  const slug = areaSlug(name);
  if (!name || !slug) return null;
  return { name, slug };
}

export function findKnownArea(raw: string, areas: readonly AreaRef[]): AreaRef | undefined {
  const slug = areaSlug(raw);
  if (!slug) return undefined;
  return areas.find((a) => a.slug === slug);
}

export function suggestAreas(query: string, areas: readonly AreaRef[]): AreaRef[] {
  const cleaned = cleanAreaName(query).toLowerCase();
  const slug = areaSlug(query);
  if (!cleaned) return [...areas];
  return areas.filter(
    (area) =>
      area.name.toLowerCase().includes(cleaned) ||
      (slug.length > 0 && area.slug.includes(slug)),
  );
}

export function matchAreaTokens(tokens: readonly string[], areas: readonly AreaRef[]): AreaRef | undefined {
  const haystack = tokens
    .filter(Boolean)
    .map((t) => cleanAreaName(t).toLowerCase())
    .join(" ");
  if (!haystack) return undefined;
  return areas.find(
    (a) =>
      haystack.includes(a.name.toLowerCase()) ||
      haystack.includes(a.slug.replaceAll("-", " ")),
  );
}

interface AreaContextValue {
  hydrated: boolean;
  area: AreaRef | null;
  areas: AreaRef[];
  selectorOpen: boolean;
  openSelector: () => void;
  closeSelector: () => void;
  selectKnownArea: (area: AreaRef) => Promise<void>;
  submitTypedArea: (typedName: string) => Promise<void>;
}

const AreaContext = createContext<AreaContextValue | null>(null);

function readSavedArea(): { area: AreaRef | null; pendingDiscovery: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { area: null, pendingDiscovery: false };
    const parsed = JSON.parse(raw) as StoredAreaRecord;
    const candidateName = parsed.name || parsed.area || "";
    const candidateSlug = parsed.slug || areaSlug(candidateName);
    const ref = toAreaRef(candidateName);
    if (!ref) return { area: null, pendingDiscovery: false };
    return {
      area: { name: ref.name, slug: candidateSlug || ref.slug },
      pendingDiscovery: Boolean(parsed.pendingDiscovery),
    };
  } catch {
    return { area: null, pendingDiscovery: false };
  }
}

function writeSavedArea(area: AreaRef, pendingDiscovery: boolean): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: area.name,
        slug: area.slug,
        area: area.slug,
        pendingDiscovery,
      }),
    );
  } catch {
    // Private browsing or quota full; keep in-memory state.
  }
}

export function AreaProvider({ children }: { children: React.ReactNode }) {
  const api = getBrowserApi();
  const [hydrated, setHydrated] = useState(false);
  const [area, setArea] = useState<AreaRef | null>(null);
  const [areas, setAreas] = useState<AreaRef[]>([]);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const { area: saved, pendingDiscovery } = readSavedArea();
    void Promise.resolve().then(() => {
      if (!active) return;
      setArea(saved);
      setHydrated(true);
    });

    if (saved && pendingDiscovery) {
      void api
        .discoverArea(saved.name)
        .then(() => {
          if (active) writeSavedArea(saved, false);
        })
        .catch(() => undefined);
    }

    void api
      .areas()
      .then(({ areas: result }) => {
        if (!active) return;
        setAreas(result);
        if (saved) {
          const match = result.find((a) => a.slug === saved.slug);
          if (match && match.name !== saved.name) {
            setArea(match);
            writeSavedArea(match, false);
          }
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [api]);

  const selectKnownArea = useCallback(async (picked: AreaRef) => {
    const clean = toAreaRef(picked.name) ?? picked;
    const next: AreaRef = { name: clean.name, slug: picked.slug || clean.slug };
    writeSavedArea(next, false);
    setArea(next);
    setSelectorOpen(false);
  }, []);

  const submitTypedArea = useCallback(
    async (typedName: string) => {
      const ref = toAreaRef(typedName);
      if (!ref) return;
      const known = findKnownArea(ref.name, areas);
      if (known) {
        await selectKnownArea(known);
        return;
      }
      let reported = false;
      try {
        await api.discoverArea(ref.name);
        reported = true;
      } catch {
        reported = false;
      }
      writeSavedArea(ref, !reported);
      setArea(ref);
      setSelectorOpen(false);
    },
    [api, areas, selectKnownArea],
  );

  const openSelector = useCallback(() => {
    setSelectorOpen(true);
    void api
      .areas()
      .then(({ areas: result }) => setAreas(result))
      .catch(() => undefined);
  }, [api]);

  const closeSelector = useCallback(() => {
    if (area) setSelectorOpen(false);
  }, [area]);

  const value = useMemo<AreaContextValue>(
    () => ({
      hydrated,
      area,
      areas,
      selectorOpen,
      openSelector,
      closeSelector,
      selectKnownArea,
      submitTypedArea,
    }),
    [hydrated, area, areas, selectorOpen, openSelector, closeSelector, selectKnownArea, submitTypedArea],
  );

  const mustSelect = hydrated && (!area || selectorOpen);

  return (
    <AreaContext.Provider value={value}>
      {children}
      {mustSelect && <AreaSelectorModal canClose={Boolean(area)} />}
    </AreaContext.Provider>
  );
}

export function useArea(): AreaContextValue {
  const ctx = useContext(AreaContext);
  if (!ctx) {
    throw new Error("useArea must be used within AreaProvider");
  }
  return ctx;
}

function AreaSelectorModal({ canClose }: { canClose: boolean }) {
  const { area: current, areas, selectKnownArea, submitTypedArea, closeSelector } = useArea();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const suggestions = useMemo(() => suggestAreas(typed, areas), [typed, areas]);
  const exact = useMemo(() => findKnownArea(typed, areas), [typed, areas]);
  const typedRef = useMemo(() => toAreaRef(typed), [typed]);

  const choose = useCallback(
    async (picked: AreaRef, isCustom: boolean) => {
      if (busy) return;
      setBusy(true);
      setNotice(null);
      try {
        if (isCustom) {
          await submitTypedArea(picked.name);
        } else {
          await selectKnownArea(picked);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, selectKnownArea, submitTypedArea],
  );

  const submitTyped = useCallback(
    (event?: React.FormEvent) => {
      event?.preventDefault();
      if (!typedRef) {
        setNotice("অনুগ্রহ করে আপনার এলাকার নাম লিখুন (Please type your area name).");
        return;
      }
      void choose(exact ?? typedRef, !exact);
    },
    [typedRef, exact, choose],
  );

  const locateWithGps = useCallback(async () => {
    setNotice(null);
    const result = await detectAddress();
    if (!result.ok) {
      setNotice("We could not detect your location. Please pick or type your area.");
      return;
    }
    const matched = matchAreaTokens(
      [result.suggestion.area, result.suggestion.district, result.suggestion.division],
      areas,
    );
    if (matched) {
      await choose(matched, false);
    } else if (result.suggestion.area) {
      setTyped(result.suggestion.area);
      setNotice("Location detected. Confirm or choose your area below.");
    } else {
      setNotice("We could not match your location. Please pick or type your area.");
    }
  }, [areas, choose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="area-selector-title"
      className="fixed inset-0 z-50 flex flex-col bg-canvas p-4 sm:items-center sm:justify-center sm:p-6"
    >
      <div className="flex h-full w-full max-w-lg flex-col rounded-3xl border border-line bg-surface p-5 shadow-xl sm:h-auto sm:max-h-[85vh] sm:p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-lg font-black text-white">
              B
            </span>
            <span className="text-xl font-extrabold tracking-tight text-brand-600">Bazar</span>
          </div>
          {canClose && (
            <button
              type="button"
              onClick={closeSelector}
              aria-label="Close area selector"
              className="grid h-9 w-9 place-items-center rounded-full text-lg font-bold text-ink-muted hover:bg-surface-muted"
            >
              ✕
            </button>
          )}
        </div>

        <h1 id="area-selector-title" className="mt-4 text-2xl font-extrabold text-ink">
          আপনার এলাকা বাছাই করুন
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Choose your area to see shops near you</p>

        <form onSubmit={submitTyped} className="mt-4 flex gap-2">
          <input
            type="text"
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
              setNotice(null);
            }}
            placeholder="এলাকার নাম লিখুন (Type your area)"
            aria-label="Your area name"
            autoFocus
            className="min-w-0 flex-1 rounded-2xl border-2 border-brand-500 bg-white px-4 py-3 text-base font-medium text-ink outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            বাছাই করুন
          </button>
        </form>

        {notice && <p className="mt-2 text-sm font-semibold text-danger">{notice}</p>}

        <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
          {typedRef && !exact && (
            <button
              type="button"
              onClick={() => submitTyped()}
              disabled={busy}
              className="w-full rounded-2xl bg-brand-500 p-4 text-left text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
            >
              <div className="text-base font-extrabold">
                “{typedRef.name}” — এই এলাকা ব্যবহার করুন
              </div>
              <div className="mt-0.5 text-xs text-white/90">
                Use this area. We will notify local sellers!
              </div>
            </button>
          )}

          {suggestions.map((item) => {
            const selected = current?.slug === item.slug;
            return (
              <button
                key={item.slug}
                type="button"
                disabled={busy}
                onClick={() => void choose(item, false)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                  selected
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-line bg-canvas text-ink hover:border-brand-300 hover:bg-surface-muted"
                }`}
              >
                <span className="text-base font-bold">{item.name}</span>
                {selected && <span className="text-lg font-extrabold text-brand-600">✓</span>}
              </button>
            );
          })}

          {areas.length === 0 && !typedRef && (
            <p className="py-6 text-center text-sm text-ink-muted">
              এলাকার নাম লিখে দিন। Type the name of your village or area above.
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void locateWithGps()}
          className="mt-4 w-full rounded-2xl border border-line bg-surface-muted px-4 py-3 text-center text-sm font-bold text-ink hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
        >
          📍 আমার অবস্থান ব্যবহার করুন · Use my location
        </button>
      </div>
    </div>
  );
}
