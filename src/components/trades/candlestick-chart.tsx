"use client";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FiArrowUp, FiArrowDown, FiChevronDown, FiMaximize2, FiMinimize2, FiCheck, FiRotateCcw } from "react-icons/fi";
import { TbChartCandle, TbChartBar, TbChartLine, TbChartArea, TbFunction } from "react-icons/tb";
import clsx from "clsx";
import type { OrderBookEntry } from "@/src/hooks/use-order-book";
import { TokenOverview } from "@/src/components/trades/token-overview";
import { TradeFlowPanel } from "@/src/components/trades/trade-flow-panel";
import type { ChartType, ChartIndicators } from "@/src/components/trades/candlestick-chart-lwc";
import { DEFAULT_INDICATORS } from "@/src/components/trades/candlestick-chart-lwc";

// Lightweight Charts is the only renderer. Kept code-split with ssr:false
// because the library touches the DOM at module scope.
const LwcCandlestickChart = dynamic(
  () => import("@/src/components/trades/candlestick-chart-lwc").then((m) => m.LwcCandlestickChart),
  { ssr: false }
);

const QUICK_INTERVALS = [
  { value: "1s", label: "1s" },
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "30m", label: "30m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1mn", label: "1M" },
] as const;
const MORE_INTERVALS = [
  { value: "3m", label: "3m" },
  { value: "6mh", label: "6M" },
  { value: "1y", label: "1Y" },
] as const;
const _INTERVALS = [
  ...QUICK_INTERVALS.map(({ value }) => value),
  ...MORE_INTERVALS.map(({ value }) => value),
] as const;
type Interval = (typeof _INTERVALS)[number];
type View = "chart" | "depth" | "overview" | "data";

interface Props {
  symbol?: string;
  market?: "spot" | "margin" | "futures";
  orderBook?: { buyOrders: OrderBookEntry[]; sellOrders: OrderBookEntry[]; isConnected?: boolean };
  orderLevels?: OrderLevel[];
  priceRange?: { min: number | null; max: number | null };
  lastPrice?: number | null;
  onLastPriceChange?: (price: number | null) => void;
  // Bybit-style desktop header: Chart / Overview / Data tabs, with Depth as a
  // checkbox on the chart tab. Off = the original Chart / Depth tabs.
  insightTabs?: boolean;
  recentTrades?: readonly Record<string, unknown>[];
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
  lastPrice,
}: {
  symbol: string;
  buyOrders: OrderBookEntry[];
  sellOrders: OrderBookEntry[];
  isConnected: boolean;
  lastPrice?: number | null;
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
  // The price shown between the asks and bids is the last traded price; fall
  // back to the mid if the passed lastPrice is stale or outside the live book.
  const isWithinSpread =
    lastPrice !== null &&
    lastPrice !== undefined &&
    Number.isFinite(lastPrice) &&
    lastPrice > 0 &&
    (bestBid === null || bestAsk === null || (lastPrice >= bestBid * 0.999 && lastPrice <= bestAsk * 1.001));
  const displayPrice = (isWithinSpread ? lastPrice : null) ?? midPrice ?? lastPrice;

  const bookTotal = bidTotal + askTotal;
  const buyPct = bookTotal > 0 ? Math.round((bidTotal / bookTotal) * 100) : 50;
  const sellPct = 100 - buyPct;

  const prevPriceRef = useRef<number | null>(null);
  const [direction, setDirection] = useState<"up" | "down" | "neutral">("neutral");
  useEffect(() => {
    if (displayPrice === null) return;
    const prev = prevPriceRef.current;
    prevPriceRef.current = displayPrice;
    if (prev === null || prev === displayPrice) return;
    setDirection(displayPrice > prev ? "up" : "down");
  }, [displayPrice]);

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
    "text-2xs font-semibold px-2 h-6 rounded bg-white/[0.06] text-white/60 hover:text-white/90 transition-colors";

  return (
    <div className="w-full min-w-0 flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
      {/* Market depth liquidity curve + cumulative stats */}
      <section className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white/90">Market Depth Liquidity</span>
          <span className="text-2xs text-white/35">Cumulative Curves</span>
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

        <div className="flex items-center justify-center text-2xs text-white/40 font-mono -mt-1">
          Mid: {fmtPrice(midPrice)}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          <div className="rounded bg-black/25 border border-white/[0.06] px-2 py-1.5">
            <div className="text-2xs text-white/40">Total Bid Volume</div>
            <div className="text-xs font-bold font-mono tabular-nums text-success-6">{fmtNotional(bidTotal)}</div>
          </div>
          <div className="rounded bg-black/25 border border-white/[0.06] px-2 py-1.5">
            <div className="text-2xs text-white/40">Total Ask Volume</div>
            <div className="text-xs font-bold font-mono tabular-nums text-error-1">{fmtNotional(askTotal)}</div>
          </div>
          <div className="rounded bg-black/25 border border-white/[0.06] px-2 py-1.5">
            <div className="text-2xs text-white/40">Order Ratio</div>
            <div className="text-xs font-bold font-mono tabular-nums text-white/90">
              {buyPct}% : {sellPct}%
            </div>
          </div>
          <div className="rounded bg-black/25 border border-white/[0.06] px-2 py-1.5">
            <div className="text-2xs text-white/40">Socket State</div>
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
                  "text-2xs font-semibold px-2 h-6 rounded transition-colors capitalize",
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

        <div className="grid grid-cols-3 px-3 py-1.5 text-2xs text-white/40">
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
                  <span className="relative z-10 text-micro font-mono tabular-nums font-semibold text-error-1">
                    {fmtPrice(row.price)}
                  </span>
                  <span className="relative z-10 text-micro font-mono tabular-nums text-white/80 text-right">
                    {fmtQty(row.quantity)}
                  </span>
                  <span className="relative z-10 text-micro font-mono tabular-nums text-white/40 text-right">
                    {fmtTotal(row.total)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-micro text-white/30">No active asks</div>
            ))}

          <div className="flex items-center justify-between px-3 py-2 my-1.5 rounded bg-black/35 border-l-[3px] border-l-blue-1">
            <span
              className={clsx(
                "text-sm font-bold font-mono tabular-nums flex items-center gap-1.5",
                direction === "up" ? "text-success-6" : direction === "down" ? "text-error-1" : "text-white"
              )}
            >
              {fmtPrice(displayPrice)}
              {direction === "up" ? <FiArrowUp size={13} /> : direction === "down" ? <FiArrowDown size={13} /> : null}
            </span>
            <span className="text-2xs text-white/40">
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
                  <span className="relative z-10 text-micro font-mono tabular-nums font-semibold text-success-6">
                    {fmtPrice(row.price)}
                  </span>
                  <span className="relative z-10 text-micro font-mono tabular-nums text-white/80 text-right">
                    {fmtQty(row.quantity)}
                  </span>
                  <span className="relative z-10 text-micro font-mono tabular-nums text-white/40 text-right">
                    {fmtTotal(row.total)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-micro text-white/30">No active bids</div>
            ))}
        </div>

        {/* Buy/sell depth imbalance */}
        <div className="px-3 pt-2.5 pb-3 mt-1 border-t border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between text-2xs font-semibold mb-1.5">
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
export default function TradingViewChart({ symbol = "BTC/USDT", market = "spot", orderBook, orderLevels = [], lastPrice = null, onLastPriceChange, insightTabs = false, recentTrades = [] }: Props) {
  const [interval, setIntervalVal] = useState<Interval>("15m");
  const [view, setView] = useState<View>("chart");
  const [showDepth, setShowDepth] = useState(false);
  const [base = "", quote = ""] = symbol.split("/");
  const tabs: readonly View[] = insightTabs ? ["chart", "overview", "data"] : ["chart", "depth"];
  const TAB_LABELS: Record<View, string> = { chart: "Chart", depth: "Depth", overview: "Overview", data: "Data" };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [usesFullscreenFallback, setUsesFullscreenFallback] = useState(false);
  const chartRootRef = useRef<HTMLDivElement>(null);
  const fullscreenFallbackRef = useRef(false);
  const marketLabel = market === "futures" ? "Futures" : market === "margin" ? "Margin" : "Spot";
  const bookLive = orderBook?.isConnected ?? false;

  const bids = orderBook?.buyOrders ?? [];
  const asks = orderBook?.sellOrders ?? [];

  const [chartType, setChartType] = useState<ChartType>("candles");
  const [indicators, setIndicators] = useState<ChartIndicators>(DEFAULT_INDICATORS);
  const [priceScaleMode, setPriceScaleMode] = useState<"normal" | "log" | "percent">("normal");
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);
  const [showIndicatorsModal, setShowIndicatorsModal] = useState(false);
  const chartTypeMenuRef = useRef<HTMLDivElement>(null);
  const indicatorsMenuRef = useRef<HTMLDivElement>(null);

  const [utcTime, setUtcTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().slice(11, 19));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        chartTypeMenuRef.current &&
        !chartTypeMenuRef.current.contains(e.target as Node)
      ) {
        setShowChartTypeDropdown(false);
      }
      if (
        indicatorsMenuRef.current &&
        !indicatorsMenuRef.current.contains(e.target as Node)
      ) {
        setShowIndicatorsModal(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

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
      {/* One shared control surface for all three trading products.
          Row 1: view tabs + market status + fullscreen. Row 2: interval strip. */}
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-2">
        <div className="flex shrink-0 items-center">
          {tabs.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={clsx(
                "relative h-10 px-3 text-sm font-semibold capitalize transition-colors",
                view === v
                  ? "text-white after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                  : "text-white/40 hover:text-white/70"
              )}
            >
              {TAB_LABELS[v]}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 text-2xs font-medium text-white/45 sm:flex">
            <span className="rounded bg-white/[0.06] px-1.5 py-1 text-white/60">{marketLabel}</span>
            <span className="inline-flex items-center gap-1.5" title="Order book WebSocket status">
              <span className={clsx("h-1.5 w-1.5 rounded-full", bookLive ? "bg-success-6" : "bg-warning-1")} />
              {bookLive ? "Live" : "Reconnecting"}
            </span>
          </div>
          {insightTabs && view === "chart" && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-white/60 transition-colors hover:text-white">
              <input
                type="checkbox"
                checked={showDepth}
                onChange={() => setShowDepth((v) => !v)}
                className="h-3.5 w-3.5 cursor-pointer accent-primary"
              />
              Depth
            </label>
          )}
          {(!insightTabs || view === "chart" || isFullscreen) && (
          <button
            type="button"
            onClick={() => void (isFullscreen ? exitFullscreen() : enterFullscreen())}
            aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
            title={isFullscreen ? "Exit full screen" : "Enter full screen"}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:text-white"
          >
            {isFullscreen ? <FiMinimize2 size={14} /> : <FiMaximize2 size={14} />}
          </button>
          )}
        </div>
      </div>

      {view === "chart" && (
        <div className="shrink-0 overflow-x-auto px-2 [scrollbar-width:none]">
          <div className="flex h-9 min-w-max items-center gap-0.5">
            {QUICK_INTERVALS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setIntervalVal(value)}
                aria-pressed={interval === value}
                className={clsx(
                  "h-7 rounded px-2 text-xs font-semibold transition-colors",
                  interval === value ? "text-primary" : "text-white/50 hover:text-white"
                )}
              >
                {label}
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
                className={clsx(
                  "h-7 cursor-pointer appearance-none rounded bg-transparent pl-2 pr-5 text-xs font-semibold outline-none transition-colors",
                  MORE_INTERVALS.some(({ value }) => value === interval)
                    ? "text-primary"
                    : "text-white/50 hover:text-white"
                )}
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
                className="pointer-events-none absolute right-1 text-white/50"
                size={12}
              />
            </div>

            {/* Divider */}
            <div className="mx-1 h-3.5 w-px bg-white/10" />

            {/* Chart Type Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowChartTypeDropdown((v) => !v);
                  setShowIndicatorsModal(false);
                }}
                title={`Chart type: ${chartType}`}
                aria-label="Chart type"
                className={clsx(
                  "flex h-7 items-center gap-1 rounded px-2 text-xs font-semibold transition-colors hover:bg-white/[0.08]",
                  showChartTypeDropdown ? "bg-white/[0.08] text-white" : "text-white/60 hover:text-white"
                )}
              >
                {chartType === "candles" && <TbChartCandle size={15} />}
                {chartType === "bars" && <TbChartBar size={15} />}
                {chartType === "line" && <TbChartLine size={15} />}
                {chartType === "area" && <TbChartArea size={15} />}
                <FiChevronDown size={11} className="text-white/40" />
              </button>

              {showChartTypeDropdown && (
                <div
                  ref={chartTypeMenuRef}
                  className="absolute left-0 top-8 z-50 flex w-36 flex-col gap-0.5 rounded-lg border border-white/10 bg-[#1e2026] p-1.5 shadow-2xl backdrop-blur-md"
                >
                  <button
                    type="button"
                    onClick={() => { setChartType("candles"); setShowChartTypeDropdown(false); }}
                    className={clsx(
                      "flex items-center justify-between rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.08]",
                      chartType === "candles" ? "text-primary bg-primary/10" : "text-white/80"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <TbChartCandle size={15} />
                      Candles
                    </span>
                    {chartType === "candles" && <FiCheck size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setChartType("bars"); setShowChartTypeDropdown(false); }}
                    className={clsx(
                      "flex items-center justify-between rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.08]",
                      chartType === "bars" ? "text-primary bg-primary/10" : "text-white/80"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <TbChartBar size={15} />
                      Bars
                    </span>
                    {chartType === "bars" && <FiCheck size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setChartType("line"); setShowChartTypeDropdown(false); }}
                    className={clsx(
                      "flex items-center justify-between rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.08]",
                      chartType === "line" ? "text-primary bg-primary/10" : "text-white/80"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <TbChartLine size={15} />
                      Line
                    </span>
                    {chartType === "line" && <FiCheck size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setChartType("area"); setShowChartTypeDropdown(false); }}
                    className={clsx(
                      "flex items-center justify-between rounded px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.08]",
                      chartType === "area" ? "text-primary bg-primary/10" : "text-white/80"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <TbChartArea size={15} />
                      Area
                    </span>
                    {chartType === "area" && <FiCheck size={12} />}
                  </button>
                </div>
              )}
            </div>

            {/* Indicators Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowIndicatorsModal((v) => !v);
                  setShowChartTypeDropdown(false);
                }}
                title="Indicators"
                aria-label="Indicators"
                className={clsx(
                  "flex h-7 items-center gap-1.5 rounded px-2 text-xs font-semibold transition-colors hover:bg-white/[0.08]",
                  showIndicatorsModal ? "bg-white/[0.08] text-white" : "text-white/60 hover:text-white"
                )}
              >
                <TbFunction size={16} />
                <span className="text-[11px]">Indicators</span>
              </button>

              {showIndicatorsModal && (
                <div
                  ref={indicatorsMenuRef}
                  className="absolute left-0 top-8 z-50 flex w-72 flex-col gap-3 rounded-xl border border-white/10 bg-[#1e2026] p-4 shadow-2xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                    <span className="text-xs font-bold text-white">Technical Indicators</span>
                    <button
                      type="button"
                      onClick={() => setIndicators(DEFAULT_INDICATORS)}
                      title="Reset indicators"
                      className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors"
                    >
                      <FiRotateCcw size={10} />
                      Reset
                    </button>
                  </div>

                  {/* MA 7 */}
                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-white/90">
                      <input
                        type="checkbox"
                        checked={indicators.showMa7}
                        onChange={(e) => setIndicators((prev) => ({ ...prev, showMa7: e.target.checked }))}
                        className="h-3.5 w-3.5 rounded accent-[#F0B90B]"
                      />
                      <span className="h-2 w-2 rounded-full bg-[#F0B90B]" />
                      Moving Average 1
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={indicators.ma7Period}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val > 0) {
                          setIndicators((prev) => ({ ...prev, ma7Period: val }));
                        }
                      }}
                      className="h-6 w-14 rounded border border-white/15 bg-white/[0.04] px-1 text-center font-mono text-xs text-white outline-none focus:border-primary"
                    />
                  </div>

                  {/* MA 25 */}
                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-white/90">
                      <input
                        type="checkbox"
                        checked={indicators.showMa25}
                        onChange={(e) => setIndicators((prev) => ({ ...prev, showMa25: e.target.checked }))}
                        className="h-3.5 w-3.5 rounded accent-[#E040FB]"
                      />
                      <span className="h-2 w-2 rounded-full bg-[#E040FB]" />
                      Moving Average 2
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={indicators.ma25Period}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val > 0) {
                          setIndicators((prev) => ({ ...prev, ma25Period: val }));
                        }
                      }}
                      className="h-6 w-14 rounded border border-white/15 bg-white/[0.04] px-1 text-center font-mono text-xs text-white outline-none focus:border-primary"
                    />
                  </div>

                  {/* MA 99 */}
                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-white/90">
                      <input
                        type="checkbox"
                        checked={indicators.showMa99}
                        onChange={(e) => setIndicators((prev) => ({ ...prev, showMa99: e.target.checked }))}
                        className="h-3.5 w-3.5 rounded accent-[#00BCD4]"
                      />
                      <span className="h-2 w-2 rounded-full bg-[#00BCD4]" />
                      Moving Average 3
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={indicators.ma99Period}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val > 0) {
                          setIndicators((prev) => ({ ...prev, ma99Period: val }));
                        }
                      }}
                      className="h-6 w-14 rounded border border-white/15 bg-white/[0.04] px-1 text-center font-mono text-xs text-white outline-none focus:border-primary"
                    />
                  </div>

                  {/* Volume */}
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-2">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-white/90">
                      <input
                        type="checkbox"
                        checked={indicators.showVolume}
                        onChange={(e) => setIndicators((prev) => ({ ...prev, showVolume: e.target.checked }))}
                        className="h-3.5 w-3.5 rounded accent-primary"
                      />
                      Volume Histogram
                    </label>
                  </div>

                  {/* Volume SMA */}
                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-white/90">
                      <input
                        type="checkbox"
                        checked={indicators.showVolumeSma}
                        onChange={(e) => setIndicators((prev) => ({ ...prev, showVolumeSma: e.target.checked }))}
                        className="h-3.5 w-3.5 rounded accent-[#3B82F6]"
                      />
                      <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                      Volume SMA (9)
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chart views */}
      {view === "chart" ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="relative h-full min-w-0 flex-1 overflow-hidden">
              <LwcCandlestickChart
                symbol={symbol}
                interval={interval}
                market={market}
                orderLevels={orderLevels}
                onLastPriceChange={onLastPriceChange}
                chartType={chartType}
                indicators={indicators}
                priceScaleMode={priceScaleMode}
              />
            </div>
            {insightTabs && showDepth && (
              <div className="flex w-[340px] shrink-0 border-l border-white/[0.06]">
                <DepthPanel
                  symbol={symbol}
                  buyOrders={bids}
                  sellOrders={asks}
                  isConnected={orderBook?.isConnected ?? false}
                  lastPrice={lastPrice}
                />
              </div>
            )}
          </div>

          {/* Bybit-style bottom bar: time range shortcuts, UTC clock, %/log/auto toggles */}
          <div className="flex h-7 shrink-0 items-center justify-between border-t border-white/[0.06] bg-[#181a20] px-2.5 text-[11px] font-mono select-none">
            {/* Quick Range shortcuts */}
            <div className="flex items-center gap-2 text-white/45">
              {[
                { label: "1D", targetInterval: "5m" },
                { label: "5D", targetInterval: "15m" },
                { label: "1M", targetInterval: "1h" },
                { label: "3M", targetInterval: "4h" },
                { label: "6M", targetInterval: "1d" },
                { label: "1Y", targetInterval: "1d" },
              ].map(({ label, targetInterval }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIntervalVal(targetInterval as Interval)}
                  className="hover:text-white transition-colors px-1"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Real-time UTC clock */}
            <div className="hidden sm:block text-white/40">
              {utcTime} UTC
            </div>

            {/* Scale toggles: %, log, auto */}
            <div className="flex items-center gap-2 font-semibold">
              <button
                type="button"
                onClick={() => setPriceScaleMode((curr) => (curr === "percent" ? "normal" : "percent"))}
                className={clsx(
                  "px-1.5 py-0.5 rounded transition-colors",
                  priceScaleMode === "percent" ? "text-primary bg-primary/10" : "text-white/45 hover:text-white"
                )}
                title="Percentage scale"
              >
                %
              </button>
              <button
                type="button"
                onClick={() => setPriceScaleMode((curr) => (curr === "log" ? "normal" : "log"))}
                className={clsx(
                  "px-1.5 py-0.5 rounded transition-colors",
                  priceScaleMode === "log" ? "text-primary bg-primary/10" : "text-white/45 hover:text-white"
                )}
                title="Logarithmic scale"
              >
                log
              </button>
              <button
                type="button"
                onClick={() => {
                  setPriceScaleMode("normal");
                }}
                className={clsx(
                  "px-1.5 py-0.5 rounded transition-colors",
                  priceScaleMode === "normal" ? "text-primary bg-primary/10" : "text-white/45 hover:text-white"
                )}
                title="Auto scale"
              >
                auto
              </button>
            </div>
          </div>
        </div>
      ) : view === "overview" ? (
        <TokenOverview base={base} />
      ) : view === "data" ? (
        <TradeFlowPanel trades={recentTrades} base={base} quote={quote} />
      ) : (
        <div className="flex-1 min-h-0 flex">
          <DepthPanel
            symbol={symbol}
            buyOrders={bids}
            sellOrders={asks}
            isConnected={orderBook?.isConnected ?? false}
            lastPrice={lastPrice}
          />
        </div>
      )}
    </div>
  );
}