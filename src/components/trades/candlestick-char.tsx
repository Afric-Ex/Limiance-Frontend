"use client";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FiArrowUp, FiArrowDown, FiChevronDown, FiMaximize2, FiMinimize2 } from "react-icons/fi";
import clsx from "clsx";
import type { OrderBookEntry } from "@/src/hooks/use-order-book";

// Lightweight Charts is the only renderer. Kept code-split with ssr:false
// because the library touches the DOM at module scope.
const LwcCandlestickChart = dynamic(
  () => import("@/src/components/trades/candlestick-chart-lwc").then((m) => m.LwcCandlestickChart),
  { ssr: false }
);

const QUICK_INTERVALS = ["1s", "1m", "3m", "5m", "15m", "30m", "1h", "4h"] as const;
const MORE_INTERVALS = [
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1mn", label: "1M" },
  { value: "6mh", label: "6M" },
  { value: "1y", label: "1Y" },
] as const;
const INTERVALS = [
  ...QUICK_INTERVALS,
  ...MORE_INTERVALS.map(({ value }) => value),
] as const;
type Interval = (typeof INTERVALS)[number];
type View = "chart" | "depth";

interface Props {
  symbol?: string;
  market?: "spot" | "margin" | "futures";
  orderBook?: { buyOrders: OrderBookEntry[]; sellOrders: OrderBookEntry[]; isConnected?: boolean };
  orderLevels?: OrderLevel[];
  priceRange?: { min: number | null; max: number | null };
}

export type { ChartMarket } from "@/src/components/trades/use-candle-feed";

export type OrderLevel = {
  id: string;
  label: string;
  price: number;
  color: "entry" | "tp" | "sl" | "fill";
  detail?: string;
};

// ── Depth panel ──────────────────────────────────────────────────────────────
// Ported from the admin order book depth card (OrderbookPage.jsx). Cumulative
// depth is tracked as notional (price x size) so the two sides stay directly
// comparable and the totals read in quote currency.
type DepthRow = { price: number; quantity: number; total: number; depthPct: number };
type DepthViewMode = "both" | "bids" | "asks";

const DEPTH_ROW_OPTIONS = [10, 15, 25] as const;
const PRECISION_OPTIONS = [1, 2, 4] as const;

const DEPTH_BID = "#25AB42";
const DEPTH_ASK = "#F6465D";
const DEPTH_ACCENT = "#8974FF";

function buildDepthRows(entries: OrderBookEntry[], side: "bid" | "ask"): DepthRow[] {
  const sorted = entries
    .filter((e) => e.price > 0 && e.quantity > 0)
    .sort((a, b) => (side === "bid" ? b.price - a.price : a.price - b.price));

  let cumulative = 0;
  return sorted.map((e) => {
    cumulative += e.price * e.quantity;
    return { price: e.price, quantity: e.quantity, total: cumulative, depthPct: 0 };
  });
}

// Both sides normalise against the larger cumulative total, so the deepest row
// on the heavier side reads 100% and the two curves share one scale.
function withDepthPct(rows: DepthRow[], maxTotal: number): DepthRow[] {
  return rows.map((r) => ({ ...r, depthPct: Math.min(100, Math.round((r.total / maxTotal) * 100)) }));
}

const DepthPanel = memo(function DepthPanel({
  symbol,
  buyOrders,
  sellOrders,
  isConnected,
}: {
  symbol: string;
  buyOrders: OrderBookEntry[];
  sellOrders: OrderBookEntry[];
  isConnected: boolean;
}) {
  const [viewMode, setViewMode] = useState<DepthViewMode>("both");
  const [rowLimit, setRowLimit] = useState<number>(15);
  const [precision, setPrecision] = useState<number>(2);

  const bidRows = useMemo(() => buildDepthRows(buyOrders, "bid"), [buyOrders]);
  const askRows = useMemo(() => buildDepthRows(sellOrders, "ask"), [sellOrders]);

  const bidTotal = bidRows[bidRows.length - 1]?.total ?? 0;
  const askTotal = askRows[askRows.length - 1]?.total ?? 0;
  const maxTotal = Math.max(bidTotal, askTotal, 1);

  const bids = useMemo(() => withDepthPct(bidRows, maxTotal), [bidRows, maxTotal]);
  const asks = useMemo(() => withDepthPct(askRows, maxTotal), [askRows, maxTotal]);

  // Asks render highest-first so the lowest ask sits just above the spread.
  const displayAsks = useMemo(() => asks.slice(0, rowLimit).reverse(), [asks, rowLimit]);
  const displayBids = useMemo(() => bids.slice(0, rowLimit), [bids, rowLimit]);

  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  const spread = bestBid !== null && bestAsk !== null ? bestAsk - bestBid : 0;
  const spreadPct = bestAsk !== null && spread > 0 ? (spread / bestAsk) * 100 : 0;
  const midPrice = bestBid !== null && bestAsk !== null ? (bestAsk + bestBid) / 2 : null;

  const bookTotal = bidTotal + askTotal;
  const buyPct = bookTotal > 0 ? Math.round((bidTotal / bookTotal) * 100) : 50;
  const sellPct = 100 - buyPct;

  // Tick direction from the mid, which moves with the book even though the
  // chart panel is not handed a last-trade price.
  const prevMidRef = useRef<number | null>(null);
  const [direction, setDirection] = useState<"up" | "down" | "neutral">("neutral");
  useEffect(() => {
    if (midPrice === null) return;
    const prev = prevMidRef.current;
    prevMidRef.current = midPrice;
    if (prev === null || prev === midPrice) return;
    setDirection(midPrice > prev ? "up" : "down");
  }, [midPrice]);

  const [base = "BTC", quote = "USDT"] = symbol.split("/");

  const fmtPrice = (v: number | null) =>
    v === null
      ? "--"
      : v.toLocaleString("en-US", { minimumFractionDigits: precision, maximumFractionDigits: precision });
  const fmtQty = (v: number) =>
    v ? v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : "0.00";
  const fmtTotal = (v: number) =>
    v ? v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
  const fmtNotional = (v: number) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  // Cumulative curves in a fixed 400x220 viewBox: x runs 20 -> 380 across the
  // two sides from the mid, y is the cumulative notional capped at 160.
  const { bidPath, askPath } = useMemo(() => {
    if (bids.length === 0 && asks.length === 0) return { bidPath: "", askPath: "" };

    const build = (rows: DepthRow[], directionX: 1 | -1) => {
      if (rows.length === 0) return "";
      const points = rows.map((r, idx) => {
        const x = 200 + directionX * (idx / Math.max(rows.length - 1, 1)) * 180;
        const y = 200 - Math.min(160, (r.total / maxTotal) * 150);
        return `${x.toFixed(1)} ${y.toFixed(1)}`;
      });
      return `L ${points.join(" L ")}`;
    };

    return { bidPath: build(bids, -1), askPath: build(asks, 1) };
  }, [bids, asks, maxTotal]);

  const hasBook = bids.length > 0 || asks.length > 0;
  const controlClass =
    "text-[10px] font-semibold px-2 h-6 rounded bg-white/[0.06] text-white/60 hover:text-white/90 transition-colors";

  return (
    <div className="w-full min-w-0 flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
      {/* Market depth liquidity curve + cumulative stats */}
      <section className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white/90">Market Depth Liquidity</span>
          <span className="text-[10px] text-white/35">Cumulative Curves</span>
        </div>

        {hasBook ? (
          <svg viewBox="0 0 400 220" preserveAspectRatio="none" className="w-full h-[200px]">
            <defs>
              <linearGradient id="depthBidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={DEPTH_BID} stopOpacity="0.4" />
                <stop offset="100%" stopColor={DEPTH_BID} stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="depthAskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={DEPTH_ASK} stopOpacity="0.4" />
                <stop offset="100%" stopColor={DEPTH_ASK} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(255,255,255,0.06)" />
            <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <line x1="200" y1="0" x2="200" y2="200" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />

            {bidPath && (
              <>
                <path d={`M 20 200 ${bidPath} L 200 200 Z`} fill="url(#depthBidGradient)" />
                <path d={`M 20 200 ${bidPath}`} fill="none" stroke={DEPTH_BID} strokeWidth="2" />
              </>
            )}
            {askPath && (
              <>
                <path d={`M 200 200 ${askPath} L 380 200 Z`} fill="url(#depthAskGradient)" />
                <path d={`M 200 200 ${askPath}`} fill="none" stroke={DEPTH_ASK} strokeWidth="2" />
              </>
            )}

            <circle cx="200" cy="195" r="4" fill={DEPTH_ACCENT} />
          </svg>
        ) : (
          <div className="w-full h-[200px] flex items-center justify-center text-xs text-white/30">
            Awaiting order book depth to plot liquidity curve...
          </div>
        )}

        <div className="flex items-center justify-center text-[10px] text-white/40 font-mono -mt-1">
          Mid: {fmtPrice(midPrice)}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          <div className="rounded bg-black/25 border border-white/[0.06] px-2 py-1.5">
            <div className="text-[10px] text-white/40">Total Bid Volume</div>
            <div className="text-xs font-bold font-mono tabular-nums text-success-6">{fmtNotional(bidTotal)}</div>
          </div>
          <div className="rounded bg-black/25 border border-white/[0.06] px-2 py-1.5">
            <div className="text-[10px] text-white/40">Total Ask Volume</div>
            <div className="text-xs font-bold font-mono tabular-nums text-error-1">{fmtNotional(askTotal)}</div>
          </div>
          <div className="rounded bg-black/25 border border-white/[0.06] px-2 py-1.5">
            <div className="text-[10px] text-white/40">Order Ratio</div>
            <div className="text-xs font-bold font-mono tabular-nums text-white/90">
              {buyPct}% : {sellPct}%
            </div>
          </div>
          <div className="rounded bg-black/25 border border-white/[0.06] px-2 py-1.5">
            <div className="text-[10px] text-white/40">Socket State</div>
            <div
              className={clsx(
                "text-xs font-bold font-mono capitalize",
                isConnected ? "text-success-6" : "text-warning-1"
              )}
            >
              {isConnected ? "connected" : "reconnecting"}
            </div>
          </div>
        </div>
      </section>

      {/* Order book depth ladder */}
      <section className="rounded-lg border border-white/[0.06] bg-white/[0.02] flex flex-col min-h-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.06]">
          <span className="text-xs font-semibold text-white/90">Order Book Depth</span>
          <div className="flex items-center gap-1.5">
            {(["both", "bids", "asks"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                title={m === "both" ? "Both asks & bids" : `${m} only`}
                className={clsx(
                  "text-[10px] font-semibold px-2 h-6 rounded transition-colors capitalize",
                  viewMode === m ? "bg-white/15 text-white" : "bg-white/[0.06] text-white/50 hover:text-white/80"
                )}
              >
                {m}
              </button>
            ))}
            <select
              value={precision}
              onChange={(e) => setPrecision(Number(e.target.value))}
              className={clsx(controlClass, "cursor-pointer")}
            >
              {PRECISION_OPTIONS.map((p) => (
                <option key={p} value={p} className="bg-[#1c1e27]">
                  {p === 1 ? "0.1" : p === 2 ? "0.01" : "0.0001"}
                </option>
              ))}
            </select>
            <select
              value={rowLimit}
              onChange={(e) => setRowLimit(Number(e.target.value))}
              className={clsx(controlClass, "cursor-pointer")}
            >
              {DEPTH_ROW_OPTIONS.map((n) => (
                <option key={n} value={n} className="bg-[#1c1e27]">
                  {n} rows
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 px-3 py-1.5 text-[10px] text-white/40">
          <span>Price ({quote})</span>
          <span className="text-right">Size ({base})</span>
          <span className="text-right">Total ({quote})</span>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {viewMode !== "bids" &&
            (displayAsks.length > 0 ? (
              displayAsks.map((row, i) => (
                <div
                  key={`ask-${i}`}
                  className="relative grid grid-cols-3 px-3 py-[3px] hover:bg-white/[0.03]"
                >
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-error-1/[0.12] pointer-events-none"
                    style={{ width: `${row.depthPct}%` }}
                  />
                  <span className="relative z-10 text-[11px] font-mono tabular-nums font-semibold text-error-1">
                    {fmtPrice(row.price)}
                  </span>
                  <span className="relative z-10 text-[11px] font-mono tabular-nums text-white/80 text-right">
                    {fmtQty(row.quantity)}
                  </span>
                  <span className="relative z-10 text-[11px] font-mono tabular-nums text-white/40 text-right">
                    {fmtTotal(row.total)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-[11px] text-white/30">No active asks</div>
            ))}

          <div className="flex items-center justify-between px-3 py-2 my-1.5 rounded bg-black/35 border-l-[3px] border-l-blue-1">
            <span
              className={clsx(
                "text-sm font-bold font-mono tabular-nums flex items-center gap-1.5",
                direction === "up" ? "text-success-6" : direction === "down" ? "text-error-1" : "text-white"
              )}
            >
              {fmtPrice(midPrice)}
              {direction === "up" ? <FiArrowUp size={13} /> : direction === "down" ? <FiArrowDown size={13} /> : null}
            </span>
            <span className="text-[10px] text-white/40">
              Spread: {fmtPrice(spread)} ({spreadPct.toFixed(3)}%)
            </span>
          </div>

          {viewMode !== "asks" &&
            (displayBids.length > 0 ? (
              displayBids.map((row, i) => (
                <div
                  key={`bid-${i}`}
                  className="relative grid grid-cols-3 px-3 py-[3px] hover:bg-white/[0.03]"
                >
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-success-6/[0.12] pointer-events-none"
                    style={{ width: `${row.depthPct}%` }}
                  />
                  <span className="relative z-10 text-[11px] font-mono tabular-nums font-semibold text-success-6">
                    {fmtPrice(row.price)}
                  </span>
                  <span className="relative z-10 text-[11px] font-mono tabular-nums text-white/80 text-right">
                    {fmtQty(row.quantity)}
                  </span>
                  <span className="relative z-10 text-[11px] font-mono tabular-nums text-white/40 text-right">
                    {fmtTotal(row.total)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-[11px] text-white/30">No active bids</div>
            ))}
        </div>

        {/* Buy/sell depth imbalance */}
        <div className="px-3 pt-2.5 pb-3 mt-1 border-t border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between text-[10px] font-semibold mb-1.5">
            <span className="text-success-6">Buy Depth: {buyPct}%</span>
            <span className="text-error-1">Sell Depth: {sellPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-error-1/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-success-6 transition-[width] duration-200"
              style={{ width: `${buyPct}%` }}
            />
          </div>
        </div>
      </section>
    </div>
  );
});

// ── Main export ───────────────────────────────────────────────────────────────
// Lightweight Charts is the only renderer. `priceRange` is kept on the public
// props because all three trade pages pass it, but no renderer consumes it now
// that the canvas engine (which drew the 24h band) is gone.
export default function TradingViewChart({ symbol = "BTC/USDT", market = "spot", orderBook, orderLevels = [] }: Props) {
  const [interval, setIntervalVal] = useState<Interval>("15m");
  const [view, setView] = useState<View>("chart");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [usesFullscreenFallback, setUsesFullscreenFallback] = useState(false);
  const chartRootRef = useRef<HTMLDivElement>(null);
  const fullscreenFallbackRef = useRef(false);
  const marketLabel = market === "futures" ? "Futures" : market === "margin" ? "Margin" : "Spot";
  const bookLive = orderBook?.isConnected ?? false;

  const bids = orderBook?.buyOrders ?? [];
  const asks = orderBook?.sellOrders ?? [];

  const exitFullscreen = useCallback(async () => {
    const root = chartRootRef.current;
    fullscreenFallbackRef.current = false;
    setUsesFullscreenFallback(false);
    setIsFullscreen(false);

    if (typeof document !== "undefined" && root) {
      const fullscreenDocument = document as Document & {
        webkitFullscreenElement?: Element | null;
        webkitExitFullscreen?: () => Promise<void> | void;
      };
      const isNativeFullscreen =
        fullscreenDocument.fullscreenElement === root ||
        fullscreenDocument.webkitFullscreenElement === root;
      if (!isNativeFullscreen) return;

      try {
        if (fullscreenDocument.exitFullscreen) {
          await fullscreenDocument.exitFullscreen();
        } else {
          await fullscreenDocument.webkitExitFullscreen?.();
        }
      } catch {
        // The browser may already have exited fullscreen (for example after a
        // system-level Escape action). The local state is already reconciled.
      }
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    const root = chartRootRef.current;
    if (!root) return;

    if (typeof document !== "undefined") {
      const fullscreenRoot = root as HTMLDivElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
      };
      const fullscreenDocument = document as Document & {
        webkitFullscreenElement?: Element | null;
      };

      try {
        if (fullscreenRoot.requestFullscreen) {
          await fullscreenRoot.requestFullscreen({ navigationUI: "hide" });
        } else {
          await fullscreenRoot.webkitRequestFullscreen?.();
        }

        if (
          fullscreenDocument.fullscreenElement === root ||
          fullscreenDocument.webkitFullscreenElement === root
        ) {
          return;
        }
      } catch {
        // Some mobile browsers expose the API but reject it for an element
        // that is not directly activated. Use the viewport fallback below.
      }
    }

    fullscreenFallbackRef.current = true;
    setUsesFullscreenFallback(true);
    setIsFullscreen(true);
  }, []);

  useEffect(() => {
    const root = chartRootRef.current;
    if (!root || typeof document === "undefined") return;
    const fullscreenDocument = document as Document & {
      webkitFullscreenElement?: Element | null;
    };

    const onFullscreenChange = () => {
      const active =
        fullscreenDocument.fullscreenElement === root ||
        fullscreenDocument.webkitFullscreenElement === root;
      if (active) {
        fullscreenFallbackRef.current = false;
        setUsesFullscreenFallback(false);
        setIsFullscreen(true);
      } else if (!fullscreenFallbackRef.current) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      void exitFullscreen();
    };

    // Capture Escape before the chart's drawing shortcuts so it always exits
    // analysis mode first, even when a drawing is selected.
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [exitFullscreen, isFullscreen]);

  return (
    <div
      ref={chartRootRef}
      className={clsx(
        "w-full h-full bg-[#181a20] relative flex flex-col overflow-hidden",
        isFullscreen && "w-screen h-[100dvh]",
        isFullscreen && usesFullscreenFallback && "fixed inset-0 z-[1000]"
      )}
      style={
        isFullscreen
          ? {
              width: "100vw",
              height: "100dvh",
              ...(usesFullscreenFallback
                ? { position: "fixed", inset: 0, zIndex: 1000 }
                : {}),
            }
          : undefined
      }
      data-market={market}
    >
      {/* One shared control surface for all three trading products. */}
      <div className="flex items-center justify-between gap-2 px-2 border-b border-white/[0.06] shrink-0 min-h-10">
        <div className="flex items-center shrink-0">
          {(["chart", "depth"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`text-xs font-semibold px-3 h-9 border-b-2 transition-colors capitalize ${
                view === v
                  ? "text-white border-white"
                  : "text-white/40 border-transparent hover:text-white/70"
              }`}
            >
              {v === "chart" ? "Chart" : "Depth"}
            </button>
            ))}
        </div>

        {view === "chart" && (
          <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
            <div className="flex items-center justify-end gap-0.5 min-w-max">
              {QUICK_INTERVALS.map((iv) => (
                <button
                  key={iv}
                  onClick={() => setIntervalVal(iv)}
                  aria-pressed={interval === iv}
                  className={`text-[11px] font-semibold px-2 h-7 rounded transition-colors ${
                    interval === iv
                      ? "text-white bg-white/10"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {iv}
                </button>
              ))}
              <div className="relative flex h-7 items-center">
                <select
                  aria-label="More chart intervals"
                  value={MORE_INTERVALS.some(({ value }) => value === interval) ? interval : ""}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    if (MORE_INTERVALS.some((item) => item.value === value)) {
                      setIntervalVal(value as Interval);
                    }
                  }}
                  className={`h-7 appearance-none rounded bg-white/[0.06] pl-2 pr-6 text-[11px] font-semibold outline-none transition-colors ${
                    MORE_INTERVALS.some(({ value }) => value === interval)
                      ? "text-white"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <option value="" disabled>More</option>
                  {MORE_INTERVALS.map(({ value, label }) => (
                    <option key={value} value={value} className="bg-[#181a20] text-white">
                      {label}
                    </option>
                  ))}
                </select>
                <FiChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-1.5 text-white/50"
                  size={12}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void (isFullscreen ? exitFullscreen() : enterFullscreen())}
            aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
            title={isFullscreen ? "Exit full screen" : "Enter full screen"}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:text-white"
          >
            {isFullscreen ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}
          </button>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-medium text-white/45">
            <span className="rounded bg-white/[0.06] px-1.5 py-1 text-white/60">{marketLabel}</span>
            <span className="inline-flex items-center gap-1.5" title="Order book WebSocket status">
              <span className={clsx("h-1.5 w-1.5 rounded-full", bookLive ? "bg-success-6" : "bg-warning-1")} />
              {bookLive ? "Live" : "Reconnecting"}
            </span>
          </div>
        </div>
      </div>

      {/* Chart views */}
      {view === "chart" ? (
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <LwcCandlestickChart
            symbol={symbol}
            interval={interval}
            market={market}
            orderLevels={orderLevels}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex">
          <DepthPanel
            symbol={symbol}
            buyOrders={bids}
            sellOrders={asks}
            isConnected={orderBook?.isConnected ?? false}
          />
        </div>
      )}
    </div>
  );
}
