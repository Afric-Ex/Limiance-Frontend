/**
 * Single source of truth for turning deployment configuration into backend base
 * URLs.
 *
 * Both `next.config.ts` (which builds the `/proxy`, `/proxy-root` and
 * `/ws-proxy` rewrites) and the browser/server axios clients read the result, so
 * the `/api/v1` prefix can never be doubled on one side and missing on the other.
 *
 * This module runs in Node (config load) *and* in the browser bundle, so it must
 * stay dependency-free and must never log the configured value.
 */

export interface BackendUrls {
  /** Origin + everything up to and including `/api/v1`. */
  apiBaseUrl: string;
  /** Same origin with the `/api/v1` suffix removed. */
  rootBaseUrl: string;
}

/** Trailing slashes are noise in a config value and break naive concatenation. */
const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

/**
 * Only absolute http(s) origins are accepted.
 *
 * The rewrite destinations interpolate this value, so anything else would either
 * crash config load or — for a scheme-relative `//evil.example` — silently
 * re-point the proxy at an attacker-chosen host. Refusing is the only safe
 * answer: a misconfigured deployment should fail loudly, not proxy somewhere
 * unexpected.
 */
const isSafeOrigin = (value: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
  // Credentials in the URL would be sent on every proxied request.
  if (parsed.username || parsed.password) return false;
  // Query/fragment in a base URL are almost certainly a config mistake.
  if (parsed.search || parsed.hash) return false;
  return Boolean(parsed.hostname);
};

/**
 * Normalize a configured backend URL into its API and root forms.
 *
 * Accepts either shape that deployments use in practice:
 *   https://host              -> api: https://host/api/v1, root: https://host
 *   https://host/api/v1       -> api: https://host/api/v1, root: https://host
 *
 * Returns `null` for missing or unusable configuration so callers can degrade
 * explicitly instead of building a half-formed URL.
 */
export const resolveBackendUrls = (raw: string | undefined): BackendUrls | null => {
  if (!raw) return null;
  const base = stripTrailingSlash(raw.trim());
  if (!base || !isSafeOrigin(base)) return null;

  const parsed = new URL(base);
  const withoutQuery = `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;

  const hasApiV1 = /\/api\/v1$/.test(withoutQuery);
  return {
    apiBaseUrl: hasApiV1 ? withoutQuery : `${withoutQuery}/api/v1`,
    rootBaseUrl: hasApiV1 ? withoutQuery.replace(/\/api\/v1$/, "") : withoutQuery,
  };
};

/**
 * Resolve from the environment, preferring the server-only name so a
 * `NEXT_PUBLIC_*` value baked into the client bundle is never the thing that
 * decides where the proxy points.
 */
export const resolveBackendUrlsFromEnv = (
  env: Record<string, string | undefined>,
): BackendUrls | null => resolveBackendUrls(env.BACKEND_URL || env.NEXT_PUBLIC_API_URL);
