"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { modals } from "@mantine/modals";
import { BalanceCloak } from "@/src/components/shared/balance-cloak";
import { Button } from "@/src/components/ui/button";
import { ConvertAsset } from "@/src/components/transactions/convert-asset";
import { LimTokenIcon } from "./lim-token-icon";
import { useLimWallet } from "@/src/hooks/use-lim-wallet";
import { LIM_SYMBOL, formatAmount } from "@/src/lib/lim";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";

/**
 * LIM holdings at a glance. Balances come from the shared portfolio feed, so
 * this card always agrees with the wallet and assets pages, and the app-wide
 * balance-cloak applies automatically. The available / in-trading / locked
 * split is integrated into the card as a labelled stat row under the
 * allocation bar, and the headline number carries a live USDT / BTC valuation
 * — primary source is the Markets spot-price API (LIMUSDT + BTCUSDT), with
 * the portfolio's own LIM price and the 24h movers feed as fallbacks, all
 * refreshed every 30 seconds.
 */

const SEGMENTS = [
  { key: "available", label: "Available", tone: "bg-primary" },
  { key: "inTrading", label: "In trading", tone: "bg-warning" },
  { key: "locked", label: "Locked", tone: "bg-white/25" },
] as const;

/** Spot-price payloads quote the USD price under one of these fields. */
const USD_PRICE_FIELDS = [
  "priceUSD",
  "priceUsd",
  "price_usd",
  "usdPrice",
  "usd_price",
  "baseInQuoteUSD",
  "base_in_quote_usd",
  "latest_price",
  "last_price",
  "lastPrice",
  "price",
  "baseInQuote",
] as const;

function priceFromRecord(record: Record<string, unknown>): number | null {
  for (const field of USD_PRICE_FIELDS) {
    const value = Number(record?.[field]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

/** USD price from a spot-price payload, descending nested `data` envelopes. */
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

/** Flatten the movers payload (array or gainers/losers envelope) into a list. */
function extractMovers(payload: unknown): Record<string, unknown>[] {
  const unwrapped = (payload as { data?: unknown })?.data ?? payload;
  if (Array.isArray(unwrapped)) return unwrapped;
  const envelope = unwrapped as { gainers?: unknown; losers?: unknown };
  return [
    ...(Array.isArray(envelope?.gainers) ? envelope.gainers : []),
    ...(Array.isArray(envelope?.losers) ? envelope.losers : []),
  ];
}

/** Base asset of a mover row across the symbols the backend uses. */
function baseSymbolOf(item: Record<string, unknown>): string {
  const raw = String(item?.symbol ?? item?.pair ?? item?.base ?? "")
    .toUpperCase()
    .replace(/[/_]/g, "-");
  const base = raw.split("-")[0] ?? "";
  return base.endsWith("USDT") && base.length > 4 ? base.slice(0, -4) : base;
}

/** USDT price for a base asset from the movers list, when quoted. */
function usdtPriceOf(
  items: Record<string, unknown>[],
  symbol: string
): number | null {
  const item = items.find((entry) => baseSymbolOf(entry) === symbol);
  const price = Number(
    item?.last_price ?? item?.lastPrice ?? item?.price ?? item?.latest_price
  );
  return Number.isFinite(price) && price > 0 ? price : null;
}

export function LimBalanceCard() {
  const { available, inTrading, locked, logo, isLoading, priceUsd } =
    useLimWallet();

  // Live Markets quotes for the two pairs the valuation needs, polled every
  // 30 seconds so the conversion tracks the market without a socket.
  const { data: limSpotPayload } = useQuery({
    queryKey: tradingKeys.spotPrice("LIMUSDT"),
    queryFn: () => tradingService.spotPrice("LIMUSDT"),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: false,
  });

  const { data: btcSpotPayload } = useQuery({
    queryKey: tradingKeys.spotPrice("BTCUSDT"),
    queryFn: () => tradingService.spotPrice("BTCUSDT"),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: false,
  });

  // 24h movers is only a fallback for when the spot quotes are unavailable.
  const { data: moversPayload } = useQuery({
    queryKey: tradingKeys.gainersLosers,
    queryFn: () => tradingService.gainersLosers(100),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: false,
  });

  const movers = extractMovers(moversPayload);
  const limUsd =
    extractUsdPrice(limSpotPayload) ??
    usdtPriceOf(movers, "LIM") ??
    priceUsd ??
    null;
  const btcUsd = extractUsdPrice(btcSpotPayload) ?? usdtPriceOf(movers, "BTC");
  const usdtValue =
    limUsd != null && available > 0 ? available * limUsd : null;
  const btcValue =
    usdtValue != null && btcUsd != null ? usdtValue / btcUsd : null;

  const total = available + inTrading + locked;
  const shareOf = (value: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0;

  const balances = { available, inTrading, locked };
  const visibleSegments = SEGMENTS.filter(
    (segment) => balances[segment.key] > 0
  );

  const openConvert = () => {
    modals.open({
      ...DEFAULT_MODAL_SETTINGS,
      children: <ConvertAsset defaultFromAsset={LIM_SYMBOL} />,
    });
  };

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:rounded-xl max-[1150px]:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <LimTokenIcon logo={logo} size={44} />
          <div className="min-w-0">
            <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
              LIM Balance
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Available to spend
            </p>
          </div>
        </div>
        <Link
          href="/assets"
          className="text-[var(--text-caption)] text-primary hover:text-primary-strong transition-colors shrink-0"
        >
          View assets
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] leading-none font-bold text-[var(--color-text-primary)] tabular-nums">
              {isLoading ? (
                <span className="skeleton inline-block h-8 w-40 rounded align-middle" />
              ) : (
                <BalanceCloak balance={available} />
              )}
            </span>
            <span className="text-[var(--text-subtitle)] font-semibold text-[var(--color-text-secondary)]">
              {LIM_SYMBOL}
            </span>
          </div>
          {usdtValue != null && (
            <p className="text-xs text-white/60">
              ≈ ${formatAmount(usdtValue, 6)} USDT
              {btcValue != null && (
                <>
                  <span className="mx-1.5 text-white/25">|</span>
                  ≈ {formatAmount(btcValue, 9)} BTC
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
            {visibleSegments.map((segment) => (
              <span
                key={segment.key}
                className={segment.tone}
                style={{ width: `${shareOf(balances[segment.key])}%` }}
              />
            ))}
          </div>

          {total > 0 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {visibleSegments.map((segment) => (
                <div key={segment.key} className="flex items-center gap-1.5 text-xs">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${segment.tone}`}
                    aria-hidden="true"
                  />
                  <span className="text-[var(--color-text-secondary)]">
                    {segment.label}
                  </span>
                  <span className="font-semibold tabular-nums text-[var(--color-text-primary)]">
                    <BalanceCloak balance={balances[segment.key]} />
                  </span>
                  <span className="tabular-nums text-white/40">
                    {shareOf(balances[segment.key])}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:max-w-[496px] sm:grid-cols-2">
        <Link href="/assets/earn/buy" className="w-full">
          <Button variant="primary" size="compact" className="!h-12 !px-6 w-full">
            Buy {LIM_SYMBOL}
          </Button>
        </Link>
        <Button
          variant="outline"
          size="compact"
          className="!h-12 !px-6 w-full"
          onClick={openConvert}
        >
          Convert an asset
        </Button>
      </div>
    </section>
  );
}
