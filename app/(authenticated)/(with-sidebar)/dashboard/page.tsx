"use client";

import { UserAvatar } from "@/src/components/shared/user-avatar";
import { VerifyStatusTag } from "@/src/components/shared/verify-status-tag";
import { MdKeyboardArrowRight, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import { ArrowTo } from "@/src/components/icons/arrow-to";
import { Basket } from "@/src/components/icons/basket";
import { Coins as CoinsIcon } from "@/src/components/icons/coins";
import {
  Table,
  TableTd,
  TableTh,
  TableTr,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@mantine/core";
import classes from "@/src/styles/dashboard.module.css";
import Link from "next/link";
import { useUserStore } from "@/src/stores/user-store";
import { Copy } from "@/src/components/shared/copy";
import { getCryptoIcon } from "@/src/utils/crypto-icons";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { userKeys, userService } from "@/src/services/user";
import { useQuery } from "@tanstack/react-query";
import { useMarketFeed } from "@/src/hooks/use-market-feed";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { useAssets } from "@/src/hooks/use-assets";
import { modals } from "@mantine/modals";
import { ConvertAsset } from "@/src/components/transactions/convert-asset";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import clsx from "clsx";
import { useState, useEffect, useMemo, useCallback } from "react";
import { WalletCard } from "@/src/components/assets/wallet-card";
import { Skeleton } from "@/src/components/shared/skeleton";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { DashboardSkeleton } from "@/src/components/skeletons/with-sidebar";
import { KickstartJourney } from "@/src/components/dashboard/kickstart-journey";
import { isKycApproved } from "@/src/lib/normalize-kyc-status";
import { DepositAlertProvider } from "@/src/components/shared/deposit-alert-provider";
import { useTranslations } from "next-intl";

const depositChannels = [
  {
    nameKey: "buyCryptoName",
    channelKey: "localCurrencyPayment",
    color: "var(--primary)",
    icon: Basket,
    link: "/transactions/fiat-deposit",
  },
  {
    nameKey: "deposit",
    channelKey: "depositCryptoOrFiat",
    color: "var(--yellow-1)",
    icon: CoinsIcon,
    modal: true,
  },
];

function formatVolume(val: number) {
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
  return val.toFixed(2);
}

function PriceCell({ value, change }: { value: number; change: number }) {
  const numValue = Number(value) || 0;
  return (
    <span className={clsx("text-sm max-[768px]:text-base font-semibold tabular-nums", change >= 0 ? "text-success-2 max-[768px]:text-white/90" : "text-error-1 max-[768px]:text-white/90")}>
      ${numValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: numValue > 100 ? 2 : 6 })}
    </span>
  );
}

function ChangeCell({ value, mobile }: { value: number; mobile?: boolean }) {
  const numValue = Number(value) || 0;
  const isUp = numValue >= 0;
  return (
    <span className={clsx(
      "font-semibold px-2 py-0.5 rounded inline-flex items-center justify-center gap-1 min-w-[72px]",
      isUp ? "bg-success-2/10 text-success-2" : "bg-error-1/10 text-error-1",
      mobile ? "text-2xs min-w-[60px] px-1.5 min-[769px]:hidden" : "text-sm max-[768px]:hidden"
    )}>
      {!mobile && (isUp ? <MdTrendingUp size={14} /> : <MdTrendingDown size={14} />)}
      {isUp ? "+" : ""}{numValue.toFixed(2)}%
    </span>
  );
}

// ── Market feed normalisation ─────────────────────────────────────────────
// Missing fields stay `undefined` (never 0) so a partial WS item can't wipe the
// real value that the REST movers already supplied.
const toNum = (v: any): number | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const pickNum = (m: any, keys: string[]): number | undefined => {
  for (const key of keys) {
    const n = toNum(m?.[key]);
    if (n !== undefined) return n;
  }
  return undefined;
};
const normalizePair = (raw: any): string => String(raw ?? "").replace(/[-_]/g, "/").toUpperCase();
const pairKeyOf = (pair: string): string => pair.replace(/[/_-]/g, "");
const NEWLY_LISTED_RE = /(newly[\s-]?listed|new listed|newcoin|^new$)/;

interface MarketToken {
  pair: string;
  symbol: string;
  price?: number;
  changePercent24h?: number;
  /** 24h traded value in quote currency (USDT/USDC). Quote volume if the feed has it, else base volume x price. */
  volumeUsd?: number;
  tradeCount?: number;
  category?: string;
  listedAt?: number;
  image?: string;
}

const normalizeMarketItem = (m: any): MarketToken => {
  const pair = normalizePair(m.symbol ?? m.pair ?? `${m.base ?? ""}/${m.quote ?? "USDT"}`);
  const base = String(m.base ?? pair.split("/")[0] ?? "").toUpperCase();
  const price = pickNum(m, ["last_price", "lastPrice", "price", "latest_price"]);
  let changePercent24h = pickNum(m, [
    "percent_change", "priceChangePercent", "changePercent24h", "price_change_percent",
    "change_percent", "percentChange", "change24h",
  ]);
  if (changePercent24h === undefined) {
    // Derive from an absolute change when only that is supplied.
    const absChange = pickNum(m, ["price_change", "priceChange"]);
    if (absChange !== undefined && price !== undefined && price - absChange !== 0) {
      changePercent24h = (absChange / (price - absChange)) * 100;
    }
  }
  const quoteVolume = pickNum(m, ["quote_volume", "quoteVolume", "turnover", "volume_usd", "volumeUsd"]);
  const baseVolume = pickNum(m, ["volume", "volume24h", "base_volume", "baseVolume"]);
  const volumeUsd = quoteVolume ?? (baseVolume !== undefined && price !== undefined ? baseVolume * price : undefined);
  const listedRaw = m.listed_at ?? m.listedAt ?? m.listing_date ?? m.created_at ?? m.createdAt;
  const listedAt = listedRaw !== undefined && listedRaw !== null ? new Date(listedRaw).getTime() : NaN;
  return {
    pair,
    symbol: base,
    price,
    changePercent24h,
    volumeUsd,
    tradeCount: pickNum(m, ["count", "trade_count", "trades", "tradeCount", "number_of_trades"]),
    category: m.category !== undefined ? String(m.category) : undefined,
    listedAt: Number.isFinite(listedAt) ? listedAt : undefined,
    image: m.image ?? m.logo ?? m.icon,
  };
};

/** Copy only the fields `over` actually has, so gaps never overwrite real data. */
const mergeDefined = <T extends Record<string, any>>(base: T | undefined, over: T): T => {
  const out: Record<string, any> = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(over)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
};

const marketTabs = [
  { value: "Holding", labelKey: "tabHolding" },
  { value: "Hot", labelKey: "tabHot" },
  { value: "New listing", labelKey: "tabNewListing" },
  { value: "Favorite", labelKey: "tabFavorite" },
  { value: "Top Gainers", labelKey: "tabTopGainers" },
  { value: "24h Volume", labelKey: "tabVolume24h" },
];

function DashboardInner() {
  const t = useTranslations("Dashboard");
  const user = useUserStore((state) => state.user);
  const userHydrated = useUserStore((state) => state.hydrated);

  const [activeMarketTab, setActiveMarketTab] = useState("Holding");
  const { handleOpenDepositModal } = useAssets();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // The per-coin stream powers the "Holding" tab; the Total Assets card uses
  // the overall USD/BTC totals from get_portfolio_balance.
  const { coins: wsPortfolio } = usePortfolioWs({ coins: true });

  const { data: kycStatus, isLoading: isKycStatusLoading, refetch: refetchKycStatus } = useQuery({
    queryKey: userKeys.kycStatus,
    queryFn: () => userService.getKycStatus(),
    select: (res) => res?.data?.status,
    // Shares this key with the sidebar's profile card, so the two dedupe into
    // one request. Manual refetch still works after the TTL.
    staleTime: 5 * 60_000,
  });

  const isKycComplete = Boolean(user?.isIDverified || isKycApproved(kycStatus));
  const canShowKickstart = userHydrated && !isKycStatusLoading && !isKycComplete;

  const feed = useMarketFeed("BTC/USDT");

  // Memoized: the market feed ticks frequently — rebuilding these lists on
  // every unrelated parent render would redo all mapping/filtering each time.
  const marketTokens = useMemo(
    () => (feed.markets || []).map((m: any) => normalizeMarketItem(m)),
    [feed.markets]
  );

  const { data: movers } = useQuery({
    queryKey: tradingKeys.gainersLosers,
    queryFn: () => tradingService.gainersLosers(10),
    staleTime: 60000,
    select: (res: any) => res.data,
  });

  // Normalize REST movers into the same shape as WS marketTokens
  const moverTokens = useMemo(() => {
    const moversArray = movers ? [...(movers.gainers || []), ...(movers.losers || [])] : [];
    return moversArray.map((m: any) => {
      const token = normalizeMarketItem({ ...m, pair: m.pair ?? m.symbol });
      const image = m.image ?? m.logo ?? m.icon ?? getCryptoIcon(token.symbol);
      return { ...token, image };
    });
  }, [movers]);

  // Combine WS market feed (subscribed pairs) and REST movers for a complete market list
  const displayTokens = useMemo(() => {
    // Keyed by PAIR (not base symbol) so BTC/USDT and BTC/ETH can't overwrite each other.
    const allTokensMap = new Map<string, MarketToken>();
    moverTokens.forEach((t: MarketToken) => allTokensMap.set(t.pair, t));
    marketTokens.forEach((t: MarketToken) => {
      const existing = allTokensMap.get(t.pair);
      const merged = mergeDefined<MarketToken>(existing, t);
      merged.image = existing?.image || t.image || getCryptoIcon(t.symbol);
      allTokensMap.set(t.pair, merged);
    });

    // Hydrate images from portfolio if missing
    if (wsPortfolio && wsPortfolio.length > 0) {
      const imageBySymbol = new Map<string, string>();
      wsPortfolio.forEach((p: any) => {
        const sym = (p.symbol || "").toUpperCase();
        if (sym && p.image) imageBySymbol.set(sym, p.image);
      });
      allTokensMap.forEach((token) => {
        const img = imageBySymbol.get(token.symbol);
        if (img) token.image = img;
      });
    }

    return Array.from(allTokensMap.values())
      .filter((t) => {
        // Filter out garbage pairs the backend might send
        const validQuotes = ["USDT", "USDC", "BTC", "ETH"];
        const [base, quote] = t.pair.split("/");
        if (!quote) return false;
        if (!validQuotes.includes(quote)) return false;
        if ((base === "USDT" && quote === "USDC") || (base === "USDC" && quote === "USDT")) return true;
        if (validQuotes.includes(base) && quote !== "USDT") return false;
        return true;
      })
      .map((t) => ({
        ...t,
        // Render-safe defaults, applied only after merging.
        price: t.price ?? 0,
        changePercent24h: t.changePercent24h ?? 0,
        volumeUsd: t.volumeUsd ?? 0,
      }));
  }, [marketTokens, moverTokens, wsPortfolio]);

  // Ranked tabs compare like with like: USDT/USDC pairs only (BTC- or ETH-quoted
  // volumes are in a different unit), one row per coin, preferring USDT.
  const rankableTokens = useMemo(() => {
    const byBase = new Map<string, (typeof displayTokens)[number]>();
    displayTokens.forEach((t) => {
      const quote = t.pair.split("/")[1];
      if (quote !== "USDT" && quote !== "USDC") return;
      const current = byBase.get(t.symbol);
      if (!current || (quote === "USDT" && current.pair.split("/")[1] !== "USDT")) byBase.set(t.symbol, t);
    });
    return Array.from(byBase.values());
  }, [displayTokens]);

  const favoritesQuery = useQuery({
    queryKey: ["trading-favorites"],
    queryFn: () => tradingService.getFavorites(),
    staleTime: 30_000,
  });
  const favoriteKeys = useMemo(() => {
    const response: any = favoritesQuery.data;
    const rows = Array.isArray(response) ? response
      : Array.isArray(response?.symbols) ? response.symbols
      : Array.isArray(response?.data) ? response.data
      : Array.isArray(response?.data?.symbols) ? response.data.symbols
      : Array.isArray(response?.data?.favorites) ? response.data.favorites
      : Array.isArray(response?.data?.items) ? response.data.items
      : Array.isArray(response?.favorites) ? response.favorites
      : [];
    return new Set<string>(
      rows
        .map((item: any) => pairKeyOf(normalizePair(typeof item === "string" ? item : item?.symbol ?? item?.pair ?? item?.market)))
        .filter(Boolean)
    );
  }, [favoritesQuery.data]);

  const getRepresentativeHoldingTokens = useCallback(() => {
    const portfolio = wsPortfolio;
    if (!portfolio || portfolio.length === 0) return [];

    return portfolio
      .filter((item: any) => {
        const totalBal =
          parseFloat(item.spotBalance || "0") +
          parseFloat(item.fundingBalance || "0") +
          parseFloat(item.futuresBalance || "0") +
          parseFloat(item.marginBalance || "0");
        return totalBal > 0;
      })
      .map((item: any) => {
        const sym = (item.symbol || "").toUpperCase();
        // Try to find a market price from the live WS feed
        const marketMatch = displayTokens.find(
          (t: any) =>
            (t.symbol || "").toUpperCase() === sym &&
            (t.pair || "").toUpperCase().endsWith("/USDT")
        ) || displayTokens.find(
          (t: any) => (t.symbol || "").toUpperCase() === sym
        );

        const price = marketMatch
          ? Number(marketMatch.price)
          : parseFloat(item.currencyPrice || item.usdPrice || "1");

        const changePercent24h = marketMatch
          ? Number(marketMatch.changePercent24h)
          : 0;

        const totalBalance =
          parseFloat(item.spotBalance || "0") +
          parseFloat(item.fundingBalance || "0");

        return {
          pair: marketMatch?.pair ?? `${sym}/USDT`,
          symbol: sym,
          price,
          changePercent24h,
          volumeUsd: marketMatch?.volumeUsd ?? 0,
          balance: totalBalance,
          usdValue: totalBalance * price,
          image: item.image || item.logo || item.icon || marketMatch?.image || getCryptoIcon(sym),
        };
      })
      .sort((a: any, b: any) => b.usdValue - a.usdValue); // Sort by USD value
  }, [wsPortfolio, displayTokens]);

  const filteredTokens = useMemo(() => {
    switch (activeMarketTab) {
      case "Holding":
        return getRepresentativeHoldingTokens();

      case "Top Gainers":
        // Only coins that are actually up, biggest rise first.
        return [...rankableTokens]
          .filter((t) => t.changePercent24h > 0)
          .sort((a, b) => b.changePercent24h - a.changePercent24h)
          .slice(0, 10);

      case "24h Volume":
        return [...rankableTokens]
          .filter((t) => t.volumeUsd > 0)
          .sort((a, b) => b.volumeUsd - a.volumeUsd)
          .slice(0, 10);

      case "Hot": {
        // Most traded: by number of trades when the feed provides it, else by traded value.
        const hasTradeCounts = rankableTokens.some((t) => (t.tradeCount ?? 0) > 0);
        return [...rankableTokens]
          .filter((t) => t.volumeUsd > 0)
          .sort((a, b) =>
            hasTradeCounts
              ? (b.tradeCount ?? 0) - (a.tradeCount ?? 0) || b.volumeUsd - a.volumeUsd
              : b.volumeUsd - a.volumeUsd
          )
          .slice(0, 10);
      }

      case "New listing":
        // Same rule as the Markets page: the feed's `category` marks newly listed pairs.
        // Newest first when a listing date is available. No match means an empty list, not a guess.
        return displayTokens
          .filter((t) => NEWLY_LISTED_RE.test(String(t.category ?? "").toLowerCase().trim()))
          .sort((a, b) => (b.listedAt ?? 0) - (a.listedAt ?? 0) || b.volumeUsd - a.volumeUsd)
          .slice(0, 10);

      case "Favorite":
        return displayTokens
          .filter((t) => favoriteKeys.has(pairKeyOf(t.pair)))
          .sort((a, b) => b.volumeUsd - a.volumeUsd);

      default:
        return [];
    }
  }, [activeMarketTab, displayTokens, rankableTokens, favoriteKeys, getRepresentativeHoldingTokens]);

  const openConvertModal = (symbol: string) => {
    modals.open({
      children: <ConvertAsset defaultFromAsset={symbol} />,
      ...DEFAULT_MODAL_SETTINGS,
    });
  };

  const userInfo = [
    {
      info: t("userId"),
      value: user?.id,
      withCopy: true,
    },
    {
      info: "User Type",
      value: "Personal",
      withArrow: true,
    },
  ];

  if (!mounted) return <DashboardSkeleton />;

  return (
    <main className="flex flex-col gap-card w-full page-enter">
      <DepositAlertProvider /> 
      {/* Top Bar - Flat design */}
      <div className="animate-fade-up px-5 max-[1150px]:px-4 flex items-center justify-between py-4 bg-[#181a20] border border-white/[0.06] rounded-card w-full">
        <div className="flex gap-4 items-center">
          <UserAvatar size={48} className="ring-1 ring-white/10" />
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold max-[1150px]:text-base">
              {user?.firstName} {user?.lastName}
            </h2>
            <div className="flex gap-2">
              <VerifyStatusTag verified={user?.isIDverified} status={kycStatus} />
              <div className="min-[1150px]:hidden flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5 border border-white/10">
                <span className="text-2xs font-semibold text-white/70">ID: {user?.id?.split("-")?.at(-1)}</span>
                <Copy text={user?.id ?? ""} />
              </div>
            </div>
          </div>
        </div>
        <div className="hidden md:flex gap-10">
          {userInfo.map((item) => (
            <div key={item.info} className="flex flex-col gap-[2px]">
              <span className="text-xs font-medium text-white/40">
                {item.info}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white/80">
                  {item.info === t("userId")
                    ? item.value?.split("-")?.at(-1)
                    : item.value}
                </span>
                {item.withCopy && <Copy text={item.value ?? ""} />}
                {item.withArrow && <MdKeyboardArrowRight className="text-white/40" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kick Start Your Journey KYC Section - Only shown for users who haven't completed KYC */}
      {canShowKickstart && (
        <KickstartJourney
          kycStatus={kycStatus}
          onRefreshStatus={() => refetchKycStatus()}
        />
      )}

      {/* Merged Wallet + Deposit Channels hero */}
      <div className="w-full animate-fade-up">
        <WalletCard>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">
            Deposit / Fiat Channels
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {depositChannels.map((item) =>
              item.modal ? (
                <button
                  key={item.nameKey}
                  onClick={handleOpenDepositModal}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.04] px-3.5 py-3 text-left transition-colors hover:bg-white/[0.06] hover:border-white/15"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 shrink-0"
                      style={{ color: item.color }}
                    >
                      <item.icon className="w-4 h-4" />
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <h5 className="text-sm font-semibold text-white">{t(item.nameKey as "deposit")}</h5>
                      <span className="text-micro text-white/40">{t(item.channelKey as "depositCryptoOrFiat")}</span>
                    </div>
                  </div>
                  <span className="text-white/40 group-hover:text-white transition-all shrink-0">
                    <ArrowTo className="w-4 h-4" />
                  </span>
                </button>
              ) : (
                <Link
                  key={item.nameKey}
                  href={item.link!}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.04] px-3.5 py-3 transition-colors hover:bg-white/[0.06] hover:border-white/15"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 shrink-0"
                      style={{ color: item.color }}
                    >
                      <item.icon className="w-4 h-4" />
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <h5 className="text-sm font-semibold text-white">{t(item.nameKey as "deposit")}</h5>
                      <span className="text-micro text-white/40">{t(item.channelKey as "depositCryptoOrFiat")}</span>
                    </div>
                  </div>
                  <span className="text-white/40 group-hover:text-white transition-all shrink-0">
                    <ArrowTo className="w-4 h-4" />
                  </span>
                </Link>
              )
            )}
          </div>
        </WalletCard>
      </div>

      {/* Markets Section */}
      <div className="animate-fade-up stagger-3 min-w-0 rounded-card border border-white/[0.06] bg-[#181a20] p-6 max-[768px]:p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-white/90">{t("marketsTitle")}</span>
          <Link href="/markets" className="flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white transition-colors">
            {t("viewAll")} <MdKeyboardArrowRight />
          </Link>
        </div>
        <Tabs
          className="min-w-0"
          classNames={{
            tabLabel: classes.tab_tabLabel,
            list: classes.tab_list,
            tab: classes.tab_tab,
          }}
          styles={{
            list: {
              flexWrap: "nowrap",
              overflowX: "auto",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            },
            tab: {
              paddingBottom: "12px",
            }
          }}
          value={activeMarketTab}
          onChange={(v) => setActiveMarketTab(v ?? "Hot")}
        >
          <TabsList>
            {marketTabs.map((item) => (
              <TabsTab key={item.value} value={item.value}>
                {t(item.labelKey as "tabHolding")}
              </TabsTab>
            ))}
          </TabsList>
          {marketTabs.map((item) => (
            <TabsPanel
              className="!w-full !min-w-0 !overflow-hidden pt-2"
              key={item.value}
              value={item.value}
            >
              <div className="w-full overflow-x-auto overscroll-x-contain">
              <Table
                classNames={{
                  table: clsx(classes.table_table, "!min-w-[680px]"),
                  th: classes.table_th,
                  tr: classes.table_tr,
                  td: classes.table_td,
                }}
              >
                <thead>
                  <TableTr>
                    <TableTh className="!w-[31%] max-[768px]:!w-[25%] !text-white/40 uppercase tracking-wider text-2xs !pl-4 max-[768px]:!pl-2 !pr-1">{t("coin")}</TableTh>
                    <TableTh className="!w-[22%] max-[768px]:!w-[27%] !text-white/40 uppercase tracking-wider text-2xs !px-1 max-[768px]:!text-right">{t("price")}</TableTh>
                    <TableTh className="!w-[23%] max-[768px]:!w-[28%] !text-white/40 uppercase tracking-wider text-2xs !px-1 max-[768px]:!text-right">
                      <span>{item.value === "Holding" ? t("balance") : t("volume24h")}</span>
                    </TableTh>
                    <TableTh className="!w-[12%] !text-white/40 uppercase tracking-wider text-2xs max-[768px]:hidden">{t("change24h")}</TableTh>
                    <TableTh className="!w-[12%] max-[768px]:!w-[20%] !text-white/40 uppercase tracking-wider text-2xs !text-right !pr-3 max-[768px]:!pr-2">{t("action")}</TableTh>
                  </TableTr>
                </thead>
                <tbody>
                  {displayTokens.length === 0 ? (
                    <TableTr>
                      <TableTd colSpan={5} className="!p-0">
                        <Skeleton variant="table-row" count={5} columns={5} className="py-2" />
                      </TableTd>
                    </TableTr>
                  ) : filteredTokens.length === 0 ? (
                    <TableTr>
                      <TableTd colSpan={5}>
                        <div className="py-8 flex flex-col items-center justify-center gap-2">
                          <span className="text-sm font-medium text-white/30">{t("noTokens")}</span>
                        </div>
                      </TableTd>
                    </TableTr>
                  ) : filteredTokens.map((token: any) => (
                    <TableTr key={token.pair} className="row-hover border-b border-white/[0.04] transition-colors hover:bg-white/[0.025]">
                      <TableTd className="!py-3 !pl-4 !pr-1 max-[768px]:!pl-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="relative inline-flex w-6 h-6 max-[768px]:w-7 max-[768px]:h-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-2xs font-bold text-white/80">
                            <span aria-hidden="true">{String(token.symbol || "?").charAt(0)}</span>
                            {token.image && (
                              <img
                                src={token.image}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                                className="absolute inset-0 h-full w-full rounded-full object-cover"
                              />
                            )}
                          </span>
                          <span className="flex min-w-0 items-baseline gap-1 whitespace-nowrap">
                            <span className="truncate text-caption max-[768px]:text-sm font-bold text-white/90">
                              {token.symbol}
                            </span>
                            <span className="text-2xs max-[768px]:text-[10px] font-medium text-white/35">/{token.pair.split('/')[1]}</span>
                          </span>
                        </span>
                      </TableTd>
                      <TableTd className="!px-1 !py-3 max-[768px]:!text-right">
                        <span className="flex flex-col items-start max-[768px]:items-end gap-1 overflow-hidden">
                          <PriceCell value={token.price} change={token.changePercent24h} />
                          <ChangeCell value={token.changePercent24h} mobile={true} />
                        </span>
                      </TableTd>
                      <TableTd className="!px-1 !py-3 max-[768px]:!text-right">
                        <span className="block truncate whitespace-nowrap text-caption max-[768px]:text-xs font-medium text-white/90 tabular-nums" title={item.value === "Holding" && token.balance != null
                          ? `${Number(token.balance).toLocaleString("en-US", { maximumFractionDigits: 6 })} ${token.symbol}`
                          : `$${formatVolume(token.volumeUsd)}`
                        }>
                          {item.value === "Holding" && token.balance != null
                            ? `${Number(token.balance).toLocaleString("en-US", { maximumFractionDigits: 6 })} ${token.symbol}`
                            : `$${formatVolume(token.volumeUsd)}`}
                        </span>
                      </TableTd>
                      <TableTd className="max-[768px]:hidden !py-3">
                        <ChangeCell value={token.changePercent24h} />
                      </TableTd>
                      <TableTd className="!text-right !pr-3 !py-3 max-[768px]:!pr-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openConvertModal(token.symbol);
                          }}
                          className="whitespace-nowrap text-primary hover:text-white transition-colors duration-200 py-1 px-1 sm:px-2 rounded font-semibold text-[10px] sm:text-xs active:scale-95"
                        >
                          Convert
                        </button>
                      </TableTd>
                    </TableTr>
                  ))}
                </tbody>
              </Table>
              </div>
            </TabsPanel>
          ))}
        </Tabs>
      </div>
    </main>
  );
}

export default function Dashboard() {
  return (
    <PageSuspense fallback={<DashboardSkeleton />}>
      <DashboardInner />
    </PageSuspense>
  );
}