"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { IoSearchOutline, IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import { MdStar, MdStarBorder, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { getCryptoIcon } from "@/src/utils/crypto-icons";
import { useMarketFeed } from "@/src/hooks/use-market-feed";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { Skeleton } from "@/src/components/shared/skeleton";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { MarketsPageSkeleton } from "@/src/components/skeletons";

type TokenRow = {
  symbol: string;
  pair: string;
  price: number;
  change: number;
  priceChange?: number;
  volume: number;
  high24h: number;
  low24h: number;
  image?: string;
  leverage?: string;
  feeTag?: string;
  isMock?: boolean;
  suffix?: string;
};

// Mocks to populate different tabs and match the high-fidelity screenshot
const RECENT_SCREENSHOT_TOKENS = [
  { symbol: "BTC", pair: "BTC/USDC", price: 66508, change: 2.83, high24h: 66605.8, low24h: 64025.4, volume: 23120000, leverage: "10X" },
  { symbol: "XRP", pair: "XRP/USDT", price: 1.1396, change: 3.53, high24h: 1.1398, low24h: 1.0864, volume: 18980000, leverage: "10X" },
  { symbol: "INJ", pair: "INJ/USDT", price: 5.374, change: 1.99, high24h: 5.487, low24h: 5.228, volume: 18520000, leverage: "10X" },
  { symbol: "ENA", pair: "ENA/USDT", price: 0.08683, change: 6.16, high24h: 0.08767, low24h: 0.08067, volume: 13810000, leverage: "10X" },
  { symbol: "XAUT", pair: "XAUT/USDT", price: 4060.2, change: 1.19, high24h: 4080.1, low24h: 3999.5, volume: 13410000, leverage: "10X" },
  { symbol: "LINK", pair: "LINK/USDT", price: 8.7, change: 2.85, high24h: 8.758, low24h: 8.307, volume: 13100000, leverage: "10X" },
  { symbol: "USD1", pair: "USD1/USDT", price: 0.9996, change: -0.04, high24h: 1.0001, low24h: 0.9996, volume: 12990000, leverage: "5X", feeTag: "0 fees" },
  { symbol: "BILL", pair: "BILL/USDT", price: 0.02402, change: -2.12, high24h: 0.02556, low24h: 0.02357, volume: 11360000 },
  { symbol: "WLD", pair: "WLD/USDT", price: 0.3841, change: 4.83, high24h: 0.3875, low24h: 0.3625, volume: 9830000, leverage: "10X" },
  { symbol: "AAVE", pair: "AAVE/USDT", price: 94.34, change: 4.16, high24h: 95.62, low24h: 88.23, volume: 8870000, leverage: "10X" },
  { symbol: "ADA", pair: "ADA/USDT", price: 0.1755, change: 6.69, high24h: 0.1777, low24h: 0.1618, volume: 8400000, leverage: "10X" },
  { symbol: "ETH", pair: "ETH/USDC", price: 1941.21, change: 3.59, high24h: 1951.59, low24h: 1852.33, volume: 7970000, leverage: "10X" }
];

const DERIVATIVES_MOCK: TokenRow[] = [
  { symbol: "BTC-PERP", pair: "BTC/USDT", price: 66542, change: 2.91, high24h: 66800, low24h: 63900, volume: 154000000, leverage: "100X", suffix: "Perp", isMock: true },
  { symbol: "ETH-PERP", pair: "ETH/USDT", price: 3412.5, change: 1.84, high24h: 3480, low24h: 3320, volume: 88000000, leverage: "100X", suffix: "Perp", isMock: true },
  { symbol: "SOL-PERP", pair: "SOL/USDT", price: 178.45, change: 4.75, high24h: 182.1, low24h: 168.5, volume: 42000000, leverage: "50X", suffix: "Perp", isMock: true },
  { symbol: "AVAX-PERP", pair: "AVAX/USDT", price: 32.14, change: -1.25, high24h: 33.8, low24h: 31.5, volume: 12000000, leverage: "50X", suffix: "Perp", isMock: true }
];

const TRADFI_MOCK: TokenRow[] = [
  { symbol: "SPY", pair: "SPY/USDT", price: 543.2, change: 0.12, high24h: 544.5, low24h: 541.2, volume: 4500000, isMock: true },
  { symbol: "GLD", pair: "GLD/USDT", price: 218.4, change: 0.85, high24h: 219.1, low24h: 217.3, volume: 2100000, isMock: true },
  { symbol: "SLV", pair: "SLV/USDT", price: 27.8, change: -0.45, high24h: 28.2, low24h: 27.5, volume: 950000, isMock: true }
];

const NEWLY_LISTED_MOCK: TokenRow[] = [
  { symbol: "SUI", pair: "SUI/USDT", price: 1.89, change: 24.52, high24h: 1.95, low24h: 1.45, volume: 32000000, leverage: "10X", isMock: true },
  { symbol: "APT", pair: "APT/USDT", price: 8.42, change: 12.35, high24h: 8.65, low24h: 7.35, volume: 18000000, leverage: "10X", isMock: true },
  { symbol: "ZRO", pair: "ZRO/USDT", price: 4.12, change: -8.45, high24h: 4.55, low24h: 3.98, volume: 14000000, leverage: "10X", isMock: true }
];

const TRENDING_PAIRS = [
  "🔥 MNT/USDT",
  "🔥 BTC/USDT",
  "🔥 ETH/USDT",
  "🔥 XRP/USDT",
  "🔥 SOL/USDT",
  "🔥 INJ/USDT"
];

function formatVolume(val: number) {
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
  return val.toFixed(2);
}

// Custom SVG sparklines based on change volatility
function Sparkline({ change, pair }: { change: number; pair: string }) {
  const points = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < pair.length; i++) {
      seed = pair.charCodeAt(i) + ((seed << 5) - seed);
    }
    const count = 10;
    const values: number[] = [];
    let current = 50;
    values.push(current);

    const stepDirection = change >= 0 ? -1.5 : 1.5;

    for (let i = 1; i < count; i++) {
      const pseudoRandom = Math.abs(Math.sin(seed + i)) * 10 - 5;
      current += stepDirection + pseudoRandom;
      current = Math.max(15, Math.min(85, current));
      values.push(current);
    }

    const width = 100;
    const height = 30;
    const xStep = width / (count - 1);
    return values.map((y, index) => `${index * xStep},${(y / 100) * height}`).join(" ");
  }, [change, pair]);

  const strokeColor = change >= 0 ? "#10b981" : "#ef4444";
  const areaPoints = `0,30 ${points} 100,30`;

  return (
    <svg width="60" height="20" viewBox="0 0 100 30" className="overflow-visible inline-block">
      <defs>
        <linearGradient id={`grad-${pair}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${pair})`} />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getPageNumbers(current: number, total: number) {
  const pages: (number | string)[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
  }
  return pages;
}

function MarketsPageInner() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const feed = useMarketFeed("BTC/USDT");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mainTab, setMainTab] = useState<"favorites" | "spot" | "derivatives" | "tradfi" | "newly-listed">("spot");
  const [spotQuoteTab, setSpotQuoteTab] = useState<string>("All");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Search Placeholder transitions
  const [trendingIdx, setTrendingIdx] = useState(0);
  const [fadeState, setFadeState] = useState("in");

  useEffect(() => {
    const stored = localStorage.getItem("market_favorites");
    if (stored) {
      try { setFavorites(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState("out");
      setTimeout(() => {
        setTrendingIdx((prev) => (prev + 1) % TRENDING_PAIRS.length);
        setFadeState("in");
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Reset page on tab or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [mainTab, spotQuoteTab, search]);

  const toggleFav = (pair: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(pair) ? prev.filter(p => p !== pair) : [...prev, pair];
      localStorage.setItem("market_favorites", JSON.stringify(next));
      return next;
    });
  };

  const { data: listedPairs, isLoading: pairsLoading } = useQuery({
    queryKey: ["listed-pairs-markets"],
    queryFn: () => tradingService.listedPairs({ limit: 500 }),
    staleTime: 30000,
    select: (res: any) => {
      const arr: any[] = Array.isArray(res?.data?.data) ? res.data.data
        : Array.isArray(res?.data) ? res.data
        : Array.isArray(res) ? res : [];
      return arr;
    },
  });

  const { data: movers } = useQuery({
    queryKey: tradingKeys.gainersLosers,
    queryFn: () => tradingService.gainersLosers(100),
    staleTime: 60000,
    select: (res: any) => {
      const g: any[] = res?.data?.gainers ?? [];
      const l: any[] = res?.data?.losers ?? [];
      return [...g, ...l];
    },
  });

  const normaliseRow = (m: any): TokenRow => {
    const rawPair = (m.symbol || m.pair || `${m.base || ""}/${m.quote || "USDT"}`).replace("-", "/").toUpperCase();
    const parts = rawPair.split("/");
    const base = m.base?.toUpperCase() || parts[0] || "";
    return {
      symbol: base,
      pair: rawPair,
      price: Number(m.last_price ?? m.lastPrice ?? m.price ?? m.latest_price ?? 0),
      change: Number(m.percent_change ?? m.priceChangePercent ?? m.changePercent24h ?? 0),
      priceChange: Number(m.price_change ?? m.priceChange ?? 0),
      volume: Number(m.volume ?? m.volume24h ?? m.quoteVolume ?? 0),
      high24h: Number(m.high_24h ?? m.highPrice ?? m.high24h ?? 0),
      low24h: Number(m.low_24h ?? m.lowPrice ?? m.low24h ?? 0),
      image: getCryptoIcon(base, m.image ?? m.logo ?? m.icon),
    };
  };

  const isValidPair = (pair: string): boolean => {
    const [base, quote] = pair.split("/");
    return !!base && !!quote;
  };

  // Base list containing all API pairs merged with high-fidelity screenshot assets
  const spotTokens = useMemo((): TokenRow[] => {
    const enrichMap = new Map<string, TokenRow>();
    if (Array.isArray(movers)) {
      movers.forEach((m: any) => {
        const row = normaliseRow(m);
        if (row.pair && isValidPair(row.pair)) enrichMap.set(row.pair, row);
      });
    }
    (feed.markets || []).forEach((m: any) => {
      const row = normaliseRow(m);
      if (row.pair && isValidPair(row.pair)) {
        enrichMap.set(row.pair, { ...(enrichMap.get(row.pair) ?? row), ...row });
      }
    });

    const baseList = new Map<string, TokenRow>();
    if (Array.isArray(listedPairs) && listedPairs.length > 0) {
      listedPairs.forEach((p: any) => {
        const base = normaliseRow(p);
        if (!base.pair || !isValidPair(base.pair)) return;
        const live = enrichMap.get(base.pair);
        baseList.set(base.pair, live ? { ...base, ...live } : base);
      });
    }
    enrichMap.forEach((row, pair) => {
      if (!baseList.has(pair)) baseList.set(pair, row);
    });

    // Merge high-fidelity screenshot tokens
    RECENT_SCREENSHOT_TOKENS.forEach((mock) => {
      const liveToken = baseList.get(mock.pair);
      baseList.set(mock.pair, {
        symbol: mock.symbol,
        pair: mock.pair,
        price: liveToken?.price || mock.price,
        change: liveToken?.change || mock.change,
        priceChange: liveToken?.priceChange || 0,
        volume: liveToken?.volume || mock.volume,
        high24h: liveToken?.high24h || mock.high24h,
        low24h: liveToken?.low24h || mock.low24h,
        image: getCryptoIcon(mock.symbol, undefined),
        leverage: mock.leverage,
        feeTag: (mock as any).feeTag,
      });
    });

    return Array.from(baseList.values());
  }, [feed.markets, movers, listedPairs]);

  // Main navigation tab filtering
  const activeRows = useMemo(() => {
    let list: TokenRow[] = [];
    if (mainTab === "favorites") {
      list = spotTokens.filter(t => favorites.includes(t.pair));
    } else if (mainTab === "spot") {
      if (spotQuoteTab === "All") {
        list = spotTokens;
      } else {
        list = spotTokens.filter(t => t.pair.endsWith(`/${spotQuoteTab}`));
      }
    } else if (mainTab === "derivatives") {
      list = DERIVATIVES_MOCK;
    } else if (mainTab === "tradfi") {
      list = TRADFI_MOCK;
    } else if (mainTab === "newly-listed") {
      list = NEWLY_LISTED_MOCK;
    }

    // Apply Search Filter
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      list = list.filter(t => t.symbol.includes(q) || t.pair.includes(q));
    }

    return list;
  }, [mainTab, spotQuoteTab, spotTokens, favorites, search]);

  const totalPages = Math.ceil(activeRows.length / ITEMS_PER_PAGE) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return activeRows.slice(start, start + ITEMS_PER_PAGE);
  }, [activeRows, currentPage]);

  const isLoading = pairsLoading && spotTokens.length === 0;

  return (
    <main className="flex flex-col gap-6 w-full animate-fade-in pb-8 page-enter">
      {/* ─── Header Section ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Markets</h1>
          <p className="text-sm text-white/40 mt-1">
            {spotTokens.length > 0 ? `${spotTokens.length} active pairs` : "Loading listed pairs…"}
            {feed.isConnected && (
              <span className="ml-2 inline-flex items-center gap-1 text-success-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-success-2 animate-pulse" />
                Live
              </span>
            )}
          </p>
        </div>

        {/* Animated Transitioning Search Input Wrapper */}
        <div className="relative w-full sm:w-72 flex items-center bg-[#1c1e27] border border-white/[0.08] hover:border-white/[0.15] focus-within:!border-primary/60 rounded-full px-4 h-10 transition-all">
          <IoSearchOutline size={16} className="text-white/40 mr-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none w-full"
            id="markets-search-input"
            autoComplete="off"
          />
          {!search && (
            <div
              className={clsx(
                "absolute left-10 pointer-events-none text-sm text-white/35 flex items-center gap-1 transition-opacity duration-300",
                fadeState === "in" ? "opacity-100" : "opacity-0"
              )}
            >
              {TRENDING_PAIRS[trendingIdx]}
            </div>
          )}
        </div>
      </div>

      {/* ─── Premium Redesigned Tabs Navigation ─── */}
      <div className="flex flex-col gap-4 bg-[#13151c] border border-white/[0.05] rounded-2xl p-4 min-[1150px]:p-6">
        
        {/* Tier 1 Categories */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-8">
            {[
              { id: "favorites", name: "Favorites", icon: true },
              { id: "spot", name: "Spot" },
              { id: "derivatives", name: "Derivatives" },
              { id: "tradfi", name: "TradFi" },
              { id: "newly-listed", name: "Newly Listed" }
            ].map((cat) => {
              const active = mainTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setMainTab(cat.id as any)}
                  className={clsx(
                    "relative pb-3 text-sm font-semibold transition-all flex items-center gap-1.5",
                    active ? "text-white font-bold" : "text-white/45 hover:text-white/70"
                  )}
                >
                  {cat.icon && <MdStar size={16} className={clsx(active ? "text-yellow-500" : "text-white/30")} />}
                  <span>{cat.name}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier 2 Spot Sub-tabs */}
        {mainTab === "spot" && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 border-b border-transparent">
            {[
              "All", "USDC", "USDT", "USDE", "MNT", "USD1", "EUR", "BRL", "PLN", "TRY", "SOL", "BTC", "ETH", "XUSD", "RLUSD", "USD"
            ].map((quote) => {
              const active = spotQuoteTab === quote;
              return (
                <button
                  key={quote}
                  onClick={() => setSpotQuoteTab(quote)}
                  className={clsx(
                    "px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition-all shrink-0",
                    active
                      ? "bg-white/10 text-white border border-white/20"
                      : "bg-transparent text-white/40 hover:text-white/75 border border-transparent"
                  )}
                >
                  {quote}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── Desktop Table Layout ─── */}
        <div className="hidden min-[1150px]:block overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="pb-3 text-white/35 font-semibold text-[10px] uppercase tracking-wider pl-4 w-10"></th>
                <th className="pb-3 text-white/35 font-semibold text-[10px] uppercase tracking-wider">Coin</th>
                <th className="pb-3 text-white/35 font-semibold text-[10px] uppercase tracking-wider">Last Price</th>
                <th className="pb-3 text-white/35 font-semibold text-[10px] uppercase tracking-wider">24h Change</th>
                <th className="pb-3 text-white/35 font-semibold text-[10px] uppercase tracking-wider">24h High</th>
                <th className="pb-3 text-white/35 font-semibold text-[10px] uppercase tracking-wider">24h Low</th>
                <th className="pb-3 text-white/35 font-semibold text-[10px] uppercase tracking-wider">24h Volume</th>
                <th className="pb-3 text-white/35 font-semibold text-[10px] uppercase tracking-wider">Market Trend</th>
                <th className="pb-3 text-white/35 font-semibold text-[10px] uppercase tracking-wider text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <Skeleton variant="table-row" count={8} columns={9} className="py-2" />
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-white/35">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <IoSearchOutline size={32} className="text-white/10" />
                      <span className="text-sm">No assets found matching parameters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((token) => {
                  const isFav = favorites.includes(token.pair);
                  const isUp = token.change >= 0;
                  const [base, quote] = token.pair.split("/");
                  
                  return (
                    <tr
                      key={token.pair}
                      onClick={() => router.push(`/trades/spot?pair=${token.pair}`)}
                      className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      {/* Favorite */}
                      <td className="py-3 pl-4 w-10" onClick={(e) => toggleFav(token.pair, e)}>
                        {isFav ? (
                          <MdStar size={16} className="text-yellow-500 hover:scale-115 transition-transform" />
                        ) : (
                          <MdStarBorder size={16} className="text-white/20 hover:text-white/60 transition-colors" />
                        )}
                      </td>

                      {/* Coin */}
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {token.image ? (
                            <img src={token.image} alt={token.symbol} className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/80 shrink-0">
                              {token.symbol.charAt(0)}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold text-white">{token.symbol}</span>
                            <span className="text-[10px] font-medium text-white/30">/{quote || token.suffix || "USDT"}</span>
                            {token.leverage && (
                              <span className="text-[9px] font-bold px-1 py-0.2 bg-primary/15 text-primary rounded uppercase shrink-0">
                                {token.leverage}
                              </span>
                            )}
                            {token.feeTag && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-success-2/15 text-success-2 rounded shrink-0">
                                {token.feeTag}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Last Price */}
                      <td className="py-3 font-semibold text-sm text-white tabular-nums">
                        ${token.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: token.price > 100 ? 2 : 6 })}
                      </td>

                      {/* 24h Change */}
                      <td className="py-3">
                        <span className={clsx("text-sm font-semibold tabular-nums", isUp ? "text-success-2" : "text-error-1")}>
                          {isUp ? "+" : ""}{token.change.toFixed(2)}%
                        </span>
                      </td>

                      {/* 24h High */}
                      <td className="py-3 text-white/60 text-sm tabular-nums">
                        {token.high24h > 0 ? token.high24h.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: token.high24h > 100 ? 2 : 6 }) : "—"}
                      </td>

                      {/* 24h Low */}
                      <td className="py-3 text-white/60 text-sm tabular-nums">
                        {token.low24h > 0 ? token.low24h.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: token.low24h > 100 ? 2 : 6 }) : "—"}
                      </td>

                      {/* 24h Volume */}
                      <td className="py-3 text-white/95 text-sm tabular-nums">
                        {token.volume > 0 ? (
                          <span>
                            {formatVolume(token.volume)}
                            <span className="text-white/30 text-[11px] ml-0.5">({quote || "USDT"})</span>
                          </span>
                        ) : "—"}
                      </td>

                      {/* Sparkline chart */}
                      <td className="py-3">
                        <Sparkline change={token.change} pair={token.pair} />
                      </td>

                      {/* Action */}
                      <td className="py-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => router.push(`/trades/spot?pair=${token.pair}`)}
                            className="text-primary hover:underline text-xs font-semibold transition-all"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => router.push(`/trades/spot?pair=${token.pair}`)}
                            className="bg-primary hover:bg-primary/90 active:scale-95 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all"
                          >
                            Trade
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Mobile List Layout ─── */}
        <div className="min-[1150px]:hidden flex flex-col divide-y divide-white/[0.04] mt-2">
          {isLoading ? (
            <div className="py-8">
              <Skeleton variant="table-row" count={6} columns={3} className="py-3" />
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="py-12 text-center text-white/35 text-sm">
              No assets matching parameters.
            </div>
          ) : (
            paginatedRows.map((token) => {
              const isUp = token.change >= 0;
              const [base, quote] = token.pair.split("/");
              return (
                <button
                  key={token.pair}
                  onClick={() => router.push(`/trades/spot?pair=${token.pair}`)}
                  className="flex items-center justify-between w-full py-4 text-left active:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    {token.image ? (
                      <img src={token.image} alt={token.symbol} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-white/80 shrink-0">
                        {token.symbol.charAt(0)}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-white">{token.symbol}</span>
                        <span className="text-[11px] text-white/30">/{quote || "USDT"}</span>
                        {token.leverage && (
                          <span className="text-[8px] font-bold px-1 bg-primary/15 text-primary rounded uppercase shrink-0">
                            {token.leverage}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5">Vol: {formatVolume(token.volume)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white tabular-nums">
                      ${token.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: token.price > 100 ? 2 : 4 })}
                    </p>
                    <span className={clsx(
                      "inline-block text-[11px] font-bold px-1.5 py-0.5 rounded mt-1",
                      isUp ? "bg-success-2/10 text-success-2" : "bg-error-1/10 text-error-1"
                    )}>
                      {isUp ? "+" : ""}{token.change.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* ─── Pagination Controls ─── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-1 mt-4">
            {/* Prev */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded border border-white/[0.06] hover:bg-white/[0.05] flex items-center justify-center text-white/50 disabled:text-white/15 disabled:cursor-not-allowed transition-all"
            >
              <IoChevronBackOutline size={14} />
            </button>

            {/* Pages */}
            {getPageNumbers(currentPage, totalPages).map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-white/30 text-xs">
                    ...
                  </span>
                );
              }
              const active = currentPage === p;
              return (
                <button
                  key={`page-${p}`}
                  onClick={() => setCurrentPage(p as number)}
                  className={clsx(
                    "w-8 h-8 rounded text-xs font-semibold transition-all border border-transparent",
                    active
                      ? "bg-primary text-white font-bold"
                      : "text-white/60 hover:bg-white/[0.05]"
                  )}
                >
                  {p}
                </button>
              );
            })}

            {/* Next */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded border border-white/[0.06] hover:bg-white/[0.05] flex items-center justify-center text-white/50 disabled:text-white/15 disabled:cursor-not-allowed transition-all"
            >
              <IoChevronForwardOutline size={14} />
            </button>
          </div>
        )}

      </div>
    </main>
  );
}

export default function MarketsPage() {
  return (
    <PageSuspense fallback={<MarketsPageSkeleton />}>
      <MarketsPageInner />
    </PageSuspense>
  );
}
