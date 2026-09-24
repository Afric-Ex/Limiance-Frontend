"use client";

import { Search } from "@/src/components/icons/search";
import { PlaceSpot, type TpslPreview } from "@/src/components/trades/place-spot";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { useMarketFeed } from "@/src/hooks/use-market-feed";
import { useOrderBook } from "@/src/hooks/use-order-book";
import { Skeleton } from "@/src/components/shared/skeleton";
import { SpotTradePageSkeleton } from "@/src/components/skeletons/trades";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import {
  Checkbox,
  Loader,
  Table,
  TableTd,
  TableTh,
  TableTr,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  TextInput,
  Popover,
  PopoverTarget,
  PopoverDropdown,
} from "@mantine/core";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { MdKeyboardArrowDown } from "react-icons/md";
import clsx from "clsx";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { MobileTopBar } from "@/src/components/shared/mobile-top-bar";
import { IoChevronDown, IoChevronUp, IoSwapHorizontal, IoBarChartOutline, IoListOutline } from "react-icons/io5";
import { MobileBottomSheet } from "@/src/components/shared/mobile-bottom-sheet";
import { MobileBottomNav } from "@/src/components/shared/mobile-bottom-nav";

const CandlestickChart = dynamic(
  () => import("@/src/components/trades/candlestick-char"),
  { ssr: false, loading: () => <Skeleton variant="chart" height="100%" /> }
);

import type { OrderLevel } from "@/src/components/trades/candlestick-char";

type TradeMode = "spot" | "cross" | "isolated";

function SpotTrades() {
  const searchParams = useSearchParams();
  const initialPair = searchParams.get("pair")?.replace("_", "/") ?? "BTC/USDT";
  const [selectedPair, setSelectedPair] = useState(initialPair);
  const [pairSearch, setPairSearch] = useState("");
  const [tradeMode, setTradeMode] = useState<TradeMode>("spot");
  const [leverage, setLeverage] = useState(1);
  const [clickedPrice, setClickedPrice] = useState<number | null>(null);
  
  // Mobile chart toggle
  const [chartExpanded, setChartExpanded] = useState(false);
  const [, setOrderBookOpen] = useState(false);
  const [mobileMode, setMobileMode] = useState<"trade" | "chart">("chart");
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);
  const [quickOrderSide, setQuickOrderSide] = useState<"buy" | "sell">("buy");
  const [tpslPreview, setTpslPreview] = useState<TpslPreview>({});
  // Last placed trade — shown as an orange FILL tag on the chart
  const [placedFill, setPlacedFill] = useState<{ side: string; price: number; quantity: number } | null>(null);
  useEffect(() => {
    setPlacedFill(null);
  }, [selectedPair]);

  const feed = useMarketFeed(selectedPair);
  const orderBook = useOrderBook(selectedPair, "spot");
  const queryClient = useQueryClient();
  const { refreshBalances } = usePortfolioWs();

  const { data: openOrders, isLoading: openOrdersLoading } = useQuery({
    queryKey: tradingKeys.openOrders(selectedPair),
    queryFn: () => tradingService.fetchOpenOrders({ pair: selectedPair }),
    select: (res: any) => {
      const raw = res?.data ?? res ?? [];
      return Array.isArray(raw) ? raw : [];
    },
    retry: false,
    throwOnError: false,
  });

  const { data: orderHistory, isLoading: orderHistoryLoading } = useQuery({
    queryKey: tradingKeys.orderHistory({ status: "closed" }),
    queryFn: () => tradingService.spotOrderHistory(),
    select: (res: any) => {
      const raw = res?.data ?? res ?? [];
      return Array.isArray(raw) ? raw : [];
    },
    retry: false,
    throwOnError: false,
  });

  const normalizedSymbol = selectedPair.replace(/[/\\\-_\s]/g, "").toUpperCase();

  const { data: recentTrades, isLoading: recentTradesLoading } = useQuery({
    queryKey: tradingKeys.spotRecentTrades(normalizedSymbol),
    queryFn: () => tradingService.spotRecentTrades({ symbol: normalizedSymbol }),
    select: (res: any) => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []),
    retry: false,
    throwOnError: false,
  });

  const { mutate: closeOrder, isPending: closeOrderPending } = useMutation({
    mutationFn: (orderId: string) =>
      tradingService.closeSpotOrder(orderId, selectedPair),
    onSuccess: () => {
      successNotification("Order cancelled");
      queryClient.invalidateQueries({ queryKey: tradingKeys.openOrders() });
      queryClient.invalidateQueries({ queryKey: tradingKeys.openOrders(selectedPair) });
      refreshBalances();
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
  }, [feed.price, prevPrice]);

  const formatPrice = (val: number | null) =>
    val !== null ? val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;
  const formatOrderNumber = (value: unknown) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue.toLocaleString() : "—";
  };
  const formatOrderDate = (value: unknown, timeOnly = false) => {
    if (!value) return "—";
    const raw = String(value);
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return timeOnly ? date.toLocaleTimeString() : date.toLocaleString();
    return timeOnly ? (raw.split(/\s+/).pop() ?? raw) : raw;
  };
  const getOrderPair = (order: any) =>
    order?.pair || (order?.base && order?.quote ? `${order.base}/${order.quote}` : "—");
  const getOrderTotal = (order: any) => {
    const total = Number(order?.total);
    if (Number.isFinite(total) && total >= 0) return total;
    const price = Number(order?.price);
    const qty = Number(order?.quantity ?? order?.amount);
    return Number.isFinite(price) && Number.isFinite(qty) ? price * qty : null;
  };
  const isBuySide = (side: unknown) => String(side ?? "").toUpperCase() === "BUY";

  // Shared renderer for recent market trades (desktop + mobile)
  const renderRecentTrades = (limit = 20) => (
    <div className="w-full">
      {recentTradesLoading ? (
        <div className="p-4 flex justify-center"><Skeleton variant="table-row" count={5} columns={3} className="w-full" /></div>
      ) : !recentTrades?.length ? (
        <div className="p-4 text-center text-xs text-white/40">No recent trades</div>
      ) : (
        <div className="flex flex-col">
          <div className="grid grid-cols-4 px-3 py-1.5 text-[10px] text-white/40">
            <span>Time</span><span className="text-center">Direction</span><span className="text-right">Price</span><span className="text-right">Qty</span>
          </div>
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {[...recentTrades]
              .sort((a: any, b: any) => {
                const ta = new Date(a?.createdAt ?? a?.time ?? a?.ts ?? 0).getTime();
                const tb = new Date(b?.createdAt ?? b?.time ?? b?.ts ?? 0).getTime();
                return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
              })
              .slice(0, limit)
              .map((t: any, i: number) => {
              const side = String(t.side ?? "").toUpperCase();
              const isBuy = side === "BUY";
              const priceColor = isBuy ? "text-success-6" : side === "SELL" ? "text-error-1" : "text-white/80";
              return (
                <div key={t.id ?? t.tradeId ?? i} className="grid grid-cols-4 px-3 py-1.5 text-[11px] font-mono tabular-nums items-center">
                  <span className="text-white/40">{formatOrderDate(t.createdAt ?? t.time ?? t.ts, true)}</span>
                  <span className="text-center">
                    <span className={isBuy ? "text-success-6" : "text-error-1"}>{isBuy ? "BUY" : side === "SELL" ? "SELL" : "—"}</span>
                  </span>
                  <span className={"text-right " + priceColor}>{Number(t.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                  <span className="text-right text-white/80">{Number(t.quantity ?? t.qty ?? t.filled).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const isPositive = (feed.changePercent24h ?? 0) >= 0;
  const changeColor = isPositive ? "text-success-6" : "text-error-1";

  const maxAskVol = Math.max(...orderBook.sellOrders.map((o) => o.quantity), 0.001);
  const maxBidVol = Math.max(...orderBook.buyOrders.map((o) => o.quantity), 0.001);
  const selectedMarket = (feed.markets || []).find(
    (m) => `${m.base}/${m.quote}` === selectedPair || m.symbol.replace("/", "").toUpperCase() === selectedPair.replace("/", "").toUpperCase()
  );
  const bestAsk = orderBook.sellOrders[0]?.price;
  const bestBid = orderBook.buyOrders[0]?.price;
  const filteredMarkets = pairSearch.trim()
    ? (feed.markets || []).filter(
        (m: any) =>
          (m.symbol || m.pair || "").toLowerCase().includes(pairSearch.toLowerCase()) ||
          (m.base || "").toLowerCase().includes(pairSearch.toLowerCase())
      )
    : feed.markets || [];

  const handleSelectPair = (base: string, quote: string) => {
    setSelectedPair(`${base}/${quote}`);
    setPairSearch("");
  };

  const orderBookMidPrice = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : bestAsk ?? bestBid ?? null;
  const effectiveMarketPrice = feed.price ?? selectedMarket?.last_price ?? selectedMarket?.lastPrice ?? selectedMarket?.price ?? orderBookMidPrice;
  const chartOrderLevels: OrderLevel[] = (openOrders ?? []).flatMap((order: any) => {
    const entry = Number(order.price ?? order.entryPrice);
    const takeProfit = Number(order.takeProfit);
    const stopLoss = Number(order.stopLoss);
    const side = String(order.side ?? "").toUpperCase();
    const amount = Number(order.amount ?? order.quantity);

    return [
      ...(entry
        ? [{
            id: `${order.id}-entry`,
            label: "Entry",
            price: entry,
            color: "entry" as const,
            detail: `${side || "ORDER"}${amount ? ` ${amount}` : ""}`,
          }]
        : []),
      ...(takeProfit
        ? [{
            id: `${order.id}-tp`,
            label: "TP",
            price: takeProfit,
            color: "tp" as const,
          }]
        : []),
      ...(stopLoss
        ? [{
            id: `${order.id}-sl`,
            label: "SL",
            price: stopLoss,
            color: "sl" as const,
          }]
        : []),
    ];
  });

  // Live TP/SL preview from the order form, shown before the order is placed
  const previewTpslLevels: OrderLevel[] = [];
  const isFinitePositive = (v: number | undefined): v is number => Number.isFinite(v) && (v ?? 0) > 0;
  if (isFinitePositive(tpslPreview.buyTp)) previewTpslLevels.push({ id: "preview-tp-buy", label: "TP", price: tpslPreview.buyTp, color: "tp", detail: "BUY" });
  if (isFinitePositive(tpslPreview.buySl)) previewTpslLevels.push({ id: "preview-sl-buy", label: "SL", price: tpslPreview.buySl, color: "sl", detail: "BUY" });
  if (isFinitePositive(tpslPreview.sellTp)) previewTpslLevels.push({ id: "preview-tp-sell", label: "TP", price: tpslPreview.sellTp, color: "tp", detail: "SELL" });
  if (isFinitePositive(tpslPreview.sellSl)) previewTpslLevels.push({ id: "preview-sl-sell", label: "SL", price: tpslPreview.sellSl, color: "sl", detail: "SELL" });
  previewTpslLevels.forEach((level) => chartOrderLevels.push(level));

  // Orange tag for the trade the user just placed
  if (placedFill && Number.isFinite(placedFill.price) && placedFill.price > 0) {
    chartOrderLevels.push({
      id: `fill-${placedFill.side}-${placedFill.price}-${Date.now()}`,
      label: "FILL",
      price: placedFill.price,
      color: "fill",
      detail: `${placedFill.side.toUpperCase()}${placedFill.quantity ? ` ${placedFill.quantity}` : ""}`,
    });
  }

  const [base, quote] = selectedPair.split("/");

  return (
    <div className="flex gap-1 flex-col h-full bg-black min-h-screen page-enter">

      {/* ─── Mobile Sticky Top Bar ─── */}
      <MobileTopBar
        showBack
        title=""
        leftElement={
          <button className="flex items-center gap-2 tap-scale" onClick={() => window.history.back()}>
            <IoChevronDown className="rotate-90 text-white/70" size={20} />
            <div className="flex items-center gap-1">
              <IoSwapHorizontal size={16} className="text-white/40" />
              <span className="text-[15px] font-bold text-white/90">{selectedPair}</span>
            </div>
          </button>
        }
        rightElement={
          <div className="flex items-center gap-2">
            
            <div className="flex items-center bg-white/[0.06] rounded-lg p-0.5 gap-0.5 min-[1150px]:hidden">
              <button onClick={() => setMobileMode("chart")} className={`p-1.5 rounded-md transition-all ${mobileMode === "chart" ? "bg-white/15 text-white" : "text-white/40"}`}><IoBarChartOutline size={15} /></button>
              <button onClick={() => setMobileMode("trade")} className={`p-1.5 rounded-md transition-all ${mobileMode === "trade" ? "bg-white/15 text-white" : "text-white/40"}`}><IoListOutline size={15} /></button>
            </div>
            <span className={clsx("text-sm font-bold tabular-nums", changeColor)}>
              {feed.price !== null ? formatPrice(feed.price) : "—"}
            </span>
            <span className={clsx(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded",
              isPositive ? "bg-success-6/10 text-success-6" : "bg-error-1/10 text-error-1"
            )}>
              {feed.changePercent24h !== null ? `${isPositive ? "+" : ""}${feed.changePercent24h.toFixed(2)}%` : "—"}
            </span>
          </div>
        }
      />

      {/* Top Header Desktop */}
      <div className="hidden min-[1150px]:flex bg-[#181a20] py-3 px-4 justify-between items-center border-b border-white/[0.06]">
        <div className="flex items-center gap-6">
          {/* Pair selector */}
          <Popover width={360} position="bottom-start" shadow="md">
            <PopoverTarget>
              <button className="flex items-center gap-2 hover:bg-white/5 py-1 px-2 rounded -ml-2 transition-colors">
                <span className="text-xl font-bold text-white">{selectedPair}</span>
                <MdKeyboardArrowDown className="text-white/50" size={20} />
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
                    autoFocus
                  />
                </div>
                <div className="max-h-[360px] overflow-auto py-1">
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
                          <span className="text-[10px] text-white/30">{m.symbol}</span>
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

          {/* Live stats */}
          <div className={clsx("flex flex-col gap-0.5 px-2 rounded transition-colors", flashClass)}>
            {feed.price !== null ? (
              <span className={`text-lg font-bold ${changeColor}`}>{formatPrice(feed.price)}</span>
            ) : (
              <Skeleton variant="text" width="80px" height="24px" />
            )}
            <span className="text-xs text-white/50 font-medium">
              {feed.price !== null ? `₦${(feed.price * 462.5).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-white/40 font-medium">24h Change</span>
              <span className={`flex text-xs font-semibold ${changeColor} items-center gap-1`}>
                <span>{feed.change24h !== null ? formatPrice(feed.change24h) : "—"}</span>
                <span>{feed.changePercent24h !== null ? `${feed.changePercent24h >= 0 ? "+" : ""}${feed.changePercent24h}%` : "—"}</span>
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-white/40 font-medium">24h High</span>
              <span className="text-xs font-semibold text-white/90">{formatPrice(feed.high24h) ?? "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-white/40 font-medium">24h Low</span>
              <span className="text-xs font-semibold text-white/90">{formatPrice(feed.low24h) ?? "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-white/40 font-medium">24h Vol({base})</span>
              <span className="text-xs font-semibold text-white/90">
                {feed.volume24h !== null ? feed.volume24h.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-white/40 font-medium">24h Vol({quote})</span>
              <span className="text-xs font-semibold text-white/90">
                {feed.volume24h !== null && feed.price !== null
                  ? (feed.volume24h * feed.price).toLocaleString("en-US", { maximumFractionDigits: 0 })
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        <span className={`text-xs font-semibold flex items-center gap-1.5 ${feed.isConnected ? "text-success-6" : "text-white/40"}`}>
          <span className={clsx("w-2 h-2 rounded-full", feed.isConnected ? "bg-success-6 animate-pulse-glow" : "bg-white/20")} />
          {feed.isConnected ? "Live" : "Connecting"}
        </span>
      </div>

      {/* 3-Column Layout */}
<div className="hidden min-[1150px]:grid lg:grid-cols-[1fr_220px_400px] gap-1 px-1 flex-1 pb-0 min-h-0 relative">
        
        {/* MOBILE: Floating Order Book Button */}
        <button className="min-[1150px]:hidden fixed bottom-[90px] right-4 z-40 bg-[#1c1e27] border border-white/[0.08] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg tap-scale flex items-center gap-2" onClick={() => setOrderBookOpen(true)}>
          <span>Order Book</span>
        </button>

        {/* Chart Column (Responsive) */}
        <div className="flex flex-col gap-1 overflow-hidden min-w-0 min-[1150px]:col-start-1">
          <div className={clsx("bg-[#181a20] rounded relative flex flex-col transition-all duration-300", chartExpanded ? "h-[950px] shrink-0" : "flex-1 min-[1150px]:min-h-0")}>
            <CandlestickChart
              key={selectedPair}
              symbol={selectedPair}
              market="spot"
              orderBook={orderBook}
              orderLevels={chartOrderLevels}
              priceRange={{ min: feed.low24h, max: feed.high24h }}
            />
            
            {/* Mobile chart expand toggle */}
            <button 
              onClick={() => setChartExpanded(!chartExpanded)}
              className="min-[1150px]:hidden absolute bottom-2 right-2 w-8 h-8 bg-black/50 backdrop-blur border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:text-white"
            >
              {chartExpanded ? <IoChevronUp /> : <IoChevronDown />}
            </button>
          </div>

          {/* Desktop Order History Tabs */}
          <div className="hidden min-[1150px]:flex bg-[#181a20] rounded flex-1 overflow-hidden flex-col h-[50px] min-h-[50px] shrink-0">
            <Tabs
              classNames={{
                tab: "!pb-2 !pt-3 hover:!bg-transparent hover:!border-0 data-[active]:!border-b-[2px] data-[active]:!border-primary data-[active]:!text-primary !border-b-[2px] !border-transparent !rounded-none !text-xs !font-semibold text-white/50",
                list: "!flex !items-center border-b border-white/[0.06] px-4 shrink-0",
                panel: "!flex-1 !overflow-auto !min-h-0",
                root: "!flex !flex-col !min-h-0",
              }}
              defaultValue="open"
            >
              <div className="flex items-center justify-between shrink-0">
                <TabsList>
                  <TabsTab value="open">Open Orders ({openOrders?.length ?? 0})</TabsTab>
                  <TabsTab value="history">Order History</TabsTab>
                  <TabsTab value="trades">Trade History</TabsTab>
                </TabsList>
                <div className="pr-4">
                  <Checkbox
                    classNames={{
                      label: "!text-[10px] !text-white/40",
                      input: "!border-white/20 !bg-transparent checked:!bg-primary",
                    }}
                    label="Hide Other Pairs"
                  />
                </div>
              </div>
              <TabsPanel value="open">
                <Table
                  classNames={{
                    th: "!text-[10px] uppercase !text-white/40 !bg-[#181a20] sticky top-0 z-10 border-b border-white/[0.06]",
                    tr: "row-hover transition-colors border-b border-transparent",
                  }}
                >
                  <thead>
                    <TableTr>
                      <TableTh>Time</TableTh>
                      <TableTh>Pair</TableTh>
                      <TableTh>Type</TableTh>
                      <TableTh>Side</TableTh>
                      <TableTh>Price</TableTh>
                      <TableTh>Amount</TableTh>
                      <TableTh>Total</TableTh>
                      <TableTh>TP / SL</TableTh>
                      <TableTh className="text-right">Action</TableTh>
                    </TableTr>
                  </thead>
                  <tbody>
                    {openOrders?.map((order: any) => (
                      <TableTr key={order.id}>
                        <TableTd><span className="text-xs text-white/70">{formatOrderDate(order.createdAt, true)}</span></TableTd>
                        <TableTd><span className="text-xs font-semibold">{getOrderPair(order)}</span></TableTd>
                        <TableTd><span className="text-xs text-white/70 capitalize">{order.type}</span></TableTd>
                        <TableTd>
                          <span className={`text-xs font-bold ${isBuySide(order.side) ? "text-success-5" : "text-error-1"}`}>
                            {order.side?.toUpperCase()}
                          </span>
                        </TableTd>
                        <TableTd><span className="text-xs text-white/90">{formatOrderNumber(order.price)}</span></TableTd>
                        <TableTd><span className="text-xs text-white/90">{order.amount ?? order.quantity}</span></TableTd>
                        <TableTd><span className="text-xs text-white/90">{getOrderTotal(order)?.toLocaleString("en-US", { maximumFractionDigits: 2 }) ?? "—"}</span></TableTd>
                        <TableTd>
                          <span className="text-xs text-white/40">
                            {order.takeProfit ? <span className="text-success-6">{order.takeProfit}</span> : "—"}
                            {" / "}
                            {order.stopLoss ? <span className="text-error-1">{order.stopLoss}</span> : "—"}
                          </span>
                        </TableTd>
                        <TableTd className="text-right">
                          <button
                            onClick={() => closeOrder(order.id)}
                            disabled={closeOrderPending}
                            className="text-xs font-semibold text-white/40 hover:text-primary transition-colors flex items-center gap-1 ml-auto"
                          >
                            {closeOrderPending && <Loader size={10} color="white" />}
                            Cancel
                          </button>
                        </TableTd>
                      </TableTr>
                    ))}
                  </tbody>
                </Table>
                {openOrdersLoading ? (
                  <div className="p-8 flex justify-center">
                    <Skeleton variant="table-row" count={3} columns={9} className="w-full" />
                  </div>
                ) : !openOrders?.length ? (
                  <div className="min-h-[120px] flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-white/30">No open orders</p>
                  </div>
                ) : null}
              </TabsPanel>
              <TabsPanel value="history">
                {orderHistoryLoading ? (
                  <div className="p-8 flex justify-center"><Skeleton variant="table-row" count={3} columns={9} className="w-full" /></div>
                ) : !orderHistory?.length ? (
                  <div className="min-h-[120px] flex flex-col items-center justify-center gap-2">
                    <p className="text-xs font-medium text-white/30">No order history</p>
                  </div>
                ) : (
                  <Table classNames={{ th: "!text-[10px] uppercase !text-white/40 !bg-[#181a20] sticky top-0 z-10 border-b border-white/[0.06]", tr: "row-hover transition-colors border-b border-transparent" }}>
                    <thead>
                      <TableTr>
                        <TableTh>Time</TableTh>
                        <TableTh>Pair</TableTh>
                        <TableTh>Type</TableTh>
                        <TableTh>Side</TableTh>
                        <TableTh>Price</TableTh>
                        <TableTh>Amount</TableTh>
                        <TableTh>Total</TableTh>
                        <TableTh>Status</TableTh>
                      </TableTr>
                    </thead>
                    <tbody>
                      {orderHistory.map((order: any, idx: number) => (
                        <TableTr key={order.id ?? idx}>
                          <TableTd><span className="text-xs text-white/70">{formatOrderDate(order.createdAt)}</span></TableTd>
                          <TableTd><span className="text-xs font-semibold">{getOrderPair(order)}</span></TableTd>
                          <TableTd><span className="text-xs text-white/70 capitalize">{order.type}</span></TableTd>
                          <TableTd><span className={`text-xs font-bold ${isBuySide(order.side) ? "text-success-5" : "text-error-1"}`}>{order.side?.toUpperCase()}</span></TableTd>
                          <TableTd><span className="text-xs text-white/90">{formatOrderNumber(order.price)}</span></TableTd>
                          <TableTd><span className="text-xs text-white/90">{order.amount ?? order.quantity}</span></TableTd>
                          <TableTd><span className="text-xs text-white/90">{getOrderTotal(order)?.toLocaleString("en-US", { maximumFractionDigits: 2 }) ?? "—"}</span></TableTd>
                          <TableTd>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              order.status === "filled" ? "bg-success-6/15 text-success-6" :
                              order.status === "cancelled" ? "bg-error-1/15 text-error-1" :
                              "bg-white/10 text-white/50"
                            }`}>{order.status}</span>
                          </TableTd>
                        </TableTr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </TabsPanel>
              <TabsPanel value="trades">
                <div className="min-h-[120px]">{renderRecentTrades(50)}</div>
              </TabsPanel>
            </Tabs>
          </div>
        </div>

        {/* COL 2: Order Book (Desktop Only) */}
        <div className="hidden min-[1150px]:flex bg-[#181a20] rounded flex-col overflow-hidden min-h-0">
          <div className="px-4 py-3 border-b border-white/[0.06] text-sm text-white/90 font-semibold flex items-center justify-between">
            <span>Order Book</span>
            <div className="flex gap-2">
              <button className="w-5 h-5 rounded bg-white/10 flex flex-col items-center justify-center gap-px">
                <span className="w-3 h-[2px] bg-error-1" />
                <span className="w-3 h-[2px] bg-success-6" />
              </button>
              <button className="w-5 h-5 rounded flex flex-col items-center justify-center gap-px opacity-40 hover:opacity-80 transition-opacity">
                <span className="w-3 h-[2px] bg-success-6" />
                <span className="w-3 h-[2px] bg-success-6" />
              </button>
              <button className="w-5 h-5 rounded flex flex-col items-center justify-center gap-px opacity-40 hover:opacity-80 transition-opacity">
                <span className="w-3 h-[2px] bg-error-1" />
                <span className="w-3 h-[2px] bg-error-1" />
              </button>
            </div>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden p-1">
            <div className="grid grid-cols-3 px-3 py-1 mb-1">
              <span className="text-[10px] text-white/40">Price({quote})</span>
              <span className="text-[10px] text-white/40 text-right">Qty({base})</span>
              <span className="text-[10px] text-white/40 text-right">Total</span>
            </div>

            {orderBook.sellOrders.length === 0 && orderBook.buyOrders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-xs text-white/30">No order data</span>
              </div>
            ) : (
              <div className="flex flex-col flex-1">
                <div className="flex flex-col justify-end flex-1 overflow-hidden gap-[2px]">
                  {[...orderBook.sellOrders].reverse().map((order, i) => {
                    const w = Math.min((order.quantity / maxAskVol) * 100, 100);
                    return (
                      <div key={`ask-${i}`} onClick={() => setClickedPrice(order.price)} className="grid grid-cols-3 px-3 py-[2px] relative cursor-pointer hover:bg-white/[0.02]">
                        <div className="absolute top-0 right-0 bottom-0 bg-error-1/[0.08]" style={{ width: `${w}%` }} />
                        <span className="text-[11px] font-mono tabular-nums font-semibold text-error-1 z-10">{order.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        <span className="text-[11px] font-mono tabular-nums text-white/80 text-right z-10">{order.quantity.toFixed(4)}</span>
                        <span className="text-[11px] font-mono tabular-nums text-white/40 text-right z-10">{(order.price * order.quantity).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                      </div>
                    );
                  })}
                </div>

                {orderBook.sellOrders.length > 0 && orderBook.buyOrders.length > 0 && (() => {
                  const lowestAsk = Math.min(...orderBook.sellOrders.map((o) => o.price));
                  const highestBid = Math.max(...orderBook.buyOrders.map((o) => o.price));
                  const spread = +(lowestAsk - highestBid).toFixed(2);
                  return (
                    <div className="py-2.5 px-3 flex items-center justify-between border-y border-white/[0.04] my-2">
                      <span className={clsx("text-base font-bold font-mono tabular-nums", changeColor)}>
                        {feed.price !== null ? formatPrice(feed.price) : "—"}
                      </span>
                      <span className="text-[10px] text-white/40">Spread {spread}</span>
                    </div>
                  );
                })()}

                <div className="flex flex-col flex-1 overflow-hidden gap-[2px]">
                  {orderBook.buyOrders.map((order, i) => {
                    const w = Math.min((order.quantity / maxBidVol) * 100, 100);
                    return (
                      <div key={`bid-${i}`} onClick={() => setClickedPrice(order.price)} className="grid grid-cols-3 px-3 py-[2px] relative cursor-pointer hover:bg-white/[0.02]">
                        <div className="absolute top-0 right-0 bottom-0 bg-success-6/[0.08]" style={{ width: `${w}%` }} />
                        <span className="text-[11px] font-mono tabular-nums font-semibold text-success-6 z-10">{order.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        <span className="text-[11px] font-mono tabular-nums text-white/80 text-right z-10">{order.quantity.toFixed(4)}</span>
                        <span className="text-[11px] font-mono tabular-nums text-white/40 text-right z-10">{(order.price * order.quantity).toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COL 3: Trade Form (Responsive) */}
        <div className="bg-[#181a20] rounded flex flex-col overflow-y-auto max-[1150px]:min-h-[400px]">
          <Tabs
            classNames={{
              tab: "!py-3 !px-3 max-[1150px]:!py-4 max-[1150px]:flex-1 hover:!bg-transparent data-[active]:!bg-white/[0.03] data-[active]:!border-t-2 data-[active]:!border-primary data-[active]:!text-primary !border-t-2 !border-transparent !rounded-none font-bold text-xs max-[1150px]:text-sm text-white/50",
              list: "border-b border-white/[0.06] flex items-center before:!border-0 w-full",
              panel: "!p-4",
            }}
            value={tradeMode}
            onChange={(v) => {
              const m = (v ?? "spot") as TradeMode;
              setTradeMode(m);
              if (m === "spot") setLeverage(1);
              else if (m === "cross" && leverage > 10) setLeverage(10);
            }}
          >
            <TabsList className="w-full">
              <TabsTab value="spot" className="flex-1">Spot</TabsTab>
              <TabsTab value="cross" className="flex-1">Cross {tradeMode === "cross" ? `${leverage}x` : "3x"}</TabsTab>
              <TabsTab value="isolated" className="flex-1">Isolated {tradeMode === "isolated" ? `${leverage}x` : "10x"}</TabsTab>
            </TabsList>
            <TabsPanel value="spot">
              <PlaceSpot pair={selectedPair} mode="spot" leverage={1} marketPrice={effectiveMarketPrice} clickedPrice={clickedPrice} onTpslChange={setTpslPreview} onFill={setPlacedFill} />
            </TabsPanel>
            <TabsPanel value="cross">
              <PlaceSpot
                pair={selectedPair}
                mode="cross"
                leverage={leverage}
                onLeverageChange={setLeverage}
                marketPrice={effectiveMarketPrice}
                clickedPrice={clickedPrice}
                onTpslChange={setTpslPreview} onFill={setPlacedFill}
              />
            </TabsPanel>
            <TabsPanel value="isolated">
              <PlaceSpot
                pair={selectedPair}
                mode="isolated"
                leverage={leverage}
                onLeverageChange={setLeverage}
                marketPrice={effectiveMarketPrice}
                clickedPrice={clickedPrice}
                onTpslChange={setTpslPreview} onFill={setPlacedFill}
              />
            </TabsPanel>
          </Tabs>
        </div>

      </div>

      

      {/* MOBILE VIEW */}
      <div className="min-[1150px]:hidden flex flex-col flex-1 pb-[80px] min-h-0 relative">
        {/* Mobile market stats strip */}
        <div className="shrink-0 grid grid-cols-2 gap-x-3 gap-y-1.5 bg-[#181a20] border-b border-white/[0.06] px-4 py-2.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/40">24h High</span>
            <span className="text-white/90 font-semibold tabular-nums">{formatPrice(feed.high24h) ?? "—"}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/40">24h Low</span>
            <span className="text-white/90 font-semibold tabular-nums">{formatPrice(feed.low24h) ?? "—"}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/40">24h Vol({base})</span>
            <span className="text-white/90 font-semibold tabular-nums">{feed.volume24h !== null ? feed.volume24h.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/40">24h Vol({quote})</span>
            <span className="text-white/90 font-semibold tabular-nums">{feed.volume24h !== null && feed.price !== null ? (feed.volume24h * feed.price).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—"}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] col-span-2">
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
                market="spot"
                orderBook={orderBook}
                orderLevels={chartOrderLevels}
                priceRange={{ min: feed.low24h, max: feed.high24h }}
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

            {/* Chart View Tabs (Order Book / Trades) */}
            <Tabs defaultValue="orderbook" classNames={{
              tab: "!py-3 !px-4 hover:!bg-transparent data-[active]:!border-b-[2px] data-[active]:!border-primary data-[active]:!text-primary !border-b-[2px] !border-transparent !rounded-none font-bold text-sm text-white/50",
              list: "border-b border-white/[0.06] flex items-center before:!border-0 w-full",
              panel: "!p-0"
            }}>
              <TabsList>
                <TabsTab value="orderbook">Order Book</TabsTab>
                <TabsTab value="trades">Trades</TabsTab>
              </TabsList>
              
              <TabsPanel value="orderbook">
                <div className="flex flex-col p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Bids (Left) */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-white/40 mb-1 px-1">
                        <span>Qty</span><span>Price</span>
                      </div>
                      {orderBook.buyOrders.map((order, i) => {
                        const w = Math.min((order.quantity / maxBidVol) * 100, 100);
                        return (
                          <div key={`bid-${i}`} onClick={() => setClickedPrice(order.price)} className="flex justify-between relative py-0.5 px-1 cursor-pointer">
                            <div className="absolute top-0 right-0 bottom-0 bg-success-6/[0.08]" style={{ width: `${w}%` }} />
                            <span className="text-[11px] font-mono text-white/80 z-10">{order.quantity.toFixed(4)}</span>
                            <span className="text-[11px] font-mono text-success-6 z-10">{order.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                          </div>
                        )
                      })}
                    </div>
                    {/* Asks (Right) */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-white/40 mb-1 px-1">
                        <span>Price</span><span>Qty</span>
                      </div>
                      {[...orderBook.sellOrders].reverse().map((order, i) => {
                        const w = Math.min((order.quantity / maxAskVol) * 100, 100);
                        return (
                          <div key={`ask-${i}`} onClick={() => setClickedPrice(order.price)} className="flex justify-between relative py-0.5 px-1 cursor-pointer">
                            <div className="absolute top-0 left-0 bottom-0 bg-error-1/[0.08]" style={{ width: `${w}%` }} />
                            <span className="text-[11px] font-mono text-error-1 z-10">{order.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                            <span className="text-[11px] font-mono text-white/80 z-10">{order.quantity.toFixed(4)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </TabsPanel>
              
              <TabsPanel value="trades">
                <div className="flex flex-col p-2">{renderRecentTrades(30)}</div>
              </TabsPanel>
            </Tabs>

          </div>
        ) : (
          // --- TRADE VIEW ---
          <div className="flex flex-col flex-1 overflow-auto custom-scrollbar">
            <div className="flex bg-[#181a20] flex-1">
              {/* Left Side: Trade Form */}
              <div className="w-[60%] border-r border-white/[0.06]">
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
                    <PlaceSpot pair={selectedPair} mode="spot" leverage={1} marketPrice={effectiveMarketPrice} clickedPrice={clickedPrice} compactSide="buy" onTpslChange={setTpslPreview} onFill={setPlacedFill} />
                  </TabsPanel>
                  <TabsPanel value="sell">
                    <PlaceSpot pair={selectedPair} mode="spot" leverage={1} marketPrice={effectiveMarketPrice} clickedPrice={clickedPrice} compactSide="sell" onTpslChange={setTpslPreview} onFill={setPlacedFill} />
                  </TabsPanel>
                </Tabs>
              </div>

              {/* Right Side: Stacked Order Book */}
              <div className="w-[40%] flex flex-col p-1">
                <div className="flex justify-between text-[10px] text-white/40 mb-2 px-1">
                  <span>Price</span><span>Qty</span>
                </div>
                {/* Asks */}
                <div className="flex flex-col justify-end flex-1 overflow-hidden gap-[2px]">
                  {[...orderBook.sellOrders].reverse().slice(-10).map((order, i) => {
                    const w = Math.min((order.quantity / maxAskVol) * 100, 100);
                    return (
                      <div key={`ask-${i}`} onClick={() => setClickedPrice(order.price)} className="flex justify-between relative py-0.5 px-1 cursor-pointer">
                        <div className="absolute top-0 right-0 bottom-0 bg-error-1/[0.08]" style={{ width: `${w}%` }} />
                        <span className="text-[11px] font-mono text-error-1 z-10">{order.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        <span className="text-[11px] font-mono text-white/80 z-10">{order.quantity.toFixed(4)}</span>
                      </div>
                    )
                  })}
                </div>
                
                {/* Current Price */}
                <div className="py-2 px-1 flex flex-col my-1">
                  <span className={clsx("text-[13px] font-bold font-mono", changeColor)}>
                    {feed.price !== null ? formatPrice(feed.price) : "�"}
                  </span>
                  <span className="text-[10px] text-white/40">
                    ${feed.price !== null ? formatPrice(feed.price) : "�"}
                  </span>
                </div>

                {/* Bids */}
                <div className="flex flex-col flex-1 overflow-hidden gap-[2px]">
                  {orderBook.buyOrders.slice(0, 10).map((order, i) => {
                    const w = Math.min((order.quantity / maxBidVol) * 100, 100);
                    return (
                      <div key={`bid-${i}`} onClick={() => setClickedPrice(order.price)} className="flex justify-between relative py-0.5 px-1 cursor-pointer">
                        <div className="absolute top-0 right-0 bottom-0 bg-success-6/[0.08]" style={{ width: `${w}%` }} />
                        <span className="text-[11px] font-mono text-success-6 z-10">{order.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        <span className="text-[11px] font-mono text-white/80 z-10">{order.quantity.toFixed(4)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Open Orders / History / Trades */}
            <div className="bg-[#181a20] rounded flex flex-col mt-2">
               <Tabs
                 defaultValue="open"
                 classNames={{
                   tab: "!py-3 !px-3 flex-1 hover:!bg-transparent data-[active]:!border-b-[2px] data-[active]:!border-primary data-[active]:!text-primary !border-b-[2px] !border-transparent !rounded-none !text-xs !font-semibold text-white/50",
                   list: "border-b border-white/[0.06] flex items-center before:!border-0 w-full px-2",
                   panel: "!p-4",
                 }}
               >
                 <TabsList>
                   <TabsTab value="open">Open Orders ({openOrders?.length ?? 0})</TabsTab>
                   <TabsTab value="history">Order History</TabsTab>
                   <TabsTab value="trades">Trades</TabsTab>
                 </TabsList>
                 <TabsPanel value="open">
                 {openOrdersLoading ? (
                   <div className="p-4 flex justify-center"><Skeleton variant="table-row" count={3} columns={1} className="w-full" /></div>
                 ) : !openOrders?.length ? (
                   <div className="min-h-[100px] flex flex-col items-center justify-center gap-2">
                     <p className="text-[10px] font-medium text-white/30">No open orders</p>
                   </div>
                 ) : (
                   <div className="flex flex-col gap-3">
                     {openOrders.map((order: any) => (
                       <div key={order.id} className="p-3 border border-white/[0.06] rounded-xl flex flex-col gap-2 relative">
                         <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2 min-w-0">
                             <span className="text-sm font-bold">{getOrderPair(order)}</span>
                             <span className={`text-xs uppercase font-bold ${isBuySide(order.side) ? "text-success-5" : "text-error-1"}`}>{order.side?.toUpperCase()}</span>
                           </div>
                           <button onClick={() => closeOrder(order.id)} disabled={closeOrderPending} className="text-[10px] font-semibold text-white/40 hover:text-primary shrink-0">Cancel</button>
                         </div>
                         <div className="grid grid-cols-2 gap-2 text-xs">
                           <div className="flex justify-between"><span className="text-white/40">Time</span><span className="text-white text-right">{formatOrderDate(order.createdAt)}</span></div>
                           <div className="flex justify-between"><span className="text-white/40">Type</span><span className="text-white capitalize">{order.type}</span></div>
                           <div className="flex justify-between"><span className="text-white/40">Price</span><span className="text-white">{formatOrderNumber(order.price)}</span></div>
                           <div className="flex justify-between"><span className="text-white/40">Amount</span><span className="text-white">{order.amount ?? order.quantity}</span></div>
                           <div className="flex justify-between"><span className="text-white/40">Total</span><span className="text-white">{getOrderTotal(order)?.toLocaleString("en-US", { maximumFractionDigits: 2 }) ?? "—"}</span></div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
                 </TabsPanel>
                 <TabsPanel value="history">
                 {orderHistoryLoading ? (
                   <div className="p-4 flex justify-center"><Skeleton variant="table-row" count={3} columns={1} className="w-full" /></div>
                 ) : !orderHistory?.length ? (
                   <div className="min-h-[100px] flex flex-col items-center justify-center gap-2">
                     <p className="text-[10px] font-medium text-white/30">No order history</p>
                   </div>
                 ) : (
                   <div className="flex flex-col gap-3">
                     {orderHistory.map((order: any, idx: number) => (
                       <div key={order.id ?? idx} className="p-3 border border-white/[0.06] rounded-xl flex flex-col gap-2">
                         <div className="flex justify-between items-center gap-2">
                           <span className="text-sm font-bold truncate">{getOrderPair(order)} <span className={`ml-2 text-xs uppercase font-bold ${isBuySide(order.side) ? "text-success-5" : "text-error-1"}`}>{order.side?.toUpperCase()}</span></span>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${order.status === "filled" ? "bg-success-6/15 text-success-6" : order.status === "cancelled" ? "bg-error-1/15 text-error-1" : "bg-white/10 text-white/50"}`}>{order.status}</span>
                         </div>
                         <div className="grid grid-cols-2 gap-2 text-xs">
                           <div className="flex justify-between"><span className="text-white/40">Time</span><span className="text-white text-right">{formatOrderDate(order.createdAt)}</span></div>
                           <div className="flex justify-between"><span className="text-white/40">Type</span><span className="text-white capitalize">{order.type}</span></div>
                           <div className="flex justify-between"><span className="text-white/40">Price</span><span className="text-white">{formatOrderNumber(order.price)}</span></div>
                           <div className="flex justify-between"><span className="text-white/40">Amount</span><span className="text-white">{order.amount ?? order.quantity}</span></div>
                           <div className="flex justify-between"><span className="text-white/40">Total</span><span className="text-white">{getOrderTotal(order)?.toLocaleString("en-US", { maximumFractionDigits: 2 }) ?? "—"}</span></div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
                 </TabsPanel>
                 <TabsPanel value="trades">
                   {renderRecentTrades(30)}
                 </TabsPanel>
               </Tabs>
            </div>
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
              <PlaceSpot pair={selectedPair} mode="spot" leverage={1} marketPrice={effectiveMarketPrice} clickedPrice={clickedPrice} compactSide="buy" onTpslChange={setTpslPreview} onFill={setPlacedFill} />
            </TabsPanel>
            <TabsPanel value="sell">
              <PlaceSpot pair={selectedPair} mode="spot" leverage={1} marketPrice={effectiveMarketPrice} clickedPrice={clickedPrice} compactSide="sell" onTpslChange={setTpslPreview} onFill={setPlacedFill} />
            </TabsPanel>
          </Tabs>
        </div>
      </MobileBottomSheet>

            <MobileBottomNav />
    </div>
  );
}

export default function SpotTradePage() {
  return (
    <Suspense fallback={<SpotTradePageSkeleton />}>
      <SpotTrades />
    </Suspense>
  );
}
