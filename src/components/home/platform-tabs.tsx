"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { mono, sans } from "./fonts";
import { useCta } from "./landing-data";

type Tab = { id: string; label: string; title: string; points: string[]; modes?: string[]; fields: [string, string][]; actions: [string, "buy" | "sell" | "brand"][] };

// Only capabilities that exist in the app (order types, margin tools, P2P flow, convert).
const TABS: Tab[] = [
  { id: "spot", label: "Spot", title: "Spot trading with the order types you expect", points: ["Market, limit and stop orders", "Live order book and recent trades", "Charts with drawing tools and indicators"],
    modes: ["Limit", "Market", "Stop"], fields: [["Price", "USDT"], ["Amount", "BTC"], ["Total", "USDT"]], actions: [["Buy", "buy"], ["Sell", "sell"]] },
  { id: "futures", label: "Futures", title: "Futures with leverage you set per position", points: ["Choose leverage for each position", "Set take profit and stop loss", "Close all or part of a position"],
    modes: ["Limit", "Market"], fields: [["Leverage", "x"], ["Size", "BTC"], ["Take profit", "USDT"], ["Stop loss", "USDT"]], actions: [["Long", "buy"], ["Short", "sell"]] },
  { id: "margin", label: "Margin", title: "Margin tools built into the order flow", points: ["Borrow and repay from the app", "Stop loss and take profit orders", "One-cancels-other (OCO) orders"],
    modes: ["Limit", "Market", "OCO"], fields: [["Price", "USDT"], ["Amount", "BTC"], ["Stop loss", "USDT"], ["Take profit", "USDT"]], actions: [["Buy", "buy"], ["Sell", "sell"]] },
  { id: "p2p", label: "P2P", title: "Peer-to-peer trades with a clear path to release", points: ["Trade directly with other users", "Chat with the counterparty inside the order", "Release with a one-time code, or open a dispute"],
    modes: ["Buy", "Sell"], fields: [["Currency", "NGN"], ["Payment method", ""], ["Amount", "USDT"]], actions: [["Continue", "brand"]] },
  { id: "convert", label: "Convert", title: "Swap one asset for another from your wallet", points: ["Pick the two assets and convert", "No order book to read"],
    fields: [["From", ""], ["To", ""]], actions: [["Convert", "brand"]] },
];

const tone = { buy: "bg-[#25AB42] text-white hover:brightness-110", sell: "bg-[#F6465D] text-white hover:brightness-110", brand: "bg-[#4168DD] text-white hover:bg-[#4D77F0]" };

export function PlatformTabs() {
  const [id, setId] = useState(TABS[0].id);
  const [mode, setMode] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const cta = useCta();
  const tab = TABS.find((t) => t.id === id)!;

  const select = (i: number) => {
    const n = (i + TABS.length) % TABS.length;
    setId(TABS[n].id); setMode(0); refs.current[n]?.focus();
  };

  return (
    <div className={sans.className}>
      <div role="tablist" aria-label="Markets and tools" className="flex gap-1 overflow-x-auto border-b border-white/[0.08]"
        onKeyDown={(e) => {
          const i = TABS.findIndex((t) => t.id === id);
          if (e.key === "ArrowRight") { e.preventDefault(); select(i + 1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); select(i - 1); }
          if (e.key === "Home") { e.preventDefault(); select(0); }
          if (e.key === "End") { e.preventDefault(); select(TABS.length - 1); }
        }}>
        {TABS.map((t, i) => (
          <button key={t.id} ref={(el) => { refs.current[i] = el; }} role="tab" id={`tab-${t.id}`} aria-selected={t.id === id} aria-controls="platform-panel" tabIndex={t.id === id ? 0 : -1}
            onClick={() => select(i)}
            className={`-mb-px shrink-0 border-b-2 px-5 py-3 text-[15px] transition-colors ${t.id === id ? "border-[#4D77F0] text-white" : "border-transparent text-[#8A91A0] hover:text-white"}`}>{t.label}</button>
        ))}
      </div>

      <div id="platform-panel" role="tabpanel" aria-labelledby={`tab-${id}`} className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 pt-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex min-w-0 flex-col gap-6">
          <h3 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-white">{tab.title}</h3>
          <ul className="flex flex-col gap-3">
            {tab.points.map((p) => (
              <li key={p} className="flex gap-3 text-[16px] text-[#C3C8D4]"><span className="mt-2.5 h-1 w-3 shrink-0 bg-[#4D77F0]" aria-hidden />{p}</li>
            ))}
          </ul>
          <Link href={cta.trade.href} className="w-fit text-[15px] font-medium text-[#8FAAFF] underline-offset-4 hover:underline">
            {cta.primary.label === "Create account" ? `Start with ${tab.label}` : `Open ${tab.label}`} {"\u2192"}
          </Link>
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-[#10131A] p-5">
          <div className="mb-4 flex items-center justify-between">
            {tab.modes ? (
              <div className="flex gap-1 rounded-md border border-white/10 p-0.5">
                {tab.modes.map((m, i) => (
                  <button key={m} onClick={() => setMode(i)} aria-pressed={mode === i}
                    className={`rounded px-3 py-1 text-xs transition-colors ${mode === i ? "bg-white/10 text-white" : "text-[#8A91A0] hover:text-white"}`}>{m}</button>
                ))}
              </div>
            ) : <span className="text-xs text-[#8A91A0]">Wallet swap</span>}
            <span className="text-[11px] text-[#8A91A0]">Interface preview</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {tab.fields.map(([label, unit]) => (
              <div key={label} className="flex h-11 items-center justify-between rounded-md border border-white/10 bg-black/20 px-3">
                <span className="text-sm text-[#8A91A0]">{label}</span>
                <span className={`${mono.className} text-xs text-[#8A91A0]`}>{unit || "\u2014"}</span>
              </div>
            ))}
          </div>
          <div className={`mt-4 grid gap-2.5 ${tab.actions.length > 1 ? "grid-cols-2" : ""}`}>
            {tab.actions.map(([label, kind]) => (
              <Link key={label} href={cta.trade.href} className={`rounded-md py-3 text-center text-sm font-medium transition ${tone[kind]}`}>{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}