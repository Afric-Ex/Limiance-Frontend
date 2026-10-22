"use client";

import { useMarket } from "@/src/components/home/market-context";
import type { Mover } from "@/src/lib/landing/markets";

const SHOW = 4;

const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: n >= 1 ? 2 : 6,
  }).format(n);

function Row({ m }: { m: Mover }) {
  const { symbol, setSymbol } = useMarket();
  const up = m.changePct >= 0;
  // Never color-only: sign + arrow always accompany green/red.
  const label = `${up ? "+" : "-"}${Math.abs(m.changePct).toFixed(2)}%`;
  return (
    <li className="shrink-0">
      <button
        type="button"
        aria-pressed={m.symbol === symbol}
        onClick={() => setSymbol(m.symbol)}
        className={`flex items-baseline gap-3 rounded-lg px-2 py-1 tabular-nums transition-colors hover:bg-muted/30 ${
          m.symbol === symbol ? "bg-muted/50" : ""
        }`}
      >
        <span className="font-semibold text-[var(--color-text-primary)]">
          {m.symbol}
        </span>
        <span className="text-[var(--color-text-primary)]">
          {formatPrice(m.price)}
        </span>
        <span className={up ? "text-buy" : "text-sell"}>
          <span aria-hidden>{up ? "▲" : "▼"}</span> {label}
        </span>
      </button>
    </li>
  );
}

function Group({ title, items }: { title: string; items: Mover[] }) {
  if (items.length === 0) return null;
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-2 px-2 text-[length:var(--text-caption)] text-secondary">
        {title}
      </p>
      <ul className="flex gap-2 overflow-x-auto pb-1 text-[length:var(--text-body)]">
        {items.slice(0, SHOW).map((m) => (
          <Row key={m.symbol} m={m} />
        ))}
      </ul>
    </div>
  );
}

export function MarketStrip() {
  const { movers, moversLoaded } = useMarket();
  const empty =
    !movers || (movers.gainers.length === 0 && movers.losers.length === 0);
  // If the API fails or returns nothing, show nothing. Never show fake prices.
  if (moversLoaded && empty) return null;

  return (
    <div className="relative border-y border-white/10 bg-white/[0.03] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1240px] px-4 flex flex-col gap-6 py-5 md:flex-row md:gap-12">
        {!moversLoaded ? (
          <>
            <div className="skeleton h-10 flex-1 rounded-xl" />
            <div className="skeleton hidden h-10 flex-1 rounded-xl md:block" />
          </>
        ) : (
          <>
            <Group title="Top gainers, last 24 hours" items={movers!.gainers} />
            <Group title="Top losers, last 24 hours" items={movers!.losers} />
          </>
        )}
      </div>
    </div>
  );
}