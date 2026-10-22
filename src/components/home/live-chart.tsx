"use client";

import { useEffect, useMemo, useState } from "react";
import { useMarket } from "@/src/components/home/market-context";
import {
  DEFAULT_INTERVAL,
  INTERVALS,
  fetchCandles,
  type Candle,
  type Interval,
} from "@/src/lib/landing/candles";

// Drawing space. The price axis is HTML (crisp at any width), so the SVG
// reserves AXIS_W on the right and leaves the labels to the overlay.
const W = 800;
const H = 380;
const AXIS_W = 72;
const PAD_Y = 12;
const POLL_MS = 30_000;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: n >= 100 ? 2 : n >= 1 ? 4 : 8,
  }).format(n);

const fmtTime = (t: number) =>
  new Date(t).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function LiveChart() {
  const { symbol, setSymbol, symbols } = useMarket();
  const [tf, setTf] = useState<Interval>(DEFAULT_INTERVAL);
  const [data, setData] = useState<{ key: string; candles: Candle[] } | null>(
    null,
  );
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const key = `${symbol}|${tf}`;

  useEffect(() => {
    let ctrl = new AbortController();
    setHover(null);
    const load = async () => {
      ctrl.abort();
      ctrl = new AbortController();
      try {
        const candles = await fetchCandles(symbol, tf, ctrl.signal);
        setData({ key, candles });
        setFailed(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setFailed(true);
      }
    };
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => {
      window.clearInterval(id);
      ctrl.abort();
    };
  }, [symbol, tf, key]);

  const candles = data?.candles ?? [];
  const switching = data !== null && data.key !== key;

  const geo = useMemo(() => {
    if (candles.length === 0) return null;
    const lo = Math.min(...candles.map((c) => c.low));
    const hi = Math.max(...candles.map((c) => c.high));
    const pad = (hi - lo) * 0.06 || hi * 0.01;
    const min = lo - pad;
    const max = hi + pad;
    const step = (W - AXIS_W) / candles.length;
    const y = (v: number) => PAD_Y + ((max - v) / (max - min)) * (H - PAD_Y * 2);
    const ticks = [0, 1, 2, 3, 4].map((i) => min + ((max - min) * i) / 4);
    return { step, y, ticks };
  }, [candles]);

  const last = candles[candles.length - 1];
  const first = candles[0];
  const shown = hover !== null ? candles[hover] : last;
  const change = last && first ? ((last.close - first.open) / first.open) * 100 : 0;
  const up = change >= 0;
  const lastUp = last ? last.close >= last.open : true;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <select
            aria-label="Trading pair"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="h-10 cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 pl-4 pr-9 font-semibold text-white backdrop-blur [&>option]:bg-[#0b0d14]"
          >
            {symbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
          >
            ▾
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Candle interval"
          className="inline-flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1"
        >
          {INTERVALS.map((i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === tf}
              onClick={() => setTf(i)}
              className={`h-7 min-w-11 rounded-lg px-3 text-[length:var(--text-caption)] font-semibold transition-colors ${
                i === tf
                  ? "bg-primary-strong text-white"
                  : "text-[var(--color-text-primary)] hover:bg-white/10"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {!data && !failed && (
        <div className="skeleton aspect-[800/380] w-full rounded-xl" />
      )}

      {!data && failed && (
        <div className="flex aspect-[800/380] w-full items-center justify-center rounded-xl border border-white/10 px-6 text-center text-[length:var(--text-body)] text-[var(--color-text-primary)]">
          We couldn&apos;t load the chart. It retries automatically.
        </div>
      )}

      {data && geo && shown && (
        <>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 tabular-nums">
            <span className="text-[length:var(--text-heading)] font-semibold leading-none text-white">
              {fmt(shown.close)}
            </span>
            {hover === null ? (
              <span className={up ? "text-buy" : "text-sell"}>
                <span aria-hidden>{up ? "▲" : "▼"}</span> {up ? "+" : "-"}
                {Math.abs(change).toFixed(2)}%
                <span className="ml-2 text-[length:var(--text-caption)] text-secondary">
                  past {candles.length} {tf} candles
                </span>
              </span>
            ) : (
              <span className="text-[length:var(--text-caption)] text-[var(--color-text-primary)]">
                {fmtTime(shown.time)}  O {fmt(shown.open)}  H {fmt(shown.high)}  L{" "}
                {fmt(shown.low)}  C {fmt(shown.close)}
              </span>
            )}
          </div>

          <div
            className={`relative transition-opacity ${switching ? "opacity-50" : ""}`}
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-label={`${symbol} ${tf} candlestick chart`}
              className="block h-auto w-full"
              onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - r.left) / r.width) * W;
                const i = Math.floor(x / geo.step);
                setHover(i >= 0 && i < candles.length ? i : null);
              }}
              onPointerLeave={() => setHover(null)}
            >
              {geo.ticks.map((t) => (
                <line
                  key={t}
                  x1={0}
                  x2={W - AXIS_W}
                  y1={geo.y(t)}
                  y2={geo.y(t)}
                  style={{ stroke: "rgba(255,255,255,0.07)" }}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {candles.map((c, i) => {
                const cx = i * geo.step + geo.step / 2;
                const bw = Math.max(1.5, geo.step * 0.62);
                const top = geo.y(Math.max(c.open, c.close));
                const bottom = geo.y(Math.min(c.open, c.close));
                return (
                  <g
                    key={c.time}
                    className={c.close >= c.open ? "text-buy" : "text-sell"}
                    stroke="currentColor"
                    fill="currentColor"
                  >
                    <line
                      x1={cx}
                      x2={cx}
                      y1={geo.y(c.high)}
                      y2={geo.y(c.low)}
                      strokeWidth={1.2}
                      vectorEffect="non-scaling-stroke"
                    />
                    <rect
                      x={cx - bw / 2}
                      y={top}
                      width={bw}
                      height={Math.max(1, bottom - top)}
                      strokeWidth={0}
                    />
                  </g>
                );
              })}

              <line
                x1={0}
                x2={W - AXIS_W}
                y1={geo.y(last.close)}
                y2={geo.y(last.close)}
                className={lastUp ? "text-buy" : "text-sell"}
                stroke="currentColor"
                strokeDasharray="4 4"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />

              {hover !== null && (
                <line
                  x1={hover * geo.step + geo.step / 2}
                  x2={hover * geo.step + geo.step / 2}
                  y1={0}
                  y2={H}
                  style={{ stroke: "var(--color-text-secondary)" }}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>

            {/* Price axis as HTML so the numbers stay readable on phones */}
            <div
              aria-hidden
              className="pointer-events-none absolute right-0 top-0 h-full tabular-nums"
              style={{ width: `${(AXIS_W / W) * 100}%` }}
            >
              {geo.ticks.map((t) => (
                <span
                  key={t}
                  className="absolute right-0 -translate-y-1/2 text-[length:var(--text-micro)] text-secondary"
                  style={{ top: `${(geo.y(t) / H) * 100}%` }}
                >
                  {fmt(t)}
                </span>
              ))}
              <span
                className={`absolute right-0 -translate-y-1/2 rounded border bg-black/50 px-1 text-[length:var(--text-micro)] font-semibold ${
                  lastUp ? "border-buy/40 text-buy" : "border-sell/40 text-sell"
                }`}
                style={{ top: `${(geo.y(last.close) / H) * 100}%` }}
              >
                {fmt(last.close)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}