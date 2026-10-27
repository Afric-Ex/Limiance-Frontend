"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import { FiChevronDown } from "react-icons/fi";
import { IoArrowDown, IoArrowUp } from "react-icons/io5";
import type { OrderBookEntry } from "@/src/hooks/use-order-book";
import type { RecentTrade } from "@/src/hooks/use-recent-trades";
import { getLatestTradePrice } from "@/src/lib/recent-trades";

interface OrderBookTabsProps {
  buyOrders: OrderBookEntry[];
  sellOrders: OrderBookEntry[];
  recentTrades: RecentTrade[];
  recentTradesLoading: boolean;
  base: string;
  quote: string;
  currentPrice: number | null;
  // 24h % change; only used to pick the arrow before any live price move is seen.
  dayChangePercent?: number | null;
  buyPercentage?: number | null;
  sellPercentage?: number | null;
  isConnected?: boolean;
  lastUpdated?: Date | null;
  onSelectPrice: (price: number) => void;
  fixedHeight?: number;
  className?: string;
}

type ViewMode = "both" | "bids" | "asks";
type Level = OrderBookEntry & { total: number };

// Quote assets that trade ~1:1 with USD, so "≈ price USD" is accurate for them.
const USD_PEGGED = new Set(["USDT", "USDC", "USD", "BUSD", "DAI", "FDUSD", "TUSD"]);

function formatTime(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString();
}

function formatNumber(value: unknown, digits = 6) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("en-US", { maximumFractionDigits: digits })
    : "—";
}

// Number of decimals a price actually uses (capped at 8).
function decimalsOf(value: number) {
  if (!Number.isFinite(value)) return 0;
  const fixed = value.toFixed(8).replace(/0+$/, "");
  const dot = fixed.indexOf(".");
  return dot === -1 ? 0 : fixed.length - dot - 1;
}

// Merge raw levels into price buckets of `step`: asks round up, bids round
// down, so a grouped level never shows a better price than really exists.
function groupLevels(
  levels: OrderBookEntry[],
  step: number,
  side: "ask" | "bid",
  decimals: number
): OrderBookEntry[] {
  const buckets = new Map<number, number>();
  for (const level of levels) {
    const ratio = level.price / step;
    const bucket = (side === "ask" ? Math.ceil(ratio - 1e-9) : Math.floor(ratio + 1e-9)) * step;
    const key = Number(bucket.toFixed(decimals));
    buckets.set(key, (buckets.get(key) ?? 0) + level.quantity);
  }
  const out = Array.from(buckets, ([price, quantity]) => ({ price, quantity }));
  return out.sort((a, b) => (side === "ask" ? a.price - b.price : b.price - a.price));
}

// Running total of quantity, counted outward from the best price.
function withTotals(levels: OrderBookEntry[]): Level[] {
  let running = 0;
  return levels.map((level) => {
    running += level.quantity;
    return { ...level, total: running };
  });
}

// Direction of the latest trade relative to the last different price before it.
function directionFromTrades(trades: readonly Record<string, unknown>[]): "up" | "down" | null {
  const rows = trades
    .map((trade) => {
      const price = Number(trade.price ?? trade.rate);
      const raw = trade.createdAt ?? trade.timestamp ?? trade.time ?? trade.ts ?? trade.executedAt;
      const time = raw == null ? NaN : new Date(raw as string | number).getTime();
      return { price, time };
    })
    .filter((row) => Number.isFinite(row.price) && row.price > 0);
  if (rows.length < 2) return null;
  // Newest first: by timestamp when every row has one, otherwise as delivered.
  const ordered = rows.every((row) => Number.isFinite(row.time))
    ? [...rows].sort((a, b) => b.time - a.time)
    : rows;
  const latest = ordered[0].price;
  const previous = ordered.find((row) => row.price !== latest);
  return previous ? (latest > previous.price ? "up" : "down") : null;
}

function ViewModeButton({
  mode,
  active,
  onSelect,
}: {
  mode: ViewMode;
  active: boolean;
  onSelect: (mode: ViewMode) => void;
}) {
  const top = mode === "bids" ? "bg-success-6" : "bg-error-1";
  const bottom = mode === "asks" ? "bg-error-1" : "bg-success-6";
  const label = mode === "both" ? "Show bids and asks" : mode === "bids" ? "Show bids only" : "Show asks only";
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={clsx(
        "flex h-5 w-5 flex-col items-center justify-center gap-px rounded transition-opacity",
        active ? "bg-white/10" : "opacity-50 hover:opacity-90"
      )}
    >
      <span className={clsx("h-[3px] w-3.5", top)} />
      <span className={clsx("h-[3px] w-3.5", bottom)} />
    </button>
  );
}

function RecentTradesPanel({
  trades,
  isLoading,
}: {
  trades: RecentTrade[];
  isLoading: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="grid shrink-0 grid-cols-3 px-3 py-2 text-[10px] text-white/40">
        <span>Price</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Time</span>
      </div>
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-xs text-white/35">
          Waiting for recent trades…
        </div>
      ) : trades.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-white/35">
          No recent trades
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {trades.map((trade, index) => {
            const side = String(trade.side ?? trade.direction ?? "").toUpperCase();
            const isBuy = side === "BUY";
            const price = trade.price ?? trade.rate;
            const quantity = trade.quantity ?? trade.qty ?? trade.size ?? trade.amount;
            const time =
              trade.timestamp ?? trade.createdAt ?? trade.time ?? trade.ts;
            return (
              <div
                key={String(trade.id ?? trade.tradeId ?? trade.trade_id ?? `${time}-${price}-${index}`)}
                className="grid grid-cols-3 items-center px-3 py-1 text-[11px] font-mono tabular-nums"
              >
                <span className={isBuy ? "text-success-6" : side === "SELL" ? "text-error-1" : "text-white/80"}>
                  {formatNumber(price)}
                </span>
                <span className="text-right text-white/80">{formatNumber(quantity)}</span>
                <span className="text-right text-white/40">{formatTime(time)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OrderBookTabs({
  buyOrders,
  sellOrders,
  recentTrades,
  recentTradesLoading,
  base,
  quote,
  currentPrice,
  dayChangePercent = null,
  buyPercentage,
  sellPercentage,
  isConnected = false,
  lastUpdated = null,
  onSelectPrice,
  fixedHeight,
  className = "",
}: OrderBookTabsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [priceDir, setPriceDir] = useState<"up" | "down" | null>(null);
  const previousPriceRef = useRef<number | null>(null);

  // Best price first on each side, whatever order the feed delivers.
  const rawAsks = useMemo(() => [...sellOrders].sort((a, b) => a.price - b.price), [sellOrders]);
  const rawBids = useMemo(() => [...buyOrders].sort((a, b) => b.price - a.price), [buyOrders]);

  // Finest price step the feed really uses (e.g. 2 decimals -> 0.01); the
  // precision dropdown offers that step and three coarser ones.
  const finestDecimals = useMemo(() => {
    const sample = [...rawAsks.slice(0, 20), ...rawBids.slice(0, 20)];
    return sample.length ? Math.max(...sample.map((level) => decimalsOf(level.price))) : 2;
  }, [rawAsks, rawBids]);
  const stepOptions = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) =>
        Number((10 ** (i - finestDecimals)).toFixed(Math.max(finestDecimals, 0)))
      ),
    [finestDecimals]
  );
  const activeStep = selectedStep !== null && stepOptions.includes(selectedStep) ? selectedStep : stepOptions[0];
  const displayDecimals = Math.max(decimalsOf(activeStep), 0);
  const formatPrice = (value: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: displayDecimals, maximumFractionDigits: displayDecimals });

  const asks = useMemo(
    () => (activeStep > stepOptions[0] ? groupLevels(rawAsks, activeStep, "ask", finestDecimals) : rawAsks),
    [rawAsks, activeStep, stepOptions, finestDecimals]
  );
  const bids = useMemo(
    () => (activeStep > stepOptions[0] ? groupLevels(rawBids, activeStep, "bid", finestDecimals) : rawBids),
    [rawBids, activeStep, stepOptions, finestDecimals]
  );

  const rowLimit = viewMode === "both" ? 10 : 20;
  const askRows = useMemo(() => withTotals(asks.slice(0, rowLimit)), [asks, rowLimit]);
  const bidRows = useMemo(() => withTotals(bids.slice(0, rowLimit)), [bids, rowLimit]);
  const maxTotal = Math.max(
    askRows.length ? askRows[askRows.length - 1].total : 0,
    bidRows.length ? bidRows[bidRows.length - 1].total : 0,
    0.000001
  );

  const totalBuy = buyOrders.reduce((total, order) => total + order.quantity, 0);
  const totalSell = sellOrders.reduce((total, order) => total + order.quantity, 0);
  const total = totalBuy + totalSell;
  const hasPressureData = total > 0;
  const calculatedBuyPercent = total > 0 ? (totalBuy / total) * 100 : 50;
  const buyPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        total > 0
          ? calculatedBuyPercent
          : buyPercentage ?? (sellPercentage != null ? 100 - sellPercentage : calculatedBuyPercent)
      )
    )
  );
  const sellPercent = 100 - buyPercent;
  const empty = buyOrders.length === 0 && sellOrders.length === 0;
  const lowestAsk = rawAsks.length > 0 ? rawAsks[0].price : null;
  const highestBid = rawBids.length > 0 ? rawBids[0].price : null;
  const spread = lowestAsk !== null && highestBid !== null ? lowestAsk - highestBid : null;
  const latestTradePrice = getLatestTradePrice(recentTrades);
  const lastTradedPrice =
    latestTradePrice ?? (currentPrice != null && currentPrice > 0 ? currentPrice : null);

  // Arrow next to the last price: direction of its most recent move.
  useEffect(() => {
    if (lastTradedPrice === null) return;
    const previous = previousPriceRef.current;
    if (previous !== null && lastTradedPrice !== previous) {
      setPriceDir(lastTradedPrice > previous ? "up" : "down");
    }
    previousPriceRef.current = lastTradedPrice;
  }, [lastTradedPrice]);

  const tradeDir = useMemo(() => directionFromTrades(recentTrades), [recentTrades]);
  const shownDir =
    priceDir ??
    tradeDir ??
    (dayChangePercent === null || !Number.isFinite(Number(dayChangePercent))
      ? null
      : Number(dayChangePercent) >= 0
        ? "up"
        : "down");
  const priceTone =
    shownDir === "up" ? "text-success-6" : shownDir === "down" ? "text-error-1" : "text-white";
  const sideNote =
    lastTradedPrice !== null && quote && USD_PEGGED.has(String(quote).toUpperCase())
      ? `â‰ˆ${formatPrice(lastTradedPrice)} USD`
      : spread === null
        ? "Last Price"
        : `Spread ${formatPrice(spread)}`;

  const renderRow = (order: Level, side: "ask" | "bid", distance: number) => (
    <button
      type="button"
      key={`${side}-${distance}-${order.price}`}
      onClick={() => onSelectPrice(order.price)}
      className={clsx(
        "relative grid shrink-0 grid-cols-3 overflow-hidden px-3 py-[3px] text-left hover:bg-white/[0.04]",
        distance >= 5 && "max-[1150px]:hidden"
      )}
    >
      <span
        className={clsx("absolute inset-y-0 right-0", side === "ask" ? "bg-error-1/[0.12]" : "bg-success-6/[0.12]")}
        style={{ width: `${Math.min((order.total / maxTotal) * 100, 100)}%` }}
      />
      <span
        className={clsx(
          "z-10 font-mono text-[11px] font-semibold tabular-nums",
          side === "ask" ? "text-error-1" : "text-success-6"
        )}
      >
        {formatPrice(order.price)}
      </span>
      <span className="z-10 text-right font-mono text-[11px] tabular-nums text-white/80">{formatNumber(order.quantity, 6)}</span>
      <span className="z-10 text-right font-mono text-[11px] tabular-nums text-white/60">{formatNumber(order.total, 6)}</span>
    </button>
  );

  return (
    <Tabs
      defaultValue="orderbook"
      className={`flex h-full min-h-0 flex-col overflow-hidden bg-[#181a20] ${className}`}
      style={fixedHeight ? { height: fixedHeight, flex: "none" } : undefined}
      classNames={{
        root: "flex h-full min-h-0 flex-col overflow-hidden",
        list: "shrink-0 border-b border-white/[0.06] px-3",
        tab: "!py-3 !px-2 !text-xs !font-semibold !text-white/45 data-[active]:!border-b-2 data-[active]:!border-primary data-[active]:!text-white",
        panel: "flex min-h-0 flex-1 flex-col overflow-hidden",
      }}
    >
      <TabsList>
        <TabsTab value="orderbook">Order Book</TabsTab>
        <TabsTab value="recentTrades">Recent Trade</TabsTab>
      </TabsList>
      <TabsPanel value="orderbook">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-1">
          {/* Desktop-only controls: which side to show + price grouping */}
          <div className="hidden shrink-0 items-center justify-between px-2 pb-1.5 pt-1 min-[1150px]:flex">
            <div className="flex items-center gap-1.5">
              {(["both", "bids", "asks"] as const).map((mode) => (
                <ViewModeButton key={mode} mode={mode} active={viewMode === mode} onSelect={setViewMode} />
              ))}
            </div>
            <div className="relative flex h-6 items-center">
              <select
                aria-label="Price grouping"
                value={activeStep}
                onChange={(event) => setSelectedStep(Number(event.currentTarget.value))}
                className="h-6 w-[88px] cursor-pointer appearance-none rounded bg-white/[0.06] pl-2 pr-6 text-[11px] font-semibold text-white outline-none"
              >
                {stepOptions.map((step) => (
                  <option key={step} value={step} className="bg-[#181a20] text-white">
                    {formatNumber(step, 8)}
                  </option>
                ))}
              </select>
              <FiChevronDown aria-hidden="true" className="pointer-events-none absolute right-1.5 text-white/50" size={12} />
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-3 px-3 py-1">
            <span className="text-[10px] text-white/40">Price({quote})</span>
            <span className="text-right text-[10px] text-white/40">Qty({base})</span>
            <span className="text-right text-[10px] text-white/40">Total({base})</span>
          </div>
          {empty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-xs text-white/35">
              <span>
                {lastUpdated
                  ? "Order book update received, but no bid/ask levels were returned."
                  : isConnected
                    ? "Waiting for order book update…"
                    : "Connecting to order book…"}
              </span>
              {lastUpdated && (
                <span className="text-[10px] text-white/25">
                  Last update {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          ) : (
            <>
              {viewMode !== "bids" && (
                <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto">
                  {/* Farthest ask on top, best ask next to the price row */}
                  {[...askRows].reverse().map((order, index) => renderRow(order, "ask", askRows.length - 1 - index))}
                </div>
              )}
              <div className="flex shrink-0 items-center gap-3 border-y border-white/[0.05] px-3 py-2">
                <span className={clsx("flex items-center gap-1 font-mono text-lg font-bold tabular-nums", priceTone)}>
                  {shownDir === "up" && <IoArrowUp size={16} />}
                  {shownDir === "down" && <IoArrowDown size={16} />}
                  {lastTradedPrice === null ? "—" : formatPrice(lastTradedPrice)}
                </span>
                <span className="text-[11px] tabular-nums text-white/40">{sideNote}</span>
              </div>
              {viewMode !== "asks" && (
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                  {bidRows.map((order, index) => renderRow(order, "bid", index))}
                </div>
              )}
            </>
          )}
          {hasPressureData && (
            <div
              className="mt-1 flex shrink-0 items-center gap-2 px-2 pb-1 pt-1"
              role="img"
              aria-label={`Buy pressure ${buyPercent}%, sell pressure ${sellPercent}%`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border border-[#25AB42]/60 text-[10px] font-bold text-[#25AB42]">
                B
              </span>
              <span className="w-8 shrink-0 text-xs font-semibold tabular-nums text-[#25AB42]">{buyPercent}%</span>
              {/* Two flat blocks split by a slanted gap; width follows the real buy/sell split */}
              <div className="relative h-5 min-w-0 flex-1 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#25AB42]/35 transition-[width] duration-300"
                  style={{
                    width: `${buyPercent}%`,
                    clipPath: "polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
                  }}
                />
                <div
                  className="absolute inset-y-0 bg-[#F6465D]/35 transition-[left,width] duration-300"
                  style={{
                    left: `calc(${buyPercent}% - 6px)`,
                    width: `calc(${sellPercent}% + 6px)`,
                    clipPath: "polygon(9px 0, 100% 0, 100% 100%, 3px 100%)",
                  }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-[#F6465D]">{sellPercent}%</span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border border-[#F6465D]/60 text-[10px] font-bold text-[#F6465D]">
                S
              </span>
            </div>
          )}
        </div>
      </TabsPanel>
      <TabsPanel value="recentTrades">
        <RecentTradesPanel trades={recentTrades} isLoading={recentTradesLoading} />
      </TabsPanel>
    </Tabs>
  );
}