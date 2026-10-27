"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { Popover, PopoverDropdown, PopoverTarget, TextInput } from "@mantine/core";
import { MdKeyboardArrowDown } from "react-icons/md";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { Search } from "@/src/components/icons/search";
import { Skeleton } from "@/src/components/shared/skeleton";
import { SidebarMenuButton } from "@/src/components/shared/sidebar-menu";
import { useTokenIconMap, useTokenNameMap } from "@/src/hooks/use-token-icons";
import type { useMarketFeed } from "@/src/hooks/use-market-feed";

type Feed = ReturnType<typeof useMarketFeed>;

interface SpotPairHeaderProps {
  selectedPair: string;
  feed: Feed;
  flashClass: string;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  pairSearch: string;
  onPairSearchChange: (value: string) => void;
  markets: Feed["markets"];
  onSelectPair: (base: string, quote: string) => void;
  className?: string;
}

// Quote assets that trade ~1:1 with USD, so "≈ price USD" is accurate for them.
const USD_PEGGED = new Set(["USDT", "USDC", "USD", "BUSD", "DAI", "FDUSD", "TUSD"]);

const toNum = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const fmt = (value: number | null, maxDigits = 2) =>
  value === null
    ? "—"
    : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: maxDigits });

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-white/40">{label}</span>
      <span className="text-xs font-semibold tabular-nums text-white/90">{children}</span>
    </div>
  );
}

/**
 * Desktop (>=1150px) pair bar for the spot trade page: coin icon + pair + coin
 * name, big last price with its USD value underneath, then 24H stats. Purely
 * presentational — all state lives in the page and arrives through props.
 */
export function SpotPairHeader({
  selectedPair,
  feed,
  flashClass,
  menuOpen,
  onMenuOpenChange,
  pairSearch,
  onPairSearchChange,
  markets,
  onSelectPair,
  className,
}: SpotPairHeaderProps) {
  const icons = useTokenIconMap();
  const names = useTokenNameMap();

  const [base = "", quote = ""] = selectedPair.split("/");
  const iconUrl = icons[base.toUpperCase()];
  const coinName = names[base.toUpperCase()];

  const price = toNum(feed.price);
  const pct = toNum(feed.changePercent24h);
  const high = toNum(feed.high24h);
  const low = toNum(feed.low24h);
  const volBase = toNum(feed.volume24h);
  const volQuote = volBase !== null && price !== null ? volBase * price : null;

  const isUp = (pct ?? 0) >= 0;
  const tone = isUp ? "text-success-6" : "text-error-1";
  const showUsd = price !== null && USD_PEGGED.has(quote.toUpperCase());

  return (
    <div className={clsx("hidden h-12 shrink-0 items-center justify-between bg-[#181a20] px-4 min-[1150px]:flex", className)}>
      <div className="flex items-center gap-6">
        <SidebarMenuButton />

        {/* Pair selector */}
        <Popover
          width={360}
          position="bottom-start"
          shadow="md"
          opened={menuOpen}
          onChange={onMenuOpenChange}
        >
          <PopoverTarget>
            <button
              aria-label="Change trading pair"
              onClick={() => onMenuOpenChange(!menuOpen)}
              className="-ml-2 flex items-center gap-2.5 rounded px-2 py-1 transition-colors hover:bg-white/5"
            >
              {iconUrl ? (
                <img src={iconUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/70">
                  {base.charAt(0)}
                </span>
              )}
              <span className="flex flex-col items-start leading-tight">
                <span className="flex items-center gap-1">
                  <span className="text-lg font-bold text-white">{selectedPair}</span>
                  <MdKeyboardArrowDown className="text-white/50" size={20} />
                </span>
                {coinName && <span className="text-[11px] text-white/40">{coinName}</span>}
              </span>
            </button>
          </PopoverTarget>
          <PopoverDropdown className="!bg-[#181a20] !border-white/[0.06] !p-0">
            <div className="flex flex-col">
              <div className="border-b border-white/[0.06] p-3">
                <TextInput
                  classNames={{
                    input:
                      "!h-8 !bg-white/5 placeholder:!text-white/30 !border-0 focus:!border focus:!border-primary !rounded text-xs",
                  }}
                  placeholder="Search pairs (BTC, ETH…)"
                  leftSection={<Search className="h-4 w-4" />}
                  value={pairSearch}
                  onChange={(e) => onPairSearchChange(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-[360px] overflow-auto py-1">
                {feed.marketsLoading ? (
                  <Skeleton variant="table-row" count={5} columns={2} className="px-2" />
                ) : markets.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/30">No pairs found</div>
                ) : (
                  markets.slice(0, 30).map((m) => (
                    <button
                      key={m.symbol}
                      onClick={() => onSelectPair(m.base, m.quote)}
                      className={clsx(
                        "flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-white/[0.04]",
                        selectedPair === `${m.base}/${m.quote}` && "bg-white/[0.03]"
                      )}
                    >
                      <div className="flex flex-col gap-0">
                        <span className="text-xs font-bold text-white/90">
                          {m.base}
                          <span className="text-white/40">/{m.quote}</span>
                        </span>
                        <span className="text-[10px] text-white/30">{m.symbol}</span>
                      </div>
                      <span
                        className={clsx(
                          "text-xs font-semibold",
                          m.percent_change >= 0 ? "text-success-2" : "text-error-1"
                        )}
                      >
                        {m.percent_change >= 0 ? "+" : ""}
                        {m.percent_change}%
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </PopoverDropdown>
        </Popover>

        {/* Last price + USD value */}
        <div className={clsx("flex flex-col gap-0.5 rounded px-2 transition-colors", flashClass)}>
          {price !== null ? (
            <span className={clsx("text-xl font-bold leading-tight tabular-nums", tone)}>
              {fmt(price)}
            </span>
          ) : (
            <Skeleton variant="text" width="80px" height="24px" />
          )}
          <span className="text-[11px] tabular-nums text-white/50">
            {showUsd ? `≈${fmt(price)} USD` : "\u00A0"}
          </span>
        </div>

        {/* 24H stats */}
        <div className="flex items-center gap-6">
          <Stat label="24H Change">
            <span className={tone}>
              {pct === null ? "—" : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
            </span>
          </Stat>
          <Stat label="24H High">{fmt(high)}</Stat>
          <Stat label="24H Low">{fmt(low)}</Stat>

          {/* Volumes sit behind the "···" menu, as on Bybit */}
          <Popover width={220} position="bottom-start" shadow="md">
            <PopoverTarget>
              <button
                aria-label="More 24H stats"
                className="flex h-6 w-6 items-center justify-center rounded text-white/50 transition-colors hover:bg-white/5 hover:text-white"
              >
                <IoEllipsisHorizontal size={16} />
              </button>
            </PopoverTarget>
            <PopoverDropdown className="!bg-[#181a20] !border-white/[0.06] !p-3">
              <div className="flex flex-col gap-3">
                <Stat label={`24H Volume (${base})`}>
                  {volBase === null ? "—" : volBase.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </Stat>
                <Stat label={`24H Volume (${quote})`}>
                  {volQuote === null ? "—" : volQuote.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </Stat>
              </div>
            </PopoverDropdown>
          </Popover>
        </div>
      </div>

      <span
        className={clsx(
          "flex items-center gap-1.5 text-xs font-semibold",
          feed.isConnected ? "text-success-6" : "text-white/40"
        )}
      >
        <span
          className={clsx(
            "h-2 w-2 rounded-full",
            feed.isConnected ? "animate-pulse-glow bg-success-6" : "bg-white/20"
          )}
        />
        {feed.isConnected ? "Live" : "Connecting"}
      </span>
    </div>
  );
}