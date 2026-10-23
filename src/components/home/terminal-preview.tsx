"use client";

import { useState } from "react";
import Image from "next/image";
import ProductShot from "@/public/hero-image.png";
import { PriceChart } from "./price-chart";
import { mono } from "./fonts";
import {
  DEFAULT_PAIR, INTERVALS, fmtPct, fmtPrice, useCandles, useMovers,
  type Candle, type Interval,
} from "./landing-data";

const when = (t: number) =>
  new Date(t * 1000).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/** The hero visual: the real market, live. Falls back to a labelled product screenshot if candles are unavailable. */
export function TerminalPreview() {
  const [symbol, setSymbol] = useState(DEFAULT_PAIR);
  const [tf, setTf] = useState<Interval>("1h");
  const [hover, setHover] = useState<Candle | null>(null);
  const movers = useMovers();
  const candles = useCandles(symbol, tf);

  const pairs = movers.data?.all ?? [];
  const symbols = Array.from(new Set([DEFAULT_PAIR, ...pairs.map((p) => p.symbol)])).slice(0, 5);
  const mv = pairs.find((p) => p.symbol === symbol);
  const last = candles.data?.[candles.data.length - 1];
  const shown = hover ?? last;
  const failed = candles.isError && !candles.data;
  const up = (mv?.changePct ?? 0) >= 0;

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#10131A] shadow-[0_30px_90px_-30px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-white/[0.08] px-2 py-2" role="tablist" aria-label="Trading pair">
        {symbols.map((s) => (
          <button
            key={s} role="tab" aria-selected={s === symbol}
            onClick={() => { setSymbol(s); setHover(null); }}
            className={`${mono.className} shrink-0 rounded-md px-3 py-1.5 text-[13px] transition-colors ${
              s === symbol ? "bg-white/10 text-white" : "text-[#8A91A0] hover:bg-white/5 hover:text-white"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_210px]">
        <div className="min-w-0 p-4">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <div className={`${mono.className} text-[28px] font-medium leading-none tabular-nums text-white`}>
                {shown ? fmtPrice(shown.close) : mv ? fmtPrice(mv.price) : "\u2014"}
              </div>
              <div className={`${mono.className} mt-2 text-[13px] tabular-nums ${mv ? (up ? "text-[#25AB42]" : "text-[#F6465D]") : "text-[#8A91A0]"}`}>
                {mv ? <><span aria-hidden>{up ? "\u25B2" : "\u25BC"}</span> {fmtPct(mv.changePct)} <span className="text-[#8A91A0]">24h</span></> : "24h change unavailable"}
              </div>
            </div>
            <div className="flex gap-1 rounded-md border border-white/10 p-0.5" role="tablist" aria-label="Interval">
              {INTERVALS.map((i) => (
                <button
                  key={i} role="tab" aria-selected={i === tf} onClick={() => setTf(i)}
                  className={`${mono.className} rounded px-2.5 py-1 text-xs transition-colors ${i === tf ? "bg-[#4168DD] text-white" : "text-[#8A91A0] hover:text-white"}`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {shown && !failed && (
            <div className={`${mono.className} mt-3 flex flex-wrap gap-x-4 text-[11px] tabular-nums text-[#8A91A0]`}>
              <span>{when(shown.time)}</span>
              <span>O {fmtPrice(shown.open)}</span><span>H {fmtPrice(shown.high)}</span>
              <span>L {fmtPrice(shown.low)}</span><span>C {fmtPrice(shown.close)}</span>
            </div>
          )}

          <div className="relative mt-3 h-[300px] sm:h-[340px]">
            {failed ? (
              <div className="flex h-full flex-col gap-2">
                <div className="relative flex-1 overflow-hidden rounded-md border border-white/[0.08]">
                  <Image src={ProductShot} alt="Limiance spot trading interface" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover object-left-top" />
                </div>
                <p className="text-xs text-[#8A91A0]">Product preview. The live chart appears here when market data is available.</p>
              </div>
            ) : candles.data ? (
              <PriceChart candles={candles.data} onHover={setHover} />
            ) : (
              <div className="h-full animate-pulse rounded-md bg-white/[0.04]" />
            )}
          </div>

          {candles.data && !failed && (
            <p className="mt-2 flex items-center gap-2 text-[11px] text-[#8A91A0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#25AB42]" aria-hidden />
              Live market data, refreshed every 30 seconds
            </p>
          )}
        </div>

        {pairs.length > 0 && (
          <div className="hidden border-l border-white/[0.08] lg:block">
            <p className="px-4 py-3 text-xs text-[#8A91A0]">Markets, 24h</p>
            <ul>
              {pairs.slice(0, 8).map((p) => (
                <li key={p.symbol}>
                  <button
                    onClick={() => { setSymbol(p.symbol); setHover(null); }}
                    className={`${mono.className} flex w-full items-center justify-between px-4 py-2 text-[12px] tabular-nums transition-colors hover:bg-white/5 ${p.symbol === symbol ? "bg-white/[0.06]" : ""}`}
                  >
                    <span className="text-white">{p.symbol.replace("/USDT", "")}</span>
                    <span className={p.changePct >= 0 ? "text-[#25AB42]" : "text-[#F6465D]"}>{fmtPct(p.changePct)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}