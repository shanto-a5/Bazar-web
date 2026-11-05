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
  const match = value.trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))$/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 5 * 60_000,
    });
  });
}

export async function detectAddress(): Promise<LocationResult> {
  let position: GeolocationPosition;
  try {
    position = await getCurrentPosition();
  } catch (error) {
    const code = (error as GeolocationPositionError)?.code;
    if (code === 1) return { ok: false, reason: "denied" };
    if (code === 3) return { ok: false, reason: "timeout" };
    return { ok: false, reason: (error as Error)?.message === "unsupported" ? "unsupported" : "unavailable" };
  }

  const { latitude, longitude } = position.coords;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      return { ok: true, suggestion: { division: "", district: "", area: "", addressLine: "", latitude, longitude } };
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
    return { ok: true, suggestion: { division, district, area, addressLine, postalCode, latitude, longitude } };
  } catch {
    return { ok: true, suggestion: { division: "", district: "", area: "", addressLine: "", latitude, longitude } };
  }
}
