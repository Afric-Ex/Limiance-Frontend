"use client";

const SENSITIVE_KEY_PATTERN = /(access|auth|token|jwt|refresh|session|captcha|pass|secret|otp|code|email|phone|name|address|kyc|identity|document|account|bank|card|payment|balance|position|order|transaction|review|details|payload|body|query|fragment)/i;

export const LEGACY_SENSITIVE_STORAGE_KEYS = [
  "auth-token",
  "auth-store",
  "user-store",
  "verify-token",
  "auth-debug",
  "p2p-blocked-advertisers",
  "p2p-reported-advertisers",
  "p2p-advertiser-reviews",
] as const;

export const APPROVED_NON_PII_STORAGE_KEYS = new Set([
  "market_favorites",
  "api-banner-dismissed",
  "fcm_token_registered",
]);

export const isSensitiveKey = (key: string): boolean => SENSITIVE_KEY_PATTERN.test(key);

export const sanitizeUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return value.replace(/[?#].*$/, "");
  }
};

const redactValue = (value: unknown, key = "", seen = new WeakSet<object>()): unknown => {
  if (isSensitiveKey(key)) return "[REDACTED]";
  if (typeof value === "string") {
    if (/url|href|route|path/i.test(key)) return sanitizeUrl(value);
    if (/message|error|details|payload|body|query|fragment/i.test(key)) return "[REDACTED]";
    return value.length > 256 ? `${value.slice(0, 256)}…` : value;
  }
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, key, seen));
  return Object.fromEntries(
    Object.entries(value).map(([childKey, childValue]) => [childKey, redactValue(childValue, childKey, seen)])
  );
};

export const redactDiagnostic = (value: unknown): unknown => redactValue(value);

export const clearSensitiveClientArtifacts = (): void => {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_SENSITIVE_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }
  // This clears legacy readable cookies only. HttpOnly session cookies must be
  // revoked by the backend logout endpoint.
  try {
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  } catch {
    // Cookie access can be denied by browser privacy policy.
  }
};
