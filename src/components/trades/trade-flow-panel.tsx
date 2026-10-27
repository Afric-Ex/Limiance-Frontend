"use client";

import { useMemo } from "react";

type Trade = Record<string, unknown>;

const num = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const fmt = (value: number, digits = 2) =>
  value.toLocaleString("en-US", { maximumFractionDigits: digits });

type Bucket = { count: number; qty: number; value: number; largest: number };
const emptyBucket = (): Bucket => ({ count: 0, qty: 0, value: 0, largest: 0 });

function FlowCard({
  title,
  tone,
  bucket,
  base,
  quote,
}: {
  title: string;
  tone: "buy" | "sell";
  bucket: Bucket;
  base: string;
  quote: string;
}) {
  const color = tone === "buy" ? "text-[#25AB42]" : "text-[#F6465D]";
  const rows = [
    ["Trades", fmt(bucket.count, 0)],
    [`Volume (${base})`, fmt(bucket.qty, 6)],
    [`Turnover (${quote})`, fmt(bucket.value)],
    [`Largest (${quote})`, fmt(bucket.largest)],
  ];
  return (
    <div className="rounded-lg border border-white/[0.06] p-3">
      <div className={`mb-2 text-xs font-bold ${color}`}>{title}</div>
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between py-1 text-xs">
          <span className="text-white/50">{label}</span>
          <span className="font-semibold tabular-nums text-white/90">{value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Data tab. Buy vs sell flow worked out from the latest trades that the
 * recent-trades feed delivers — nothing here is a fixed number.
 */
export function TradeFlowPanel({
  trades,
  base,
  quote,
}: {
  trades: readonly Trade[];
  base: string;
  quote: string;
}) {
  const { buy, sell, counted } = useMemo(() => {
    const buy = emptyBucket();
    const sell = emptyBucket();
    let counted = 0;
    for (const trade of trades) {
      const price = num(trade.price ?? trade.rate);
      const qty = num(trade.quantity ?? trade.qty ?? trade.size ?? trade.amount);
      if (!(price > 0 && qty > 0)) continue;
      const side = String(trade.side ?? trade.direction ?? "").toUpperCase();
      const bucket = side === "BUY" ? buy : side === "SELL" ? sell : null;
      if (!bucket) continue;
      const value = price * qty;
      bucket.count += 1;
      bucket.qty += qty;
      bucket.value += value;
      bucket.largest = Math.max(bucket.largest, value);
      counted += 1;
    }
    return { buy, sell, counted };
  }, [trades]);

  const total = buy.value + sell.value;
  if (counted === 0 || total <= 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-white/40">
        No recent trades to analyse yet.
      </div>
    );
  }

  const buyShare = buy.value / total;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <h3 className="text-base font-bold text-white">Trade flow</h3>
      <p className="mb-4 mt-1 text-xs text-white/40">Based on the latest {counted} trades</p>

      <div className="flex flex-col items-center gap-6 min-[1300px]:flex-row min-[1300px]:items-start">
        <div className="relative h-[180px] w-[180px] shrink-0">
          <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
            <circle cx="90" cy="90" r={radius} fill="none" stroke="#F6465D" strokeWidth="26" />
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="#25AB42"
              strokeWidth="26"
              strokeDasharray={`${circumference * buyShare} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tabular-nums text-white">{(buyShare * 100).toFixed(1)}%</span>
            <span className="text-[10px] text-white/40">buy share</span>
          </div>
        </div>

        <div className="grid w-full min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <FlowCard title="Inflow (buys)" tone="buy" bucket={buy} base={base} quote={quote} />
          <FlowCard title="Outflow (sells)" tone="sell" bucket={sell} base={base} quote={quote} />
        </div>
      </div>
    </div>
  );
}