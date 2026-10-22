import { apiUrl } from "@/src/lib/landing/markets";

/**
 * GET /api/v1/trading/kline/historical
 * Required query: symbol (e.g. "BTC/USDT"), interval (e.g. "1h").
 * Response: { Data: [{ t, o, h, l, c, v, ... }], Success, Message } with
 * prices as strings, newest candle first. We sort oldest -> newest for drawing.
 */

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

// Offered timeframes. Chosen to match the ones the exchange's own chart uses;
// remove any the backend does not accept.
export const INTERVALS = ["15m", "1h", "4h"] as const;
export type Interval = (typeof INTERVALS)[number];
export const DEFAULT_INTERVAL: Interval = "1h";
export const CANDLE_LIMIT = 100;

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : NaN;
};

export async function fetchCandles(
  symbol: string,
  interval: Interval,
  signal?: AbortSignal,
): Promise<Candle[]> {
  const qs = new URLSearchParams({
    symbol,
    interval,
    limit: String(CANDLE_LIMIT),
  });
  const res = await fetch(apiUrl(`/api/v1/trading/kline/historical?${qs}`), {
    signal,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`candles request failed (${res.status})`);
  const json = await res.json();
  if (json?.Success === false || !Array.isArray(json?.Data)) {
    throw new Error(json?.Message || "no candle data");
  }
  const candles: Candle[] = json.Data.map((r: Record<string, unknown>) => ({
    time: num(r.t),
    open: num(r.o),
    high: num(r.h),
    low: num(r.l),
    close: num(r.c),
    volume: num(r.v),
  })).filter((c: Candle) =>
    [c.time, c.open, c.high, c.low, c.close].every(Number.isFinite),
  );
  return candles.sort((a, b) => a.time - b.time);
}