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

const depositChannels = [
  {
    name: "Buy Crypto",
    channel: "Local currency, payment...",
    color: "var(--primary)",
    icon: Basket,
    link: "/transactions/fiat-deposit",
  },
  {
    name: "Deposit",
    channel: "Deposit crypto or fiat",
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
      mobile ? "text-xs min-[769px]:hidden" : "text-sm max-[768px]:hidden"
    )}>
      {!mobile && (isUp ? <MdTrendingUp size={14} /> : <MdTrendingDown size={14} />)}
      {isUp ? "+" : ""}{numValue.toFixed(2)}%
    </span>
  );
}

const marketTabs = [
  "Holding",
  "Hot",
  "New listing",
  "Favorite",
  "Top Gainers",
  "24h Volume",
];

function DashboardInner() {
  const user = useUserStore((state) => state.user);

  const [activeMarketTab, setActiveMarketTab] = useState("Holding");
  const { handleOpenDepositModal } = useAssets();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // The per-coin stream powers the "Holding" tab; the Total Assets card uses
  // the overall USD/BTC totals from get_portfolio_balance.
  const { coins: wsPortfolio } = usePortfolioWs({ coins: true });

  const { data: kycStatus, refetch: refetchKycStatus } = useQuery({
    queryKey: userKeys.kycStatus,
    queryFn: () => userService.getKycStatus(),
    select: (res) => res?.data?.status,
    // Shares this key with the sidebar's profile card, so the two dedupe into
    // one request. Manual refetch still works after the TTL.
    staleTime: 5 * 60_000,
  });

  const isKycComplete = Boolean(user?.isIDverified || isKycApproved(kycStatus));

  const feed = useMarketFeed("BTC/USDT");

  // Memoized: the market feed ticks frequently — rebuilding these lists on
  // every unrelated parent render would redo all mapping/filtering each time.
  const marketTokens = useMemo(() => (feed.markets || []).map((m: any) => ({
    pair: m.symbol || m.pair || `${m.base}/${m.quote}`,
    symbol: m.base || m.symbol?.split("-")[0] || "",
    price: Number(m.last_price ?? m.lastPrice ?? m.price ?? 0),
    changePercent24h: Number(m.percent_change ?? m.priceChangePercent ?? m.changePercent24h ?? 0),
    volume24h: Number(m.volume ?? m.volume24h ?? m.quoteVolume ?? 0),
  })), [feed.markets]);

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
      const rawPair = m.pair ?? m.symbol ?? `${m.base ?? ""}/USDT`;
      const base = m.base ?? rawPair.replace("-", "/").split("/")[0] ?? "";
      return {
        pair: rawPair,
        symbol: base,
        price: Number(m.price ?? m.latest_price ?? m.last_price ?? m.lastPrice ?? 0),
        changePercent24h: Number(m.changePercent24h ?? m.percent_change ?? m.priceChangePercent ?? 0),
        volume24h: Number(m.volume24h ?? m.volume ?? m.quoteVolume ?? 0),
        image: getCryptoIcon(base) ?? m.image ?? m.logo ?? m.icon,
      };
    });
  }, [movers]);

  // Combine WS market feed (subscribed pairs) and REST movers for a complete market list
  const displayTokens = useMemo(() => {
    const allTokensMap = new Map();
    moverTokens.forEach((t: any) => allTokensMap.set(t.symbol, t));
    marketTokens.forEach((t: any) => {
      const rawPair = t.pair ?? t.symbol ?? "";
      const base = t.base ?? rawPair.replace("-", "/").split("/")[0] ?? "";
      const sym = base || t.symbol;
      allTokensMap.set(sym, {
        ...allTokensMap.get(sym),
        ...t,
        symbol: sym,
        pair: rawPair,
        image: getCryptoIcon(sym) || allTokensMap.get(sym)?.image
      });
    });

    // Hydrate images from portfolio if missing
    if (wsPortfolio && wsPortfolio.length > 0) {
      wsPortfolio.forEach((p: any) => {
        const sym = (p.symbol || "").toUpperCase();
        if (sym && p.image && allTokensMap.has(sym)) {
          allTokensMap.get(sym).image = p.image;
        }
      });
    }

    return Array.from(allTokensMap.values()).filter((t: any) => {
      // Filter out garbage pairs the backend might send
      const validQuotes = ["USDT", "USDC", "BTC", "ETH"];
      const [base, quote] = (t.pair || "").replace("-", "/").split("/");
      if (!quote) return false;
      if (!validQuotes.includes(quote)) return false;
      if ((base === "USDT" && quote === "USDC") || (base === "USDC" && quote === "USDT")) return true;
      if (validQuotes.includes(base) && quote !== "USDT") return false;
      return true;
    });
  }, [marketTokens, moverTokens, wsPortfolio]);

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
            ((t.pair || "").toUpperCase().endsWith("/USDT") || (t.pair || "").toUpperCase().endsWith("-USDT"))
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
          volume24h: marketMatch?.volume24h ?? 0,
          balance: totalBalance,
          usdValue: totalBalance * price,
          image: getCryptoIcon(sym) ?? marketMatch?.image ?? item.image ?? item.logo,
        };
      })
      .sort((a: any, b: any) => b.usdValue - a.usdValue); // Sort by USD value
  }, [wsPortfolio, displayTokens]);

  const filteredTokens = useMemo(() => {
    if (activeMarketTab === "Top Gainers") {
      return [...displayTokens]
        .filter((t: any) => t.changePercent24h !== 0)
        .sort((a: any, b: any) => b.changePercent24h - a.changePercent24h)
        .slice(0, 10);
    }
    if (activeMarketTab === "Top Losers") {
      return [...displayTokens]
        .filter((t: any) => t.changePercent24h !== 0)
        .sort((a: any, b: any) => a.changePercent24h - b.changePercent24h)
        .slice(0, 10);
    }
    if (activeMarketTab === "24h Volume") {
      return [...displayTokens]
        .sort((a: any, b: any) => (b.volume24h * b.price) - (a.volume24h * a.price))
        .slice(0, 10);
    }
    if (activeMarketTab === "Holding") {
      return getRepresentativeHoldingTokens();
    }
    // Hot / New listing / Favorite → just show full list by volume
    return [...displayTokens]
      .sort((a: any, b: any) => (b.volume24h * b.price) - (a.volume24h * a.price))
      .slice(0, 10);
  }, [activeMarketTab, displayTokens, getRepresentativeHoldingTokens]);

  const openConvertModal = (symbol: string) => {
    modals.open({
      children: <ConvertAsset defaultFromAsset={symbol} />,
      ...DEFAULT_MODAL_SETTINGS,
    });
  };

  const userInfo = [
    {
      info: "User ID",
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
                <span className="text-[10px] font-semibold text-white/70">ID: {user?.id?.split("-")?.at(-1)}</span>
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
                  {item.info === "User ID"
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
      {!isKycComplete && (
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
                  key={item.name}
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
                      <h5 className="text-sm font-semibold text-white">{item.name}</h5>
                      <span className="text-[11px] text-white/40">{item.channel}</span>
                    </div>
                  </div>
                  <span className="text-white/40 group-hover:text-white transition-all shrink-0">
                    <ArrowTo className="w-4 h-4" />
                  </span>
                </button>
              ) : (
                <Link
                  key={item.name}
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
                      <h5 className="text-sm font-semibold text-white">{item.name}</h5>
                      <span className="text-[11px] text-white/40">{item.channel}</span>
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
      <div className="animate-fade-up stagger-3 rounded-card border border-white/[0.06] bg-[#181a20] p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-white/90">Markets</span>
          <Link href="/markets" className="flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white transition-colors">
            View All <MdKeyboardArrowRight />
          </Link>
        </div>
        <Tabs
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
              <TabsTab key={item} value={item}>
                {item}
              </TabsTab>
            ))}
          </TabsList>
          {marketTabs.map((item) => (
            <TabsPanel
              className="!w-full !overflow-auto pt-2"
              key={item}
              value={item}
            >
              <Table
                classNames={{
                  table: classes.table_table,
                  th: classes.table_th,
                  tr: classes.table_tr,
                  td: classes.table_td,
                }}
              >
                <thead>
                  <TableTr>
                    <TableTh className="!text-white/40 uppercase tracking-wider text-[10px] pl-4 max-[768px]:pl-2">Coin</TableTh>
                    <TableTh className="!text-white/40 uppercase tracking-wider text-[10px] max-[768px]:text-right max-[768px]:pr-2">Price</TableTh>
                    <TableTh className="!text-white/40 uppercase tracking-wider text-[10px] max-[768px]:text-right max-[768px]:pr-2">
                      <span>{item === "Holding" ? "Balance" : "24h Volume"}</span>
                    </TableTh>
                    <TableTh className="!text-white/40 uppercase tracking-wider text-[10px] max-[768px]:hidden">24h Change</TableTh>
                    <TableTh className="!text-white/40 uppercase tracking-wider text-[10px] text-right pr-4 max-[768px]:hidden">Action</TableTh>
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
                          <span className="text-sm font-medium text-white/30">No tokens match this filter</span>
                        </div>
                      </TableTd>
                    </TableTr>
                  ) : filteredTokens.map((token: any) => (
                    <TableTr key={token.pair} className="row-hover border-b border-transparent transition-colors">
                      <TableTd className="py-1.5 pl-4 max-[768px]:pl-2 max-[768px]:py-4">
                        <span className="flex items-center gap-2.5 max-[768px]:gap-2.5">
                          {token.image ? (
                            <img src={token.image} alt={token.symbol} loading="lazy" decoding="async" className="w-6 h-6 max-[768px]:w-9 max-[768px]:h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <span className="w-6 h-6 max-[768px]:w-9 max-[768px]:h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] max-[768px]:text-sm font-bold text-white/80 shrink-0">
                              {token.symbol.charAt(0)}
                            </span>
                          )}
                          <span className="flex items-baseline max-[768px]:flex-col max-[768px]:items-start gap-1.5 max-[768px]:gap-0">
                            <span className="text-[13px] max-[768px]:text-base font-bold text-white/90">
                              {token.symbol}
                            </span>
                            <span className="text-[10px] max-[768px]:text-xs font-medium text-white/30 max-[768px]:text-white/40">{token.pair.split('/')[1]}</span>
                            <button
                              type="button"
                              onClick={() => openConvertModal(token.symbol)}
                              className="min-[769px]:hidden mt-1 text-primary hover:text-white transition-colors py-1 rounded font-semibold text-xs active:scale-95"
                            >
                              Convert
                            </button>
                          </span>
                        </span>
                      </TableTd>
                      <TableTd className="max-[768px]:text-right max-[768px]:pr-2 py-1.5 max-[768px]:py-4">
                        <span className="flex flex-col min-[769px]:block max-[768px]:items-end gap-1">
                          <PriceCell value={token.price} change={token.changePercent24h} />
                          <ChangeCell value={token.changePercent24h} mobile={true} />
                        </span>
                      </TableTd>
                      <TableTd className="py-1.5 max-[768px]:text-right max-[768px]:pr-2">
                        <span className="text-[13px] font-medium text-white/90 tabular-nums">
                          {item === "Holding" && token.balance != null
                            ? `${Number(token.balance).toLocaleString("en-US", { maximumFractionDigits: 6 })} ${token.symbol}`
                            : `$${formatVolume(token.volume24h * token.price)}`
                          }
                        </span>
                      </TableTd>
                      <TableTd className="max-[768px]:hidden py-1.5">
                        <ChangeCell value={token.changePercent24h} />
                      </TableTd>
                      <TableTd className="text-right pr-4 max-[768px]:hidden py-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openConvertModal(token.symbol);
                          }}
                          className="text-primary hover:text-white transition-colors duration-200 py-1 px-2 rounded font-semibold text-xs active:scale-95"
                        >
                          Convert
                        </button>
                      </TableTd>
                    </TableTr>
                  ))}
                </tbody>
              </Table>
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
