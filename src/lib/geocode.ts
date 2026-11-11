/**
 * Best-effort browser location helpers for quick checkout.
 *
 * Uses the browser Geolocation API and OpenStreetMap Nominatim for reverse
 * geocoding. Everything is optional: if permission is denied, the browser has
 * no geolocation, or the lookup fails, callers fall back to manual entry.
 */

export interface AddressSuggestion {
  division: string;
  district: string;
  area: string;
  addressLine: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export type LocationResult =
  | { ok: true; suggestion: AddressSuggestion }
  | { ok: false; reason: "unsupported" | "denied" | "unavailable" | "timeout" | "lookup_failed" };

/** Parse the latitude, longitude pair copied from Google Maps. */
export function parseCoordinates(value: string): { latitude: number; longitude: number } | null {
  const raw = value.trim();
  const pair = raw.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  const urlPair = raw.match(/(?:@|[?&](?:q|query|ll)=|!3d)(-?\d+(?:\.\d+)?)[,%!]+(-?\d+(?:\.\d+)?)/i);
  const match = pair || urlPair;
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export async function resolveMapsCoordinates(value: string): Promise<{ latitude: number; longitude: number } | null> {
  const direct = parseCoordinates(value);
  if (direct) return direct;
  try {
    const url = new URL(value.trim());
    if (!/(^|\.)((maps\.app\.goo\.gl)|(goo\.gl)|(google\.com)|(google\.co\.[a-z.]+))$/i.test(url.hostname)) return null;
    const response = await fetch("/api/resolve-maps-coordinates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.toString() }),
    });
    if (!response.ok) return null;
    const result = await response.json() as { latitude?: number; longitude?: number };
    return parseCoordinates(`${result.latitude},${result.longitude}`);
  } catch { return null; }
}

const CACHED_GPS_STORAGE_KEY = "bazar.cached_gps.v1";

let cachedLocationSuggestion: AddressSuggestion | null = null;
let permissionDenied = false;
let prefetchStarted = false;

function setCachedLocation(next: AddressSuggestion | null): void {
  cachedLocationSuggestion = next;
  if (typeof window === "undefined") return;
  try {
    if (next) {
      window.localStorage.setItem(CACHED_GPS_STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(CACHED_GPS_STORAGE_KEY);
    }
  } catch {
    /* ignore storage errors */
  }
}

export function getCachedLocation(): AddressSuggestion | null {
  if (permissionDenied) return null;
  if (cachedLocationSuggestion) return cachedLocationSuggestion;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHED_GPS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AddressSuggestion>;
    if (
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number" &&
      Number.isFinite(parsed.latitude) &&
      Number.isFinite(parsed.longitude)
    ) {
      cachedLocationSuggestion = {
        division: parsed.division ?? "",
        district: parsed.district ?? "",
        area: parsed.area ?? "",
        addressLine: parsed.addressLine ?? "",
        postalCode: parsed.postalCode ?? "",
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      };
      return cachedLocationSuggestion;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

function getLastKnownOrBalancedPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    // 1. Try cached/last-known position first for instant results
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        if (err.code === 1) {
          reject(err);
          return;
        }
        // 2. Fallback to balanced-accuracy current position
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: 5 * 60_000,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 1500,
        maximumAge: Infinity,
      },
    );
  });
}

async function reverseGeocodeCoords(latitude: number, longitude: number): Promise<AddressSuggestion> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      return { division: "", district: "", area: "", addressLine: "", latitude, longitude };
    }
    const data = (await response.json()) as {
      address?: Record<string, string>;
      display_name?: string;
    };
    const address = data.address ?? {};
    const division = address.state || address.region || address.province || "";
    const district = address.state_district || address.county || address.city || address.town || address.village || "";
    const area = address.suburb || address.neighbourhood || address.city_district || address.quarter || "";
    const addressLine =
      [address.house_number, address.road].filter(Boolean).join(" ") ||
      address.amenity ||
      address.building ||
      address.display_name ||
      "";
    const postalCode = address.postcode || "";
    return { division, district, area, addressLine, postalCode, latitude, longitude };
  } catch {
    return { division: "", district: "", area: "", addressLine: "", latitude, longitude };
  }
}

/**
 * Upfront, non-blocking location prefetch on app launch.
 */
export function prefetchLocation(): void {
  if (typeof window === "undefined" || prefetchStarted) return;
  prefetchStarted = true;
  // Prime in-memory cache from localStorage if available
  getCachedLocation();

  void (async () => {
    try {
      const position = await getLastKnownOrBalancedPosition();
      permissionDenied = false;
      const { latitude, longitude } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      // Save coordinates immediately so Quick Account can consume them without waiting on reverse geocoding
      setCachedLocation({
        division: "",
        district: "",
        area: "",
        addressLine: "",
        latitude,
        longitude,
      });

      const enriched = await reverseGeocodeCoords(latitude, longitude);
      setCachedLocation(enriched);
    } catch (error) {
      const code = (error as GeolocationPositionError)?.code;
      if (code === 1) {
        permissionDenied = true;
        setCachedLocation(null);
      }
    }
  })();
}

export async function detectAddress(): Promise<LocationResult> {
  const cached = getCachedLocation();
  if (cached) {
    return { ok: true, suggestion: cached };
  }
  let position: GeolocationPosition;
  try {
    position = await getLastKnownOrBalancedPosition();
  } catch (error) {
    const code = (error as GeolocationPositionError)?.code;
    if (code === 1) {
      permissionDenied = true;
      setCachedLocation(null);
      return { ok: false, reason: "denied" };
    }
    if (code === 3) return { ok: false, reason: "timeout" };
    return { ok: false, reason: (error as Error)?.message === "unsupported" ? "unsupported" : "unavailable" };
  }

  const { latitude, longitude } = position.coords;
  const suggestion = await reverseGeocodeCoords(latitude, longitude);
  setCachedLocation(suggestion);
  return { ok: true, suggestion };
}
