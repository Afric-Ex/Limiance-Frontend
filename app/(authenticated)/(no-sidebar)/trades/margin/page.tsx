"use client";

import { Search } from "@/src/components/icons/search";
import { PlaceSpot, type TpslPreview } from "@/src/components/trades/place-spot";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { useMarketFeed } from "@/src/hooks/use-market-feed";
import { useOrderBook } from "@/src/hooks/use-order-book";
import { useRecentTrades } from "@/src/hooks/use-recent-trades";
import { OrderBookTabs } from "@/src/components/trades/order-book-tabs";
import { SpotPairHeader } from "@/src/components/trades/spot-pair-header";
import { TradingPanel } from "@/src/components/trades/trading-panel";
import { Skeleton } from "@/src/components/shared/skeleton";
import { MarginTradePageSkeleton } from "@/src/components/skeletons/trades";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { readList } from "@/src/lib/api-response";
import { getLatestTradePrice } from "@/src/lib/recent-trades";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  TextInput,
  Popover,
  PopoverTarget,
  PopoverDropdown,
  Modal,
  Button
} from "@mantine/core";
import { useQuery, useMutation } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { MdKeyboardArrowDown } from "react-icons/md";
import clsx from "clsx";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { MobileTopBar } from "@/src/components/shared/mobile-top-bar";
import { SidebarMenuButton } from "@/src/components/shared/sidebar-menu";
import { IoChevronDown, IoChevronUp, IoSwapHorizontal, IoBarChartOutline, IoListOutline } from "react-icons/io5";
import { MobileBottomSheet } from "@/src/components/shared/mobile-bottom-sheet";
import { MobileBottomNav } from "@/src/components/shared/mobile-bottom-nav";

const CandlestickChart = dynamic(
  () => import("@/src/components/trades/candlestick-chart"),
  { ssr: false, loading: () => <Skeleton variant="chart" height="100%" /> }
);

type TradeMode = "cross" | "isolated";

function MarginTrades() {
  const searchParams = useSearchParams();
  const initialPair = searchParams.get("pair")?.replace("_", "/") ?? "BTC/USDT";
  const [selectedPair, setSelectedPair] = useState(initialPair);
  const [hideOtherPairs] = useState(false);
  const [pairSearch, setPairSearch] = useState("");
  // Mobile and desktop headers are BOTH mounted (one is hidden by CSS), so they
  // need separate state — sharing it would open both dropdowns at once.
  const [pairMenuOpen, setPairMenuOpen] = useState(false);
  const [pairMenuDesktopOpen, setPairMenuDesktopOpen] = useState(false);
  const [tradeMode, setTradeMode] = useState<TradeMode>("cross");
  const [leverage, setLeverage] = useState(3);
  const [clickedPrice, setClickedPrice] = useState<number | null>(null);
  const [chartLastPrice, setChartLastPrice] = useState<number | null>(null);
  
  // Mobile chart toggle
  const [chartExpanded, setChartExpanded] = useState(false);
  const [, setOrderBookOpen] = useState(false);
  const [mobileMode, setMobileMode] = useState<"trade" | "chart">("trade");
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);
  const [quickOrderSide, setQuickOrderSide] = useState<"buy" | "sell">("buy");
  const [tpslPreview, setTpslPreview] = useState<TpslPreview>({});
  // Last placed trade — shown as an orange FILL tag on the chart
  const [placedFill, setPlacedFill] = useState<{
    side: string;
    price: number;
    quantity: number;
    takeProfit?: number;
    stopLoss?: number;
  } | null>(null);
  useEffect(() => {
    setPlacedFill(null);
    setTpslPreview({});
  }, [selectedPair]);

  const feed = useMarketFeed(selectedPair);
  const orderBook = useOrderBook(selectedPair, "margin");

  const { data: marginAccount, isLoading: marginAccountLoading, refetch: refetchMarginAccount, isError: marginAccountError } = useQuery({
    queryKey: ['margin-account'],
    queryFn: () => tradingService.getMarginAccount(),
    retry: false,
    throwOnError: false,
  });

  const { mutate: createMarginAccount, isPending: creatingMarginAccount } = useMutation({
    mutationFn: () => tradingService.createMarginAccount(),
    onSuccess: () => {
      successNotification("Margin account created successfully");
      refetchMarginAccount();
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const { data: openOrders } = useQuery({
    queryKey: tradingKeys.openOrders(hideOtherPairs ? selectedPair : undefined),
    queryFn: () => tradingService.fetchMarginOpenOrders({ pair: hideOtherPairs ? selectedPair : undefined }),
    select: (res: any) => res.data,
    retry: false,
    throwOnError: false,
  });

  const { data: marginPositions } = useQuery({
    queryKey: ["margin-positions"],
    queryFn: () => tradingService.marginPositions(),
    select: (res: unknown) => readList<Record<string, any>>(res),
    retry: false,
    throwOnError: false,
  });

  const { recentTrades, recentTradesLoading } = useRecentTrades(selectedPair, "margin");
  const effectiveMarketPrice =
    (feed.price != null && feed.price > 0 ? feed.price : null) ??
    (chartLastPrice != null && chartLastPrice > 0 ? chartLastPrice : null) ??
    getLatestTradePrice(recentTrades) ??
    null;
  const lastTradedPrice = effectiveMarketPrice ?? getLatestTradePrice(recentTrades) ?? feed.price ?? null;

  const { mutate: handleSetLeverage } = useMutation({
    mutationFn: (newLeverage: number) => tradingService.setMarginLeverage(newLeverage),
    onSuccess: (data, newLeverage) => {
      setLeverage(newLeverage);
      successNotification(`Margin leverage set to ${newLeverage}x`);
    },
    onError: (e) => errorMessageHandler(e),
  });

  const { mutate: handleSetMarginMode } = useMutation({
    mutationFn: (mode: TradeMode) => tradingService.setMarginMode(mode),
    onSuccess: (data, mode) => {
      setTradeMode(mode);
      successNotification(`Margin mode set to ${mode === 'cross' ? 'Cross' : 'Isolated'}`);
    },
    onError: (e) => errorMessageHandler(e),
  });

  // Price flash effect
  const [flashClass, setFlashClass] = useState("");
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  useEffect(() => {
    if (feed.price !== null && prevPrice !== null && feed.price !== prevPrice) {
      setFlashClass(feed.price > prevPrice ? "animate-flash-green" : "animate-flash-red");
      const t = setTimeout(() => setFlashClass(""), 600);
      return () => clearTimeout(t);
    }
    setPrevPrice(feed.price);
    // prevPrice is compared above and updated here; adding it would re-run the
    // flash effect unnecessarily on every price tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed.price]);

  const formatPrice = (val: number | null) =>
    val !== null ? val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;
  const normalizedSymbol = selectedPair.replace(/[/\\\-_\s]/g, "").toUpperCase();
  const isPositive = (feed.changePercent24h ?? 0) >= 0;
  const changeColor = isPositive ? "text-success-6" : "text-error-1";


  const filteredMarkets = pairSearch.trim()
    ? (feed.markets || []).filter(
        (m) =>
          m.symbol.toLowerCase().includes(pairSearch.toLowerCase()) ||
          m.base.toLowerCase().includes(pairSearch.toLowerCase())
      )
    : (feed.markets || []);

  const handleSelectPair = (base: string, quote: string) => {
    setSelectedPair(`${base}/${quote}`);
    setPairSearch("");
    setPairMenuOpen(false);
    setPairMenuDesktopOpen(false);
  };

  // Open margin orders already filtered by selectedPair (query key) — draw Entry/TP/SL on the chart.
  // The backend may return TP/SL under different names (camelCase on orders,
  // snake_case on OCO/trigger orders), so read defensively.
  const chartOrderLevels =
    (openOrders ?? []).flatMap((order: any) => {
      const entry = Number(order.price ?? order.entryPrice);
      const takeProfit = Number(order.takeProfit ?? order.take_profit ?? order.take_profit_price ?? order.tp_trigger_price ?? order.tp_price ?? order.tp);
      const stopLoss = Number(order.stopLoss ?? order.stop_loss ?? order.stop_loss_price ?? order.sl_trigger_price ?? order.sl_price ?? order.sl);
      const side = String(order.side ?? "").toUpperCase();
      const amount = Number(order.amount ?? order.quantity);

      return [
        ...(entry
          ? [{
              id: `order-${order.id ?? entry}-entry`,
              label: "Entry",
              price: entry,
              color: "entry" as const,
              detail: `${side || "ORDER"}${amount ? ` ${amount}` : ""}`,
            }]
          : []),
        ...(takeProfit
          ? [{
              id: `order-${order.id ?? takeProfit}-tp`,
              label: "TP",
              price: takeProfit,
              color: "tp" as const,
            }]
          : []),
        ...(stopLoss
          ? [{
              id: `order-${order.id ?? stopLoss}-sl`,
              label: "SL",
              price: stopLoss,
              color: "sl" as const,
            }]
          : []),
      ];
    });

  // Margin positions carry TP/SL too — draw Entry/TP/SL lines for them as well.
  const positionLevels =
    (Array.isArray(marginPositions) ? marginPositions : [])
      .filter((p: any) => {
        const pPair = p.pair || p.symbol || `${p.base || ""}/${p.quote || "USDT"}`;
        return pPair.replace(/[/\\\-_\s]/g, "").toUpperCase() === normalizedSymbol;
      })
      .flatMap((p: any) => {
        const side = String(p?.side ?? "").toLowerCase();
        const sideLabel =
          side === "long" || side === "buy" ? "LONG" :
          side === "short" || side === "sell" ? "SHORT" :
          (p?.side || "").toUpperCase();
        const size = Number(p.quantity ?? p.size ?? 0);
        const entry = Number(p.price ?? p.entryPrice ?? p.entry_price ?? 0);
        const takeProfit = Number(p.takeProfit ?? p.take_profit_price ?? p.take_profit ?? p.tp_price ?? p.tp);
        const stopLoss = Number(p.stopLoss ?? p.stop_loss_price ?? p.stop_loss ?? p.sl_price ?? p.sl);
        const key = p.id ?? p._id ?? p.position_id ?? `${p.pair}-${size}-${entry}`;
        const detail = `${sideLabel}${size ? ` ${size}` : ""}${p.leverage ? ` ${p.leverage}X` : ""}`;
        return [
          ...(entry ? [{ id: `mpos-${key}-entry`, label: "Entry", price: entry, color: "entry" as const, detail }] : []),
          ...(takeProfit ? [{ id: `mpos-${key}-tp`, label: "TP", price: takeProfit, color: "tp" as const }] : []),
          ...(stopLoss ? [{ id: `mpos-${key}-sl`, label: "SL", price: stopLoss, color: "sl" as const }] : []),
        ];
      });
    positionLevels.forEach((level) => chartOrderLevels.push(level));

  // Live TP/SL preview from the order form, shown before the order is placed
  const previewTpslLevels = [];
  const isFinitePositive = (v: number | undefined): v is number => Number.isFinite(v) && (v ?? 0) > 0;
  if (isFinitePositive(tpslPreview.buyTp)) previewTpslLevels.push({ id: "preview-tp-buy", label: "TP", price: tpslPreview.buyTp, color: "tp", detail: "BUY" });
  if (isFinitePositive(tpslPreview.buySl)) previewTpslLevels.push({ id: "preview-sl-buy", label: "SL", price: tpslPreview.buySl, color: "sl", detail: "BUY" });
  if (isFinitePositive(tpslPreview.sellTp)) previewTpslLevels.push({ id: "preview-tp-sell", label: "TP", price: tpslPreview.sellTp, color: "tp", detail: "SELL" });
  if (isFinitePositive(tpslPreview.sellSl)) previewTpslLevels.push({ id: "preview-sl-sell", label: "SL", price: tpslPreview.sellSl, color: "sl", detail: "SELL" });
  previewTpslLevels.forEach((level) => chartOrderLevels.push(level));

  // Orange tag for the trade the user just placed
  if (placedFill && Number.isFinite(placedFill.price) && placedFill.price > 0) {
    chartOrderLevels.push({
      id: `fill-${placedFill.side}-${placedFill.price}-${placedFill.quantity}`,
      label: "FILL",
      price: placedFill.price,
      color: "fill",
      detail: `${placedFill.side.toUpperCase()}${placedFill.quantity ? ` ${placedFill.quantity}` : ""}`,
    });
  }
  if (placedFill?.takeProfit && Number.isFinite(placedFill.takeProfit) && placedFill.takeProfit > 0) {
    chartOrderLevels.push({
      id: `placed-${placedFill.side}-tp`,
      label: "TP",
      price: placedFill.takeProfit,
      color: "tp",
      detail: `${placedFill.side.toUpperCase()} · placed`,
    });
  }
  if (placedFill?.stopLoss && Number.isFinite(placedFill.stopLoss) && placedFill.stopLoss > 0) {
    chartOrderLevels.push({
      id: `placed-${placedFill.side}-sl`,
      label: "SL",
      price: placedFill.stopLoss,
      color: "sl",
      detail: `${placedFill.side.toUpperCase()} · placed`,
    });
  }

  const [base, quote] = selectedPair.split("/");

  return (
    <div className="flex gap-1 flex-col h-full bg-black min-h-screen page-enter">

      {/* ─── Mobile Sticky Top Bar ─── */}
      <MobileTopBar
        title=""
        leftElement={
          <div className="flex items-center gap-1">
            <SidebarMenuButton className="-ml-1 h-9 w-9" />
            <Popover width={300} position="bottom-start" shadow="md" opened={pairMenuOpen} onChange={setPairMenuOpen}>
              <PopoverTarget>
                <button
                  aria-label="Change trading pair"
                  onClick={() => setPairMenuOpen((v) => !v)}
                  className="flex items-center gap-1 px-1 py-0.5 rounded tap-scale"
                >
                  <IoSwapHorizontal size={16} className="text-white/40 shrink-0" />
                  <span className="text-body font-bold text-white/90">{selectedPair}</span>
                  <MdKeyboardArrowDown className="text-white/40" size={16} />
                </button>
              </PopoverTarget>
              <PopoverDropdown className="!bg-[#181a20] !border-white/[0.06] !p-0">
                <div className="flex flex-col">
                  <div className="p-3 border-b border-white/[0.06]">
                    <TextInput
                      classNames={{
                        input: "!h-8 !bg-white/5 placeholder:!text-white/30 !border-0 focus:!border focus:!border-primary !rounded text-xs",
                      }}
                      placeholder="Search pairs (BTC, ETH…)"
                      leftSection={<Search className="w-4 h-4" />}
                      value={pairSearch}
                      onChange={(e) => setPairSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-[50vh] overflow-auto py-1">
                    {filteredMarkets.length === 0 ? (
                      <div className="text-center py-8 text-xs text-white/30">No pairs found</div>
                    ) : (
                      filteredMarkets.slice(0, 30).map((m) => (
                        <button
                          key={m.symbol}
                          onClick={() => handleSelectPair(m.base, m.quote)}
                          className={clsx(
                            "w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left",
                            selectedPair === `${m.base}/${m.quote}` && "bg-white/[0.03]"
                          )}
                        >
                          <div className="flex flex-col gap-0">
                            <span className="text-xs font-bold text-white/90">
                              {m.base}<span className="text-white/40">/{m.quote}</span>
                            </span>
                            <span className="text-2xs text-white/30">{m.symbol}</span>
                          </div>
                          <span className={clsx("text-xs font-semibold", m.percent_change >= 0 ? "text-success-2" : "text-error-1")}>
                            {m.percent_change >= 0 ? "+" : ""}{m.percent_change}%
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </PopoverDropdown>
            </Popover>
          </div>
        }
        rightElement={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/[0.06] rounded-lg p-0.5 gap-0.5 min-[1150px]:hidden">
              <button onClick={() => setMobileMode("chart")} className={`p-1.5 rounded-md transition-all ${mobileMode === "chart" ? "bg-white/15 text-white" : "text-white/40"}`}><IoBarChartOutline size={15} /></button>
              <button onClick={() => setMobileMode("trade")} className={`p-1.5 rounded-md transition-all ${mobileMode === "trade" ? "bg-white/15 text-white" : "text-white/40"}`}><IoListOutline size={15} /></button>
            </div>
            <span className={clsx("text-sm font-bold tabular-nums", changeColor)}>
              {effectiveMarketPrice !== null ? formatPrice(effectiveMarketPrice) : "—"}
            </span>
            <span className={clsx(
              "text-2xs font-semibold px-1.5 py-0.5 rounded",
              isPositive ? "bg-success-6/10 text-success-6" : "bg-error-1/10 text-error-1"
            )}>
              {feed.changePercent24h !== null ? `${isPositive ? "+" : ""}${feed.changePercent24h.toFixed(2)}%` : "—"}
            </span>
          </div>
        }
      />

      {/* 3-Column Layout */}
      <div className="hidden min-[1150px]:grid min-[1150px]:grid-cols-[minmax(0,1fr)_305px_305px] min-[1150px]:grid-rows-[auto_max(480px,calc(100vh-164px))_auto] content-start gap-1 px-1 pt-1 flex-1 pb-1 min-h-0 relative">

        {/* Desktop pair bar: sits above chart + order book, beside the trade form */}
        <SpotPairHeader
          className="min-[1150px]:col-span-2 min-[1150px]:col-start-1 min-[1150px]:row-start-1"
          selectedPair={selectedPair}
          feed={feed}
          flashClass={flashClass}
          menuOpen={pairMenuDesktopOpen}
          onMenuOpenChange={setPairMenuDesktopOpen}
          pairSearch={pairSearch}
          onPairSearchChange={setPairSearch}
          markets={filteredMarkets}
          onSelectPair={handleSelectPair}
          currentPrice={effectiveMarketPrice}
        />

        {/* MOBILE: Floating Order Book Button */}
        <button className="min-[1150px]:hidden fixed bottom-[90px] right-4 z-40 bg-[#1c1e27] border border-white/[0.08] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg tap-scale flex items-center gap-2" onClick={() => setOrderBookOpen(true)}>
          <span>Order Book</span>
        </button>

        {/* Chart Column (Responsive) */}
        <div className="flex flex-col gap-1 overflow-hidden min-w-0 min-[1150px]:col-start-1 min-[1150px]:row-start-2">
          <div className={clsx("bg-[#181a20] rounded relative flex flex-col transition-all duration-300", chartExpanded ? "h-[950px] shrink-0" : "flex-1 min-[1150px]:min-h-0")}>
            <CandlestickChart
              key={selectedPair}
              symbol={selectedPair}
              market="margin"
              orderBook={orderBook}
              orderLevels={chartOrderLevels}
              priceRange={{ min: feed.low24h, max: feed.high24h }}
              lastPrice={lastTradedPrice}
              onLastPriceChange={setChartLastPrice}
              insightTabs
              recentTrades={recentTrades}
            />

            {/* Mobile chart expand toggle */}
            <button
              onClick={() => setChartExpanded(!chartExpanded)}
              className="min-[1150px]:hidden absolute bottom-2 right-2 w-8 h-8 bg-black/50 backdrop-blur border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:text-white"
            >
              {chartExpanded ? <IoChevronUp /> : <IoChevronDown />}
            </button>
          </div>
        </div>

        {/* COL 2: Order Book and live market trades */}
        <OrderBookTabs
          className="hidden min-[1150px]:flex min-h-0 min-[1150px]:col-start-2 min-[1150px]:row-start-2"
          buyOrders={orderBook.buyOrders}
          sellOrders={orderBook.sellOrders}
          recentTrades={recentTrades}
          recentTradesLoading={recentTradesLoading}
          base={base}
          quote={quote}
          currentPrice={effectiveMarketPrice}
          dayChangePercent={feed.changePercent24h}
          buyPercentage={orderBook.buyPercentage}
          sellPercentage={orderBook.sellPercentage}
          isConnected={orderBook.isConnected}
          lastUpdated={orderBook.lastUpdated}
          onSelectPrice={setClickedPrice}
        />

        {/* Desktop trading panel: Open Orders / Positions / Borrowings / ... (spans under chart + order book) */}
        <div className="hidden min-[1150px]:flex flex-col min-w-0 min-h-[260px] max-h-[420px] col-span-2 col-start-1 row-start-3">
          <TradingPanel selectedPair={selectedPair} market="margin" className="flex-1 min-h-0" />
        </div>

        {/* COL 3: Trade Form (Responsive) */}
        <div className="bg-[#181a20] flex flex-col overflow-y-auto max-[1150px]:min-h-[400px] min-[1150px]:col-start-3 min-[1150px]:row-start-1 min-[1150px]:row-span-3">
          <div className="px-4 pt-3 text-base font-bold text-white">Trade</div>
          <Tabs
            classNames={{
              tab: "!py-2.5 !px-3 max-[1150px]:!py-4 max-[1150px]:flex-1 hover:!bg-transparent data-[active]:!text-white data-[active]:!border-b-2 data-[active]:!border-primary !border-b-2 !border-transparent !rounded-none font-bold text-xs max-[1150px]:text-sm text-white/50",
              list: "flex items-center gap-1 px-1 before:!border-0 w-full",
              panel: "!p-4",
            }}
            value={tradeMode}
            onChange={(v) => {
              const m = (v ?? "cross") as TradeMode;
              handleSetMarginMode(m);
              if (m === "cross" && leverage > 10) handleSetLeverage(10);
            }}
          >
            <TabsList className="w-full">
              <TabsTab value="cross">Cross {tradeMode === "cross" ? `${leverage}x` : "3x"}</TabsTab>
              <TabsTab value="isolated">Isolated {tradeMode === "isolated" ? `${leverage}x` : "10x"}</TabsTab>
            </TabsList>
            <TabsPanel value="cross">
              <PlaceSpot
                onFill={setPlacedFill}
                onTpslChange={setTpslPreview}
                pair={selectedPair}
                mode="cross"
                sideToggle
                leverage={leverage}
                onLeverageChange={setLeverage}
                onLeverageChangeEnd={(val) => handleSetLeverage(val)}
                marketPrice={feed.price}
                clickedPrice={clickedPrice}
              />
            </TabsPanel>
            <TabsPanel value="isolated">
              <PlaceSpot
                onFill={setPlacedFill}
                onTpslChange={setTpslPreview}
                pair={selectedPair}
                mode="isolated"
                sideToggle
                leverage={leverage}
                onLeverageChange={setLeverage}
                onLeverageChangeEnd={(val) => handleSetLeverage(val)}
                marketPrice={feed.price}
                clickedPrice={clickedPrice}
              />
            </TabsPanel>
          </Tabs>
        </div>

      </div>

      {/* MOBILE VIEW */}
      <div className="min-[1150px]:hidden flex flex-col flex-1 pb-[80px] min-h-0 relative">
        {/* Mobile market stats strip */}
        <div className="shrink-0 grid grid-cols-2 gap-x-3 gap-y-1.5 bg-[#181a20] border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex justify-between items-center text-micro">
            <span className="text-white/40">24h High</span>
            <span className="text-white/90 font-semibold tabular-nums">{formatPrice(feed.high24h) ?? "—"}</span>
          </div>
          <div className="flex justify-between items-center text-micro">
            <span className="text-white/40">24h Low</span>
            <span className="text-white/90 font-semibold tabular-nums">{formatPrice(feed.low24h) ?? "—"}</span>
          </div>
          <div className="flex justify-between items-center text-micro">
            <span className="text-white/40">24h Vol({base})</span>
            <span className="text-white/90 font-semibold tabular-nums">{feed.volume24h !== null ? feed.volume24h.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}</span>
          </div>
          <div className="flex justify-between items-center text-micro">
            <span className="text-white/40">24h Vol({quote})</span>
            <span className="text-white/90 font-semibold tabular-nums">{feed.volume24h !== null && feed.price !== null ? (feed.volume24h * feed.price).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—"}</span>
          </div>
          <div className="flex justify-between items-center text-micro col-span-2">
            <span className="text-white/40">24h Change</span>
            <span className={`font-semibold tabular-nums ${changeColor}`}>
              {feed.change24h !== null ? formatPrice(feed.change24h) : "—"}
              {feed.changePercent24h !== null ? ` (${feed.changePercent24h >= 0 ? "+" : ""}${feed.changePercent24h.toFixed(2)}%)` : ""}
            </span>
          </div>
        </div>
        {mobileMode === "chart" ? (
          // --- CHART VIEW ---
          <div className="flex flex-col flex-1 overflow-auto custom-scrollbar pb-[65px]">
            <div className="h-[400px] shrink-0 bg-[#181a20]">
              <CandlestickChart
                key={selectedPair}
                symbol={selectedPair}
                market="margin"
                orderBook={orderBook}
                orderLevels={chartOrderLevels}
                priceRange={{ min: feed.low24h, max: feed.high24h }}
                lastPrice={lastTradedPrice}
                onLastPriceChange={setChartLastPrice}
              />
            </div>

            {/* Bottom Action Bar */}
            <div className="bg-[#181a20] py-4 px-6 flex justify-center gap-4">
              <button onClick={() => { setQuickOrderSide("buy"); setQuickOrderOpen(true); }} className="flex-1 max-w-[160px] bg-[#2ecc71] text-white font-bold rounded-full py-2.5 text-sm active:scale-95 transition-transform">
                Buy
              </button>
              <button onClick={() => { setQuickOrderSide("sell"); setQuickOrderOpen(true); }} className="flex-1 max-w-[160px] bg-[#e74c3c] text-white font-bold rounded-full py-2.5 text-sm active:scale-95 transition-transform">
                Sell
              </button>
            </div>

            <OrderBookTabs
              className="min-[1150px]:hidden shrink-0"
              fixedHeight={320}
              buyOrders={orderBook.buyOrders}
              sellOrders={orderBook.sellOrders}
              recentTrades={recentTrades}
              recentTradesLoading={recentTradesLoading}
              base={base}
              quote={quote}
              currentPrice={effectiveMarketPrice}
              buyPercentage={orderBook.buyPercentage}
              sellPercentage={orderBook.sellPercentage}
              isConnected={orderBook.isConnected}
              lastUpdated={orderBook.lastUpdated}
              onSelectPrice={setClickedPrice}
            />
          </div>
        ) : (
          // --- TRADE VIEW ---
          <div className="flex flex-col flex-1 overflow-auto custom-scrollbar pb-[65px]">
            <div className="flex bg-[#181a20] shrink-0">
              {/* Left Side: Trade Form */}
              <div className="w-full">
                <Tabs
                  classNames={{
                    tab: "!py-3 !px-2 flex-1 hover:!bg-transparent data-[active]:!border-b-[2px] data-[active]:!border-primary data-[active]:!text-white !border-b-[2px] !border-transparent !rounded-none font-bold text-xs text-white/40",
                    list: "border-b border-white/[0.06] flex items-center before:!border-0 w-full mb-3",
                    panel: "!px-3 !pb-4",
                  }}
                  value={quickOrderSide}
                  onChange={(v) => setQuickOrderSide(v as "buy"|"sell")}
                >
                  <TabsList>
                    <TabsTab value="buy" className="data-[active]:!text-[#2ecc71] data-[active]:!border-[#2ecc71]">Buy</TabsTab>
                    <TabsTab value="sell" className="data-[active]:!text-[#e74c3c] data-[active]:!border-[#e74c3c]">Sell</TabsTab>
                  </TabsList>
                  <TabsPanel value="buy">
                    <PlaceSpot onFill={setPlacedFill} onTpslChange={setTpslPreview} pair={selectedPair} mode={tradeMode} leverage={leverage} onLeverageChange={setLeverage} onLeverageChangeEnd={(val) => handleSetLeverage(val)} marketPrice={feed.price} clickedPrice={clickedPrice} compactSide="buy" />
                  </TabsPanel>
                  <TabsPanel value="sell">
                    <PlaceSpot onFill={setPlacedFill} onTpslChange={setTpslPreview} pair={selectedPair} mode={tradeMode} leverage={leverage} onLeverageChange={setLeverage} onLeverageChangeEnd={(val) => handleSetLeverage(val)} marketPrice={feed.price} clickedPrice={clickedPrice} compactSide="sell" />
                  </TabsPanel>
                </Tabs>
              </div>
            </div>

            <OrderBookTabs
              className="min-[1150px]:hidden shrink-0"
              fixedHeight={320}
              buyOrders={orderBook.buyOrders}
              sellOrders={orderBook.sellOrders}
              recentTrades={recentTrades}
              recentTradesLoading={recentTradesLoading}
              base={base}
              quote={quote}
              currentPrice={effectiveMarketPrice}
              buyPercentage={orderBook.buyPercentage}
              sellPercentage={orderBook.sellPercentage}
              isConnected={orderBook.isConnected}
              lastUpdated={orderBook.lastUpdated}
              onSelectPrice={setClickedPrice}
            />

            {/* Mobile trading panel */}
            <TradingPanel selectedPair={selectedPair} market="margin" mobile className="rounded mt-2 min-h-[420px]" />
          </div>
        )}
      </div>

      <MobileBottomSheet opened={quickOrderOpen} onClose={() => setQuickOrderOpen(false)} title="Quick Order">
        <div className="p-4 flex flex-col">
          <Tabs
            classNames={{
              tab: "!py-3 !px-2 flex-1 hover:!bg-transparent data-[active]:!border-b-[2px] data-[active]:!text-white !border-b-[2px] !border-transparent !rounded-none font-bold text-sm text-white/40",
              list: "border-b border-white/[0.06] flex items-center before:!border-0 w-full mb-4",
              panel: "!px-0 !pb-4",
            }}
            value={quickOrderSide}
            onChange={(v) => setQuickOrderSide(v as "buy" | "sell")}
          >
            <TabsList>
              <TabsTab value="buy" className="data-[active]:!text-[#2ecc71] data-[active]:!border-[#2ecc71]">Buy</TabsTab>
              <TabsTab value="sell" className="data-[active]:!text-[#e74c3c] data-[active]:!border-[#e74c3c]">Sell</TabsTab>
            </TabsList>
            <TabsPanel value="buy">
              <PlaceSpot onFill={setPlacedFill} onTpslChange={setTpslPreview} pair={selectedPair} mode={tradeMode} leverage={leverage} onLeverageChange={setLeverage} marketPrice={feed.price} clickedPrice={clickedPrice} compactSide="buy" />
            </TabsPanel>
            <TabsPanel value="sell">
              <PlaceSpot onFill={setPlacedFill} onTpslChange={setTpslPreview} pair={selectedPair} mode={tradeMode} leverage={leverage} onLeverageChange={setLeverage} marketPrice={feed.price} clickedPrice={clickedPrice} compactSide="sell" />
            </TabsPanel>
          </Tabs>
        </div>
      </MobileBottomSheet>

      <MobileBottomNav />

      <Modal
        opened={!marginAccountLoading && (
          marginAccountError ||
          !marginAccount ||
          marginAccount?.success === false ||
          !marginAccount?.data ||
          marginAccount?.data?.margin_level === '' ||
          marginAccount?.data?.margin_level === null ||
          marginAccount?.data?.margin_level === undefined
        )}
        onClose={() => {}}
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
        centered
        title={<span className="font-bold text-lg">Create Margin Account</span>}
        classNames={{ content: "!bg-gray-7 !border !border-white/10", header: "!bg-gray-7 !border-b !border-white/10" }}
      >
        <div className="flex flex-col gap-6 py-4">
          <p className="text-sm text-white/80">
            Welcome to Limiance Margin Trading! To get started, you must create a margin account and accept the terms and conditions.
          </p>
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex flex-col gap-2">
            <h4 className="font-semibold text-primary text-sm">Margin Risk Warning</h4>
            <p className="text-xs text-white/60">
              Margin trading carries a high level of risk. You may sustain a total loss of your initial margin funds and any additional funds deposited to maintain your position. If the market moves against your position, you may be called upon to deposit a substantial amount of additional margin funds, on short notice, in order to maintain your position. If you do not provide the required funds within the time required by us, your position may be liquidated at a loss, and you will be liable for any resulting deficit in your account.
            </p>
          </div>
          <Button
            className="w-full !bg-primary hover:!bg-primary/90"
            size="md"
            loading={creatingMarginAccount}
            onClick={() => createMarginAccount()}
          >
            I Accept, Create Margin Account
          </Button>
          <Button
            variant="subtle"
            color="gray"
            className="w-full !text-white/50 hover:!text-white/80"
            onClick={() => window.history.back()}
          >
            Cancel and Go Back
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function MarginTradePage() {
  return (
    <Suspense fallback={<MarginTradePageSkeleton />}>
      <MarginTrades />
    </Suspense>
  );
}
