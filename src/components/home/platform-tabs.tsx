"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { mono, sans } from "./fonts";
import { useCta } from "./landing-data";

type Tab = { id: string; labelKey: string; titleKey: string; pointKeys: string[]; modes?: string[]; fieldKeys: [string, string][]; actionKeys: [string, "buy" | "sell" | "brand"][] };

// Only capabilities that exist in the app (order types, margin tools, P2P flow, convert).
const TABS: Tab[] = [
  { id: "spot", labelKey: "tabSpot", titleKey: "spotTitle", pointKeys: ["spotPoint1", "spotPoint2", "spotPoint3"],
    modes: ["labelLimit", "labelMarket", "labelStop"], fieldKeys: [["labelPrice", "USDT"], ["labelAmount", "BTC"], ["labelTotal", "USDT"]], actionKeys: [["labelBuy", "buy"], ["labelSell", "sell"]] },
  { id: "futures", labelKey: "tabFutures", titleKey: "futuresTitle", pointKeys: ["futuresPoint1", "futuresPoint2", "futuresPoint3"],
    modes: ["labelLimit", "labelMarket"], fieldKeys: [["labelLeverage", "x"], ["labelSize", "BTC"], ["labelTakeProfit", "USDT"], ["labelStopLoss", "USDT"]], actionKeys: [["labelLong", "buy"], ["labelShort", "sell"]] },
  { id: "margin", labelKey: "tabMargin", titleKey: "marginTitle", pointKeys: ["marginPoint1", "marginPoint2", "marginPoint3"],
    modes: ["labelLimit", "labelMarket", "labelOco"], fieldKeys: [["labelPrice", "USDT"], ["labelAmount", "BTC"], ["labelStopLoss", "USDT"], ["labelTakeProfit", "USDT"]], actionKeys: [["labelBuy", "buy"], ["labelSell", "sell"]] },
  { id: "p2p", labelKey: "tabP2P", titleKey: "p2pTitle", pointKeys: ["p2pPoint1", "p2pPoint2", "p2pPoint3"],
    modes: ["labelBuy", "labelSell"], fieldKeys: [["labelCurrency", "NGN"], ["labelPaymentMethod", ""], ["labelAmount", "USDT"]], actionKeys: [["labelContinue", "brand"]] },
  { id: "convert", labelKey: "tabConvert", titleKey: "convertTitle", pointKeys: ["convertPoint1", "convertPoint2"],
    fieldKeys: [["labelFrom", ""], ["labelTo", ""]], actionKeys: [["labelConvert", "brand"]] },
];

const tone = { buy: "bg-[#25AB42] text-white hover:brightness-110", sell: "bg-[#F6465D] text-white hover:brightness-110", brand: "bg-[#4168DD] text-white hover:bg-[#4D77F0]" };

export function PlatformTabs() {
  const t = useTranslations("Landing");
  const [id, setId] = useState(TABS[0].id);
  const [mode, setMode] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const cta = useCta();
  const tab = TABS.find((item) => item.id === id)!;

  const select = (i: number) => {
    const n = (i + TABS.length) % TABS.length;
    setId(TABS[n].id); setMode(0); refs.current[n]?.focus();
  };

  return (
    <div className={sans.className}>
      <div role="tablist" aria-label={t("platformHeading")} className="flex gap-1 overflow-x-auto border-b border-white/[0.08]"
        onKeyDown={(e) => {
          const i = TABS.findIndex((item) => item.id === id);
          if (e.key === "ArrowRight") { e.preventDefault(); select(i + 1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); select(i - 1); }
          if (e.key === "Home") { e.preventDefault(); select(0); }
          if (e.key === "End") { e.preventDefault(); select(TABS.length - 1); }
        }}>
        {TABS.map((item, i) => (
          <button key={item.id} ref={(el) => { refs.current[i] = el; }} role="tab" id={`tab-${item.id}`} aria-selected={item.id === id} aria-controls="platform-panel" tabIndex={item.id === id ? 0 : -1}
            onClick={() => select(i)}
            className={`-mb-px shrink-0 border-b-2 px-5 py-3 text-body transition-colors ${item.id === id ? "border-[#4D77F0] text-white" : "border-transparent text-[#8A91A0] hover:text-white"}`}>{t(item.labelKey as "tabSpot")}</button>
        ))}
      </div>

      <div id="platform-panel" role="tabpanel" aria-labelledby={`tab-${id}`} className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 pt-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex min-w-0 flex-col gap-6">
          <h3 className="text-3xl font-semibold leading-tight tracking-[-0.02em] text-white">{t(tab.titleKey as "spotTitle")}</h3>
          <ul className="flex flex-col gap-3">
            {tab.pointKeys.map((p) => (
              <li key={p} className="flex gap-3 text-base text-[#C3C8D4]"><span className="mt-2.5 h-1 w-3 shrink-0 bg-[#4D77F0]" aria-hidden />{t(p as "spotPoint1")}</li>
            ))}
          </ul>
          <Link href={cta.trade.href} className="w-fit text-body font-medium text-[#8FAAFF] underline-offset-4 hover:underline">
            {cta.primary.label === "Create account" ? t("startWith", { market: t(tab.labelKey as "tabSpot") }) : t("openMarket", { market: t(tab.labelKey as "tabSpot") })} {"\u2192"}
          </Link>
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-[#10131A] p-5">
          <div className="mb-4 flex items-center justify-between">
            {tab.modes ? (
              <div className="flex gap-1 rounded-md border border-white/10 p-0.5">
                {tab.modes.map((m, i) => (
                  <button key={m} onClick={() => setMode(i)} aria-pressed={mode === i}
                    className={`rounded px-3 py-1 text-xs transition-colors ${mode === i ? "bg-white/10 text-white" : "text-[#8A91A0] hover:text-white"}`}>{t(m as "labelLimit")}</button>
                ))}
              </div>
            ) : <span className="text-xs text-[#8A91A0]">{t("walletSwap")}</span>}
            <span className="text-micro text-[#8A91A0]">{t("interfacePreview")}</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {tab.fieldKeys.map(([label, unit]) => (
              <div key={label} className="flex h-11 items-center justify-between rounded-md border border-white/10 bg-black/20 px-3">
                <span className="text-sm text-[#8A91A0]">{t(label as "labelPrice")}</span>
                <span className={`${mono.className} text-xs text-[#8A91A0]`}>{unit || "\u2014"}</span>
              </div>
            ))}
          </div>
          <div className={`mt-4 grid gap-2.5 ${tab.actionKeys.length > 1 ? "grid-cols-2" : ""}`}>
            {tab.actionKeys.map(([label, kind]) => (
              <Link key={label} href={cta.trade.href} className={`rounded-md py-3 text-center text-sm font-medium transition ${tone[kind]}`}>{t(label as "labelBuy")}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
