"use client";

import { createContext, useContext, useEffect, useId, useMemo, useState } from "react";
import { Alert, Button, Field, Input } from "@/components/ui";
import { useSession } from "@/components/session-provider";
import { getBrowserApi } from "@/lib/api/bazar-api";
import { ApiError } from "@/lib/api/client";
import { detectAddress, parseCoordinates } from "@/lib/geocode";

/**
 * Frictionless guest ordering (phone-only "quick account", M14).
 *
 * The backend cart is per-account, so a signed-out shopper cannot add to it.
 * Rather than send them to a login/register wall, the purchase action opens
 * this prompt, which asks for a phone number only. The server mints the
 * account (name, email and password) and returns a session; the deferred
 * purchase then continues on the normal authenticated flow. Location is
 * best-effort and becomes a saved, editable delivery address.
 */

/** The backend's own phone rule, so anything accepted here is accepted there. */
const PHONE_PATTERN = /^[0-9+\-\s]{6,20}$/;

export interface QuickAccountRequest {
  /** Runs once the session exists; the deferred purchase continues here. */
  onAuthenticated?: () => void;
  /** Runs when the visitor closes the prompt without creating an account. */
  onDismiss?: () => void;
}

interface QuickAccountContextValue {
  present: (request?: QuickAccountRequest) => void;
}

const QuickAccountContext = createContext<QuickAccountContextValue | null>(null);

export function useQuickAccount(): QuickAccountContextValue {
  const value = useContext(QuickAccountContext);
  if (!value) throw new Error("useQuickAccount must be used within a QuickAccountProvider");
  return value;
}

/** True once every field the address API requires has been supplied. */
function isCompleteAddress(address: { division: string; district: string; addressLine: string }): boolean {
  return Boolean(address.division && address.district && address.addressLine);
}

/**
 * True when a suggestion has enough to be saved to the address book.
 * Valid GPS coordinates alone are enough — the text fields (division, district,
 * addressLine) improve the record but must not prevent it from being saved when
 * reverse-geocoding returns partial results.
 */
function isSaveableAddress(suggestion: {
  division: string;
  district: string;
  addressLine: string;
  latitude?: number;
  longitude?: number;
}): boolean {
  const hasCoords =
    suggestion.latitude !== undefined &&
    suggestion.longitude !== undefined &&
    Number.isFinite(suggestion.latitude) &&
    Number.isFinite(suggestion.longitude);
  return hasCoords || isCompleteAddress(suggestion);
}

/**
 * Phone-only onboarding form. `onSuccess` fires after the session is live (and
 * any captured address saved); when it is omitted the caller relies on the
 * session flipping to authenticated and re-rendering.
 */
export function QuickAccountForm({ onSuccess }: { onSuccess?: () => void }) {
  const { quickAccount } = useSession();
  const phoneId = useId();
  const [phone, setPhone] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [locationFallback, setLocationFallback] = useState(false);
  const [coordinateText, setCoordinateText] = useState("");
  const [coordinateError, setCoordinateError] = useState<string | null>(null);
  const manualCoordinates = parseCoordinates(coordinateText);

  async function submit(withLocation: boolean, coordinates?: { latitude: number; longitude: number }) {
    const trimmed = phone.trim();
    if (!PHONE_PATTERN.test(trimmed)) {
      setFieldError("Enter a valid phone number.");
      return;
    }
    setFieldError(undefined);
    setFormError(null);
    setBusy(true);

    let suggestion: { division: string; district: string; area: string; addressLine: string; latitude?: number; longitude?: number } | null =
      coordinates ? { division: "", district: "", area: "", addressLine: "", ...coordinates } : null;
    if (withLocation) {
      setPhase("Getting your location…");
      const result = await detectAddress();
      if (result.ok) {
        suggestion = result.suggestion;
      } else {
        setLocationFallback(true);
        setBusy(false);
        setPhase(null);
        return;
      }
    }

    setPhase("Setting up your account…");
    try {
      const user = await quickAccount(trimmed);
      if (suggestion && isSaveableAddress(suggestion)) {
        // Best-effort: a failed save must never block ordering. The route to
        // checkout still works and the customer can edit the address there.
        await getBrowserApi()
          .createAddress({
            label: "Current location",
            recipientName: user.name,
            phone: trimmed,
            division: suggestion.division,
            district: suggestion.district,
            area: suggestion.area,
            addressLine: suggestion.addressLine,
            isDefault: true,
            ...(suggestion.latitude !== undefined && suggestion.longitude !== undefined
              ? { latitude: suggestion.latitude, longitude: suggestion.longitude }
              : {}),
          })
          .catch(() => undefined);
      }
      onSuccess?.();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "We couldn't set up your account. Please try again.",
      );
      setBusy(false);
      setPhase(null);
    }
  }

  function submitCoordinates() {
    const coordinates = parseCoordinates(coordinateText);
    if (!coordinates) {
      setCoordinateError("Enter two valid numbers as latitude, longitude. Latitude must be −90 to 90 and longitude −180 to 180.");
      return;
    }
    setCoordinateError(null);
    void submit(false, coordinates);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-ink">Just your number</h2>
        <p className="mt-1 text-sm text-ink-muted">
          No password to remember. Add your phone number and we&apos;ll set up your account so you can
          place the order.
        </p>
      </div>

      <Field
        label="Phone number"
        htmlFor={phoneId}
        error={fieldError}
        hint="We only use this to reach you about your orders."
      >
        <Input
          id={phoneId}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit(false);
            }
          }}
          placeholder="01XXXXXXXXX"
          disabled={busy}
        />
      </Field>

      {formError && <Alert>{formError}</Alert>}

      {locationFallback && (
        <div className="rounded-xl border border-line bg-surface-muted p-4" aria-live="polite">
          <h3 className="font-semibold text-ink">Use coordinates from Google Maps</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Your device or browser couldn&apos;t share your location. Open Google Maps, tap the blue dot to find your current location, then copy its coordinates and paste them below. You can also continue without saving a location.
          </p>
          <a className="mt-2 inline-block text-sm font-semibold text-brand-600 underline" href="https://maps.google.com/" target="_blank" rel="noreferrer">
            Open Google Maps
          </a>
          <Field label="Coordinates (latitude, longitude)" htmlFor="quick-account-coordinates" error={coordinateError ?? undefined} hint="Example: 23.8103, 90.4125">
            <Input id="quick-account-coordinates" inputMode="decimal" autoComplete="off" placeholder="23.8103, 90.4125" value={coordinateText} onChange={(event) => { setCoordinateText(event.target.value); setCoordinateError(null); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); submitCoordinates(); } }} disabled={busy} />
          </Field>
          <div className="mt-3 flex flex-col gap-2">
            {manualCoordinates ? (
              <>
                <Button size="lg" fullWidth disabled={busy} onClick={submitCoordinates}>
                  {busy ? (phase ?? "Setting up…") : "Continue"}
                </Button>
                <Button variant="outline" size="lg" fullWidth disabled={busy} onClick={() => void submit(false)}>
                  Continue without location
                </Button>
                <button type="button" className="self-center px-2 py-1 text-sm font-medium text-brand-600 underline disabled:opacity-50" disabled={busy} onClick={() => void submit(true)}>
                  Get my current location (optional)
                </button>
              </>
            ) : (
              <>
                <Button size="lg" fullWidth disabled={busy} onClick={() => void submit(true)}>
                  {busy ? (phase ?? "Getting your location…") : "Try my current location"}
                </Button>
                <Button variant="outline" size="lg" fullWidth disabled={busy} onClick={() => void submit(false)}>
                  Continue without location
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {!locationFallback && <div className="flex flex-col gap-2">
        <Button size="lg" fullWidth disabled={busy} onClick={() => void submit(true)}>
          {busy ? (phase ?? "Setting up…") : "Use my location & continue"}
        </Button>
        <Button variant="outline" size="lg" fullWidth disabled={busy} onClick={() => void submit(false)}>
          Continue without location
        </Button>
      </div>}
    </div>
  );
}

function QuickAccountDialog({
  onClose,
  onAuthenticated,
}: {
  onClose: () => void;
  onAuthenticated: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Order with your phone number"
        className="relative max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto rounded-t-2xl border border-line bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-2xl sm:pb-5"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-surface-muted"
        >
          ✕
        </button>
        <QuickAccountForm onSuccess={onAuthenticated} />
      </div>
    </div>
  );
}

export function QuickAccountProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<QuickAccountRequest | null>(null);

  const value = useMemo<QuickAccountContextValue>(
    () => ({ present: (next) => setRequest(next ?? {}) }),
    [],
  );

  return (
    <QuickAccountContext.Provider value={value}>
      {children}
      {request && (
        <QuickAccountDialog
          onClose={() => {
            const after = request.onDismiss;
            setRequest(null);
            after?.();
          }}
          onAuthenticated={() => {
            const after = request.onAuthenticated;
            setRequest(null);
            after?.();
          }}
        />
      )}
    </QuickAccountContext.Provider>
  );
}
