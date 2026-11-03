"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { modals } from "@mantine/modals";
import { BalanceCloak } from "@/src/components/shared/balance-cloak";
import { ConvertAsset } from "@/src/components/transactions/convert-asset";
import { LimTokenIcon } from "./lim-token-icon";
import { useLimWallet } from "@/src/hooks/use-lim-wallet";
import { LIM_SYMBOL, formatAmount } from "@/src/lib/lim";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { MdSwapHoriz, MdShoppingCart, MdArrowOutward, MdVisibilityOff } from "react-icons/md";
import { FaCircle } from "react-icons/fa6";

const SEGMENTS = [
  { key: "available", label: "Available", tone: "bg-primary", textTone: "text-primary" },
  { key: "inTrading", label: "In trading", tone: "bg-amber-400", textTone: "text-amber-400" },
  { key: "locked", label: "Locked", tone: "bg-white/30", textTone: "text-white/50" },
] as const;

const USD_PRICE_FIELDS = ["priceUSD","priceUsd","price_usd","usdPrice","usd_price","baseInQuoteUSD","base_in_quote_usd","latest_price","last_price","lastPrice","price","baseInQuote"] as const;

function priceFromRecord(record: Record<string, unknown>): number | null {
  for (const field of USD_PRICE_FIELDS) {
    const value = Number(record?.[field]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

function extractUsdPrice(payload: unknown): number | null {
  let body: unknown = payload;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!body || typeof body !== "object") return null;
    const found = priceFromRecord(body as Record<string, unknown>);
    if (found != null) return found;
    body = (body as Record<string, unknown>).data;
  }
  return null;
}

function extractMovers(payload: unknown): Record<string, unknown>[] {
  const unwrapped = (payload as { data?: unknown })?.data ?? payload;
  if (Array.isArray(unwrapped)) return unwrapped;
  const envelope = unwrapped as { gainers?: unknown; losers?: unknown };
  return [...(Array.isArray(envelope?.gainers) ? envelope.gainers : []),...(Array.isArray(envelope?.losers) ? envelope.losers : [])];
}

function baseSymbolOf(item: Record<string, unknown>): string {
  const raw = String(item?.symbol ?? item?.pair ?? item?.base ?? "").toUpperCase().replace(/[/_]/g, "-");
  const base = raw.split("-")[0] ?? "";
  return base.endsWith("USDT") && base.length > 4 ? base.slice(0, -4) : base;
}

function usdtPriceOf(items: Record<string, unknown>[], symbol: string): number | null {
  const item = items.find((entry) => baseSymbolOf(entry) === symbol);
  const price = Number(item?.last_price ?? item?.lastPrice ?? item?.price ?? item?.latest_price);
  return Number.isFinite(price) && price > 0 ? price : null;
}

export function LimBalanceCard() {
  const { available, inTrading, locked, logo, isLoading, priceUsd } = useLimWallet();

  const { data: limSpotPayload } = useQuery({ queryKey: tradingKeys.spotPrice("LIMUSDT"), queryFn: () => tradingService.spotPrice("LIMUSDT"), staleTime: 30_000, refetchInterval: 30_000, retry: false });
  const { data: btcSpotPayload } = useQuery({ queryKey: tradingKeys.spotPrice("BTCUSDT"), queryFn: () => tradingService.spotPrice("BTCUSDT"), staleTime: 30_000, refetchInterval: 30_000, retry: false });
  const { data: moversPayload } = useQuery({ queryKey: tradingKeys.gainersLosers, queryFn: () => tradingService.gainersLosers(100), staleTime: 30_000, refetchInterval: 30_000, retry: false });

  const movers = extractMovers(moversPayload);
  const limUsd = extractUsdPrice(limSpotPayload) ?? usdtPriceOf(movers, "LIM") ?? priceUsd ?? null;
  const btcUsd = extractUsdPrice(btcSpotPayload) ?? usdtPriceOf(movers, "BTC");
  const usdtValue = limUsd != null && available > 0 ? available * limUsd : null;
  const btcValue = usdtValue != null && btcUsd != null ? usdtValue / btcUsd : null;

  const total = available + inTrading + locked;
  const shareOf = (value: number) => total > 0 ? Math.round((value / total) * 100) : 0;
  const balances = { available, inTrading, locked };
  const visibleSegments = SEGMENTS.filter((s) => balances[s.key] > 0);

  const openConvert = () => modals.open({ ...DEFAULT_MODAL_SETTINGS, children: <ConvertAsset defaultFromAsset={LIM_SYMBOL} /> });

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:p-5">
      {/* Subtle glow behind balance */}
      <div className="pointer-events-none absolute right-0 top-0 h-48 w-64 rounded-full bg-primary/[0.06] blur-3xl" />

      <div className="relative flex flex-col gap-6">
        {/* Top row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LimTokenIcon logo={logo} size={48} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">LIM Balance</p>
              <p className="text-sm font-semibold text-white/80">Limiance Token</p>
            </div>
          </div>
          <Link href="/assets" className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/80">
            View assets <MdArrowOutward size={13} />
          </Link>
        </div>

        {/* Balance headline */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[42px] leading-none font-extrabold tracking-tight text-white tabular-nums max-[1150px]:text-3xl">
              {isLoading ? (
                <span className="skeleton inline-block h-10 w-44 rounded align-middle" />
              ) : (
                <BalanceCloak balance={available} />
              )}
            </span>
            <span className="text-xl font-bold text-white/40">{LIM_SYMBOL}</span>
          </div>
          {usdtValue != null && (
            <p className="flex items-center gap-2 text-sm text-white/50">
              <span>≈ ${formatAmount(usdtValue, 2)} USDT</span>
              {btcValue != null && (
                <>
                  <span className="text-white/20">·</span>
                  <span>≈ {formatAmount(btcValue, 8)} BTC</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Allocation bar */}
        {total > 0 && (
          <div className="flex flex-col gap-3">
            {/* Bar */}
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
              {visibleSegments.map((segment) => (
                <span
                  key={segment.key}
                  className={`${segment.tone} first:rounded-l-full last:rounded-r-full transition-all`}
                  style={{ width: `${shareOf(balances[segment.key])}%` }}
                />
              ))}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {visibleSegments.map((segment) => (
                <div key={segment.key} className="flex items-center gap-2 text-xs">
                  <FaCircle size={6} className={segment.textTone} />
                  <span className="text-white/45">{segment.label}</span>
                  <span className="font-bold tabular-nums text-white">
                    <BalanceCloak balance={balances[segment.key]} />
                  </span>
                  <span className="tabular-nums text-white/30">{shareOf(balances[segment.key])}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-white/[0.06]" />

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/assets/earn/buy"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(77,119,240,0.25)] transition-all hover:bg-primary/90 active:scale-95"
          >
            <MdShoppingCart size={16} />
            Buy {LIM_SYMBOL}
          </Link>
          <button
            type="button"
            onClick={openConvert}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-bold text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white active:scale-95"
          >
            <MdSwapHoriz size={16} />
            Convert asset
          </button>
        </div>
      </div>
    </section>
  );
}