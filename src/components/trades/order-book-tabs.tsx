"use client";

import { Tabs, TabsList, TabsPanel, TabsTab } from "@mantine/core";
import type { OrderBookEntry } from "@/src/hooks/use-order-book";
import type { RecentTrade } from "@/src/hooks/use-recent-trades";

interface OrderBookTabsProps {
  buyOrders: OrderBookEntry[];
  sellOrders: OrderBookEntry[];
  recentTrades: RecentTrade[];
  recentTradesLoading: boolean;
  base: string;
  quote: string;
  currentPrice: number | null;
  buyPercentage?: number | null;
  sellPercentage?: number | null;
  isConnected?: boolean;
  lastUpdated?: Date | null;
  onSelectPrice: (price: number) => void;
  className?: string;
}

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
  buyPercentage,
  sellPercentage,
  isConnected = false,
  lastUpdated = null,
  onSelectPrice,
  className = "",
}: OrderBookTabsProps) {
  const maxAsk = Math.max(...sellOrders.map((order) => order.quantity), 0.001);
  const maxBid = Math.max(...buyOrders.map((order) => order.quantity), 0.001);
  const totalBuy = buyOrders.reduce((total, order) => total + order.quantity, 0);
  const totalSell = sellOrders.reduce((total, order) => total + order.quantity, 0);
  const total = totalBuy + totalSell;
  const hasPressureData = total > 0 || buyPercentage != null || sellPercentage != null;
  const calculatedBuyPercent = total > 0 ? (totalBuy / total) * 100 : 50;
  const buyPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(buyPercentage ?? (sellPercentage != null ? 100 - sellPercentage : calculatedBuyPercent))
    )
  );
  const sellPercent = 100 - buyPercent;
  const empty = buyOrders.length === 0 && sellOrders.length === 0;
  const lowestAsk = sellOrders.length > 0 ? Math.min(...sellOrders.map((order) => order.price)) : null;
  const highestBid = buyOrders.length > 0 ? Math.max(...buyOrders.map((order) => order.price)) : null;
  const spread = lowestAsk !== null && highestBid !== null ? lowestAsk - highestBid : null;

  return (
    <Tabs
      defaultValue="orderbook"
      className={`flex h-full min-h-0 flex-col overflow-hidden bg-[#181a20] ${className}`}
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
          <div className="grid shrink-0 grid-cols-3 px-3 py-1">
            <span className="text-[10px] text-white/40">Price({quote})</span>
            <span className="text-right text-[10px] text-white/40">Qty({base})</span>
            <span className="text-right text-[10px] text-white/40">Total</span>
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
              <div className="flex min-h-0 flex-1 flex-col justify-end overflow-y-auto">
                {[...sellOrders].slice(0, 10).reverse().map((order, index) => (
                  <button
                    type="button"
                    key={`ask-${index}-${order.price}`}
                    onClick={() => onSelectPrice(order.price)}
                    className="relative grid shrink-0 grid-cols-3 overflow-hidden px-3 py-[3px] text-left hover:bg-white/[0.02]"
                  >
                    <span className="absolute inset-y-0 right-0 bg-error-1/[0.08]" style={{ width: `${Math.min((order.quantity / maxAsk) * 100, 100)}%` }} />
                    <span className="z-10 font-mono text-[11px] font-semibold tabular-nums text-error-1">{formatNumber(order.price, 2)}</span>
                    <span className="z-10 text-right font-mono text-[11px] tabular-nums text-white/80">{formatNumber(order.quantity, 6)}</span>
                    <span className="z-10 text-right font-mono text-[11px] tabular-nums text-white/40">{formatNumber(order.price * order.quantity, 2)}</span>
                  </button>
                ))}
              </div>
              <div className="flex shrink-0 items-center justify-between border-y border-white/[0.05] px-3 py-2">
                <span className="font-mono text-sm font-bold tabular-nums text-white">
                  {currentPrice === null ? "—" : formatNumber(currentPrice, 2)}
                </span>
                <span className="text-[10px] text-white/35">
                  {spread === null ? "Last Price" : `Spread ${formatNumber(spread, 2)}`}
                </span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                {buyOrders.slice(0, 10).map((order, index) => (
                  <button
                    type="button"
                    key={`bid-${index}-${order.price}`}
                    onClick={() => onSelectPrice(order.price)}
                    className="relative grid shrink-0 grid-cols-3 overflow-hidden px-3 py-[3px] text-left hover:bg-white/[0.02]"
                  >
                    <span className="absolute inset-y-0 right-0 bg-success-6/[0.08]" style={{ width: `${Math.min((order.quantity / maxBid) * 100, 100)}%` }} />
                    <span className="z-10 font-mono text-[11px] font-semibold tabular-nums text-success-6">{formatNumber(order.price, 2)}</span>
                    <span className="z-10 text-right font-mono text-[11px] tabular-nums text-white/80">{formatNumber(order.quantity, 6)}</span>
                    <span className="z-10 text-right font-mono text-[11px] tabular-nums text-white/40">{formatNumber(order.price * order.quantity, 2)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {hasPressureData && (
            <div className="mt-1 flex shrink-0 items-center gap-2 px-2 pb-1 text-[10px] font-semibold">
              <span className="inline-flex items-center gap-1 text-success-6">
                <span className="rounded border border-success-6/50 px-1">B</span>{buyPercent}%
              </span>
              <div className="flex h-2 flex-1 overflow-hidden rounded-sm">
                <div className="bg-success-6" style={{ width: `${buyPercent}%` }} />
                <div className="bg-error-1" style={{ width: `${sellPercent}%` }} />
              </div>
              <span className="inline-flex items-center gap-1 text-error-1">
                {sellPercent}%<span className="rounded border border-error-1/50 px-1">S</span>
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
