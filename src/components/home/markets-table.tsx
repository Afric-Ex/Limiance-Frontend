"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { mono, sans } from "./fonts";
import { fmtPct, fmtPrice, useCta, useMovers, type Pair } from "./landing-data";

const TABS = [["all", "All"], ["gainers", "Gainers"], ["losers", "Losers"]] as const;
type Tab = (typeof TABS)[number][0];

/** Brief color on the price cell when a refreshed price differs from the last one. */
function Price({ value }: { value: number }) {
  const prev = useRef(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  useEffect(() => {
    if (prev.current === value) return;
    setFlash(value > prev.current ? "up" : "down");
    prev.current = value;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <span className={`transition-colors duration-500 ${flash === "up" ? "text-[#25AB42]" : flash === "down" ? "text-[#F6465D]" : "text-white"}`}>
      {fmtPrice(value)}
    </span>
  );
}

function Row({ p, href }: { p: Pair; href: string }) {
  const up = p.changePct >= 0;
  const [base, quote] = p.symbol.split("/");
  return (
    <tr className="group border-t border-white/[0.06] transition-colors hover:bg-white/[0.03]">
      <td className="py-3.5 pl-4">
        <div className="flex items-center gap-3">
          <span className={`${mono.className} grid h-8 w-8 place-items-center rounded-full border border-white/10 text-[10px] text-[#A7AEBD]`}>{base.slice(0, 3)}</span>
          <span className="text-white">{base}<span className="text-[#8A91A0]">/{quote}</span></span>
        </div>
      </td>
      <td className={`${mono.className} py-3.5 text-right tabular-nums`}><Price value={p.price} /></td>
      <td className={`${mono.className} py-3.5 text-right tabular-nums ${up ? "text-[#25AB42]" : "text-[#F6465D]"}`}>
        <span aria-hidden>{up ? "\u25B2" : "\u25BC"}</span> {fmtPct(p.changePct)}
      </td>
      <td className={`${mono.className} hidden py-3.5 text-right tabular-nums text-[#8A91A0] sm:table-cell`}>{p.prev !== null ? fmtPrice(p.prev) : "\u2014"}</td>
      <td className="py-3.5 pr-4 text-right">
        <Link href={href} className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-[#E6E8EE] transition-colors group-hover:border-[#4D77F0] group-hover:text-white">Trade</Link>
      </td>
    </tr>
  );
}

export function MarketsTable() {
  const [tab, setTab] = useState<Tab>("all");
  const { data, isPending } = useMovers();
  const cta = useCta();
  const rows = (data ? data[tab] : []).slice(0, 10);

  return (
    <div className={`${sans.className} overflow-hidden rounded-lg border border-white/[0.08] bg-[#10131A]`}>
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3" role="tablist" aria-label="Market filter">
        <div className="flex gap-1">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${tab === id ? "bg-white/10 text-white" : "text-[#8A91A0] hover:text-white"}`}>{label}</button>
          ))}
        </div>
        <span className="hidden text-xs text-[#8A91A0] sm:block">Refreshes every 15 seconds</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-sm">
          <thead>
            <tr className="text-xs text-[#8A91A0]">
              <th className="py-3 pl-4 text-left font-normal">Pair</th>
              <th className="py-3 text-right font-normal">Last price</th>
              <th className="py-3 text-right font-normal">24h change</th>
              <th className="hidden py-3 text-right font-normal sm:table-cell">Price 24h ago</th>
              <th className="py-3 pr-4" />
            </tr>
          </thead>
          <tbody>
            {isPending && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-t border-white/[0.06]"><td colSpan={5} className="p-3"><div className="h-8 animate-pulse rounded bg-white/[0.04]" /></td></tr>
            ))}
            {rows.map((p) => <Row key={p.symbol} p={p} href={cta.trade.href} />)}
          </tbody>
        </table>
      </div>

      {!isPending && rows.length === 0 && (
        <p className="border-t border-white/[0.06] px-4 py-10 text-center text-sm text-[#8A91A0]">
          {data ? "No pairs in this view right now." : "Market data isn\u2019t available right now. Create an account to see every market."}
        </p>
      )}
    </div>
  );
}