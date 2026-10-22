"use client";

import { useMarket } from "@/src/components/home/market-context";
import { glass } from "@/src/components/home/glass";
import type { Mover } from "@/src/lib/landing/markets";

function Chip({ m, label, className, delay }: { m: Mover; label: string; className: string; delay: string }) {
  const { setSymbol } = useMarket();
  const up = m.changePct >= 0;
  return (
    <button
      type="button"
      onClick={() => setSymbol(m.symbol)}
      style={{ animationDelay: delay }}
      className={`${glass} absolute z-20 animate-float rounded-2xl px-4 py-3 text-left tabular-nums motion-reduce:animate-none ${className}`}
    >
      <span className="block text-xs text-white/60">{label}</span>
      <span className="mt-0.5 block font-semibold text-white">{m.symbol}</span>
      <span className={up ? "text-[#3DDC68]" : "text-[#FF5D73]"}>
        <span aria-hidden>{up ? "▲" : "▼"}</span> {up ? "+" : "-"}
        {Math.abs(m.changePct).toFixed(2)}%
      </span>
    </button>
  );
}

// Real movers from the API only. No data, no chips.
export function FloatingMovers() {
  const { movers } = useMarket();
  const g = movers?.gainers[0];
  const l = movers?.losers[0];
  return (
    <>
      {g && <Chip m={g} label="Top gainer today" delay="0s" className="-bottom-5 left-2 lg:-left-10 lg:bottom-16" />}
      {l && <Chip m={l} label="Top loser today" delay="1.2s" className="-bottom-5 right-2 lg:-right-4 lg:-top-6 lg:bottom-auto" />}
    </>
  );
}