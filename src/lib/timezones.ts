import { api } from "./axios";

export type BackendTimezone = {
  /** Backend spelling; note the upstream typo is intentional. */
  locatonName?: string;
  locationName?: string;
  value?: string;
  code?: string;
  name?: string;
  offsetString?: string;
  [key: string]: unknown;
};

// The backend rejects anything that is not one of the identifiers returned by
// `GET /timezones` (it has no "UTC" entry), so a full settings PATCH must always
// carry a value resolved from that endpoint.
const FALLBACK_TIMEZONE = "Africa/Lagos";

let timezonesPromise: Promise<BackendTimezone[]> | null = null;

export async function fetchBackendTimezones(): Promise<BackendTimezone[]> {
  if (!timezonesPromise) {
    timezonesPromise = api
      .get("/timezones")
      .then((response) => {
        const body = response?.data;
        const list = body?.data ?? body ?? [];
        return Array.isArray(list) ? (list as BackendTimezone[]) : [];
      })
      .catch((error) => {
        timezonesPromise = null;
        throw error;
      });
  }
  return timezonesPromise;
}

export function timezoneIdentifier(tz: BackendTimezone | string): string {
  if (typeof tz === "string") return tz;
  return (
    tz.locatonName ??
    tz.locationName ??
    tz.value ??
    tz.code ??
    tz.name ??
    ""
  );
}

/**
 * Map any stored timezone value (IANA id, code, display name, or legacy label)
 * to an identifier the backend accepts. Falls back to the browser zone, then to
 * the first backend zone, so a settings PATCH never fails on `timezone`.
 */
export async function resolveBackendTimezone(
  value?: string | null
): Promise<string> {
  const raw = (value ?? "").trim();

  let zones: BackendTimezone[] = [];
  try {
    zones = await fetchBackendTimezones();
  } catch {
    zones = [];
  }

  if (raw) {
    const match = zones.find((tz) => {
      const id = timezoneIdentifier(tz);
      return (
        id === raw ||
        tz.locatonName === raw ||
        tz.locationName === raw ||
        tz.name === raw ||
        tz.code === raw
      );
    });
    if (match) return timezoneIdentifier(match);
  }

  const browserZone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "";
  const browserMatch = browserZone
    ? zones.find((tz) => timezoneIdentifier(tz) === browserZone)
    : undefined;
  if (browserMatch) return timezoneIdentifier(browserMatch);

  const first = zones[0];
  if (first) return timezoneIdentifier(first);

  // Network failure: keep an IANA-looking value, otherwise use a known-good one.
  return raw.includes("/") ? raw : FALLBACK_TIMEZONE;
}
