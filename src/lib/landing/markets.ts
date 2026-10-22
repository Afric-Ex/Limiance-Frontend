/**
 * Landing-page market data. Nothing is hardcoded: every number shown on the
 * page comes from GET /api/v1/trading/24_hours_movers.
 *
 * The gateway doc gives the envelope ({ Data: { gainers, losers } }) but NOT
 * the fields inside each item. The three keys below are an ASSUMPTION.
 * Check one real response in the Network tab and edit ITEM_KEYS if needed.
 * If a key is wrong, that item is skipped, so nothing fake is ever shown.
 */

export type Mover = { symbol: string; price: number; changePct: number };
export type Movers = { gainers: Mover[]; losers: Mover[] };

const ITEM_KEYS = {
  symbol: "pair",
  price: "latest_price",
  changePct: "percent_change_24h",
} as const;

// Point this at the same base URL your app already uses for REST calls.
// The configured URL may already include the /api/v1 version segment, so strip
// it here and let callers pass the full path (/api/v1/...) exactly once.
const configuredBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
export const API_BASE = configuredBase.replace(/\/api\/v1$/, "");

export const apiUrl = (path: string) => `${API_BASE}${path}`;

const toNumber = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
};

function toMover(raw: unknown): Mover | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const symbol = r[ITEM_KEYS.symbol];
  const price = toNumber(r[ITEM_KEYS.price]);
  const changePct = toNumber(r[ITEM_KEYS.changePct]);
  if (typeof symbol !== "string" || price === null || changePct === null) {
    return null;
  }
  return { symbol, price, changePct };
}

const toList = (v: unknown): Mover[] =>
  Array.isArray(v)
    ? v.map(toMover).filter((m): m is Mover => m !== null)
    : [];

export async function fetchMovers(signal?: AbortSignal): Promise<Movers> {
  const res = await fetch(apiUrl("/api/v1/trading/24_hours_movers"), {
    signal,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`movers request failed (${res.status})`);
  const json = await res.json();
  // The API's example shows gainers/losers can be null, so handle that.
  return {
    gainers: toList(json?.data?.gainers),
    losers: toList(json?.data?.losers),
  };
}