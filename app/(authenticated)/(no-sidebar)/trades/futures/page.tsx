'use client';

import { Search } from '@/src/components/icons/search';
import { Skeleton } from '@/src/components/shared/skeleton';
import { OpenFuturesModal } from '@/src/components/trades/open-futures-modal';
import { TradeRecordsList } from '@/src/components/trades/trade-records-list';
import { useMarketFeed } from '@/src/hooks/use-market-feed';
import { useOrderBook } from '@/src/hooks/use-order-book';
import { useRecentTrades } from '@/src/hooks/use-recent-trades';
import { OrderBookTabs } from '@/src/components/trades/order-book-tabs';
import { usePortfolioWs } from '@/src/hooks/use-portfolio-ws';
import { readList } from '@/src/lib/api-response';
import { errorMessageHandler } from '@/src/lib/error-handler';
import { successNotification } from '@/src/lib/notification-handler';
import { useUserStore } from '@/src/stores/user-store';
import { tradingService, tradingKeys } from '@/src/services/trading';
import { DEFAULT_MODAL_SETTINGS } from '@/src/utils/constants';
import {
  Checkbox,
  Loader,
  NumberInput,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Slider,
  Table,
  TableTh,
  TableTr,
  TableTd,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  TextInput,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MdKeyboardArrowDown, MdMoreVert, MdRefresh } from 'react-icons/md';
import { MobileTopBar } from '@/src/components/shared/mobile-top-bar';
import { IoChevronDown, IoChevronUp, IoSwapHorizontal, IoBarChartOutline, IoListOutline } from 'react-icons/io5';
import { MobileBottomSheet } from '@/src/components/shared/mobile-bottom-sheet';
import { MobileBottomNav } from '@/src/components/shared/mobile-bottom-nav';
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { FuturesTradePageSkeleton } from "@/src/components/skeletons/trades";
import type { OrderLevel } from "@/src/components/trades/candlestick-char";

const CandlestickChart = dynamic(
  () => import('@/src/components/trades/candlestick-char'),
  { ssr: false, loading: () => <Skeleton variant="chart" height="100%" /> }
);

const LEVERAGE_PRESETS = [1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100];
const PERCENT_MARKS = [{ value: 25 }, { value: 50 }, { value: 75 }];

const POSITION_MODAL_STYLES = {
  content: {
    backgroundColor: '#13151c',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
  },
  header: {
    backgroundColor: 'transparent',
    padding: '16px 20px',
  },
  body: {
    padding: '0 20px 20px',
  },
};

// Resolve a futures position. Prefers the live fields streamed by the
// `futures_positions` WS channel (markPrice, unrealizedPnl, initialMargin,
// takeProfitPrice/stopLossPrice) and only falls back to the markets feed or
// local math when the payload omits them (e.g. the HTTP fallback shape).
const resolveFuturesPosition = (pos: any, feed: any, selectedPair: string) => {
  const pair = pos.pair || pos.symbol || `${pos.base || ''}/${pos.quote || 'USDT'}`;
  const isLong = /^(long|buy)$/i.test(String(pos.side ?? ''));
  const size = Number(pos.quantity ?? pos.size ?? 0);
  const entryPrice = Number(pos.entryPrice ?? pos.entry_price ?? pos.price ?? pos.entry ?? 0);
  const leverage = Number(pos.leverage || 1);

  const symbolRaw = pair.replace('/', '').toUpperCase();
  const market = (feed.markets || []).find(
    (m: any) =>
      (m.symbol || m.pair || '').replace('/', '').replace('-', '').toUpperCase() ===
      symbolRaw.replace('-', '')
  );
  const liveFeedMark = Number(market?.last_price || market?.lastPrice || market?.price || 0);
  const liveSelectedMark = pair.replace('/', '') === selectedPair.replace('/', '') ? feed.price : null;
  const payloadMark = Number(pos.markPrice ?? pos.mark_price ?? 0);
  // Live ticker mark first (moves with price), then the positions-WS snapshot mark,
  // then entry price as last resort.
  const markPrice = liveFeedMark || liveSelectedMark || payloadMark || entryPrice;

  const rawMargin = pos.initialMargin ?? pos.initial_margin ?? pos.margin ?? pos.marginUsed ?? pos.margin_used;
  const margin = rawMargin ? Number(rawMargin) : (size * entryPrice) / leverage;

  const livePriced = Boolean(liveFeedMark || liveSelectedMark);
  const hasPayloadPnl =
    pos.unrealizedPnl !== undefined && pos.unrealizedPnl !== null && !isNaN(Number(pos.unrealizedPnl));
  const pnl =
    !livePriced && hasPayloadPnl
      ? Number(pos.unrealizedPnl)
      : isLong
        ? size * (markPrice - entryPrice)
        : size * (entryPrice - markPrice);
  const roe = margin > 0 ? (pnl / margin) * 100 : 0;

  const tpRaw = pos.takeProfitPrice ?? pos.take_profit_price ?? pos.takeProfit ?? pos.take_profit ?? null;
  const slRaw = pos.stopLossPrice ?? pos.stop_loss_price ?? pos.stopLoss ?? pos.stop_loss ?? null;
  const pickTpSl = (v: any) => (v !== null && Number(v) !== 0 ? v : null);

  return { pair, isLong, size, entryPrice, markPrice, leverage, margin, pnl, roe, tp: pickTpSl(tpRaw), sl: pickTpSl(slRaw) };
};

const getFuturesPositionId = (position: any) =>
  String(position.id ?? position._id ?? position.position_id ?? "");

const renderFuturesPositionDetails = (position: any) => {
  const fields: [string, unknown][] = [
    ["Position ID", position.id],
    ["User ID", position.userId],
    ["Symbol", position.symbol],
    ["Side", position.side],
    ["Base", position.base],
    ["Quote", position.quote],
    ["Size", position.size],
    ["Entry Price", position.entryPrice],
    ["Mark Price", position.markPrice],
    ["Leverage", position.leverage],
    ["Margin Mode", position.marginMode],
    ["Isolated Margin", position.isolatedMarginAmt],
    ["Initial Margin", position.initialMargin],
    ["Maintenance Margin", position.maintenanceMargin],
    ["Unrealized PnL", position.unrealizedPnl],
    ["Unrealized PnL %", position.unrealizedPnlPct],
    ["Liquidation Price", position.liquidationPrice],
    ["Bankruptcy Price", position.bankruptcyPrice],
    ["Take Profit Price", position.takeProfitPrice],
    ["Stop Loss Price", position.stopLossPrice],
    ["Created At", position.createdAt],
    ["Updated At", position.updatedAt],
  ];

  return (
    <details className="mt-2 border-t border-white/[0.06] pt-2">
      <summary className="cursor-pointer text-[11px] font-semibold text-white/50 hover:text-white/80">
        Position details
      </summary>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
        {fields.map(([label, value]) => (
          <div key={label} className="flex min-w-0 justify-between gap-2">
            <span className="shrink-0 text-white/40">{label}</span>
            <span className="truncate text-right text-white/80">{value === undefined || value === null || value === "" ? "—" : String(value)}</span>
          </div>
        ))}
      </div>
    </details>
  );
};

type OrderType = 'limit' | 'market' | 'stop';
type TradeSide = 'buy' | 'sell';
type MarginMode = 'cross' | 'isolated';

function FuturesTradesInner() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // Futures is deep-linkable like spot/margin: /trades/futures?pair=BTC_USDT
  const searchParams = useSearchParams();
  const initialPair = searchParams.get('pair')?.replace('_', '/') ?? 'BTC/USDT';
  const [selectedPair, setSelectedPair] = useState(initialPair);
  const [pairSearch, setPairSearch] = useState('');
  // Mobile and desktop headers are BOTH mounted (one is hidden by CSS), so they
  // need separate state — sharing it would open both dropdowns at once.
  const [pairMenuOpen, setPairMenuOpen] = useState(false);
  const [pairMenuDesktopOpen, setPairMenuDesktopOpen] = useState(false);
  const [futuresPrice, setFuturesPrice] = useState<number | string>('');
  const [stopLimitPrice, setStopLimitPrice] = useState<number | string>(''); // separate limit price for stop-limit orders
  const [futuresAmount, setFuturesAmount] = useState<number | string>('');
  const [sliderValue, setSliderValue] = useState(0);
  const [buyingSide, setBuyingSide] = useState<TradeSide | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [marginMode, setMarginMode] = useState<MarginMode>('cross');
  const [leverage, setLeverage] = useState(15);
  const [tpslEnabled, setTpslEnabled] = useState(false);
  const [takeProfit, setTakeProfit] = useState<number | string>('');
  const [stopLoss, setStopLoss] = useState<number | string>('');
  const [flashClass, setFlashClass] = useState('');
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const accountModalShownRef = useRef(false);
  const priceUserEditedRef = useRef(false); // true when user has manually typed a custom price
  const [chartExpanded, setChartExpanded] = useState(false);
  const [, setOrderBookOpen] = useState(false);
  const [mobileMode, setMobileMode] = useState<"trade" | "chart">("trade");
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
  }, [selectedPair]);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);
  const [closingPositionIds, setClosingPositionIds] = useState<Set<string>>(() => new Set());
  // Live funding countdown
  const [fundingCountdown, setFundingCountdown] = useState('--:--:--');

  const feed = useMarketFeed(selectedPair);
  const orderBook = useOrderBook(selectedPair, "futures");

  // Futures screen: open positions, per-coin balances and the account total.
  // This is the only surface that opens get_futures_positions.
  const { balances, coins: portfolio, refreshBalances, futuresPositions, isRefreshing } = usePortfolioWs({
    coins: true,
    balanceAccount: "futures",
    futures: true,
  });
  const futuresBalance = balances["futures"];

  const { data: futuresOpenOrders, refetch: refetchOpenOrders } = useQuery({
    queryKey: ['futures-open-orders', selectedPair],
    queryFn: () => tradingService.fetchFuturesOpenOrders({ pair: selectedPair }),
    select: (res: unknown) => readList<Record<string, any>>(res),
    retry: false,
    throwOnError: false,
  });

  const { data: futuresOrderHistory, isLoading: futuresOrderHistoryLoading } = useQuery({
    queryKey: tradingKeys.orderHistory("futures", selectedPair),
    queryFn: () => tradingService.marketOrderHistory("futures", { pair: selectedPair }),
    select: (res: any) => {
      const raw = res?.data ?? res ?? [];
      return Array.isArray(raw) ? raw : [];
    },
    retry: false,
    throwOnError: false,
  });

  const { recentTrades, recentTradesLoading } = useRecentTrades(selectedPair, "futures");

  const { data: tradeHistory = [], isLoading: tradeHistoryLoading } = useQuery({
    queryKey: tradingKeys.tradeHistory("futures", selectedPair),
    queryFn: () => tradingService.tradeHistory("futures", selectedPair),
    select: (res: unknown) => readList<Record<string, unknown>>(res),
    retry: false,
    throwOnError: false,
  });

  const { mutate: closePosition } = useMutation({
    mutationFn: (positionId: string) => tradingService.closeFuturesPosition({ positionId }),
    onSuccess: () => {
      successNotification('Position closed successfully');
      refreshBalances(); // re-requests WS portfolio + positions
      refetchOpenOrders();
    },
    onError: (err: any) => errorMessageHandler(err),
    onSettled: (_data, _error, positionId) => {
      setClosingPositionIds((current) => {
        const next = new Set(current);
        next.delete(positionId);
        return next;
      });
    },
  });

  const closePositionById = (positionId: string) => {
    setClosingPositionIds((current) => new Set(current).add(positionId));
    closePosition(positionId);
  };

  const { mutate: partialClosePosition } = useMutation({
    mutationFn: (data: { positionId: string; close_quantity: string }) =>
      tradingService.partialCloseFuturesPosition(data),
    onSuccess: () => {
      successNotification('Partial close executed successfully');
      refreshBalances();
      modals.closeAll();
    },
    onError: (err: any) => errorMessageHandler(err),
  });

  const { mutate: updateTPSL } = useMutation({
    mutationFn: (data: { positionId: string; take_profit_price?: string; stop_loss_price?: string }) => 
      tradingService.updateFuturesPositionTPSL(data),
    onSuccess: () => {
      successNotification('TP/SL updated successfully');
      modals.closeAll();
    },
    onError: (err: any) => errorMessageHandler(err),
  });

  const { mutate: cancelOrder } = useMutation({
    mutationFn: (orderId: string) => tradingService.cancelFuturesOrder(orderId),
    onSuccess: () => {
      successNotification('Order cancelled');
      refetchOpenOrders();
      refreshBalances(); // keep positions panel in sync after cancel
    },
    onError: (err: any) => errorMessageHandler(err),
  });

  const { mutate: handleSetFuturesMode } = useMutation({
    mutationFn: (mode: MarginMode) => tradingService.setFuturesMode(mode),
    onSuccess: (_, mode) => {
      setMarginMode(mode);
      successNotification(`Margin mode set to ${mode === 'cross' ? 'Cross' : 'Isolated'}`);
    },
    onError: (err: any) => {
      errorMessageHandler(err);
      // Revert UI on error if needed (optional)
    },
  });

  const { mutate: handleSetFuturesLeverage } = useMutation({
    mutationFn: (lev: number) => tradingService.setFuturesLeverage(lev),
    onSuccess: (_, lev) => {
      setLeverage(lev);
      successNotification(`Leverage set to ${lev}x`);
    },
    onError: (err: any) => {
      errorMessageHandler(err);
    },
  });

  const user = useUserStore((state) => state.user);

  // Wallet Balance = total USD value of everything in futures wallet (from balance API)
  const walletBalanceUsd = useMemo(
    () => Number.parseFloat(futuresBalance?.inUsd ?? '0') || 0,
    [futuresBalance?.inUsd]
  );

  // Available for order sizing = quote-asset (e.g. USDT) balance specifically in futures wallet
  const futuresQuoteAsset = selectedPair.split('/')[1] ?? 'USDT';
  const availableQuote = useMemo(() => {
    const entry = portfolio?.find((p: any) => p.symbol === futuresQuoteAsset);
    const quoteBalance = Number.parseFloat(entry?.futuresBalance ?? '0') || 0;
    // If no quote asset found, fall back to total wallet value
    return quoteBalance || walletBalanceUsd;
  }, [portfolio, futuresQuoteAsset, walletBalanceUsd]);

  const hasFuturesAccount = user?.isFuturesAccepted;

  useEffect(() => {
    if (user === null || hasFuturesAccount || accountModalShownRef.current) return;
    accountModalShownRef.current = true;
    modals.open({
      children: (
        <OpenFuturesModal
          onConfirm={() => {
            // Handled by the modal store update
          }}
        />
      ),
      ...DEFAULT_MODAL_SETTINGS,
    });
  }, [hasFuturesAccount, user]);

  useEffect(() => {
    if (orderType === 'market') {
      setFuturesPrice('');
      return;
    }
    // Only auto-fill if the user hasn't manually typed their own price
    if (feed.price !== null && futuresPrice === '' && !priceUserEditedRef.current) {
      setFuturesPrice(feed.price);
    }
  }, [feed.price, futuresPrice, orderType]);

  // When user switches pair or order type, reset amounts but only pre-fill price if the field is empty
  const prevOrderTypeRef = useRef(orderType);
  const prevPairRef = useRef(selectedPair);
  useEffect(() => {
    const pairChanged = prevPairRef.current !== selectedPair;
    const typeChanged = prevOrderTypeRef.current !== orderType;
    prevOrderTypeRef.current = orderType;
    prevPairRef.current = selectedPair;

    if (!pairChanged && !typeChanged) return; // ignore feed.price ticks

    setFuturesPrice(orderType === 'market' ? '' : feed.price ?? '');
    setFuturesAmount('');
    setSliderValue(0);
    setTakeProfit('');
    setStopLoss('');
    setStopLimitPrice('');
    priceUserEditedRef.current = false; // reset when pair or order type changes
  }, [selectedPair, orderType]); // intentionally exclude feed.price

  useEffect(() => {
    if (feed.price !== null && prevPrice !== null && feed.price !== prevPrice) {
      setFlashClass(feed.price > prevPrice ? 'animate-flash-green' : 'animate-flash-red');
      const timer = setTimeout(() => setFlashClass(''), 600);
      return () => clearTimeout(timer);
    }
    setPrevPrice(feed.price);
  }, [feed.price, prevPrice]);

  // Funding rate countdown — ticks every second
  useEffect(() => {
    const tick = () => {
      if (feed.nextFundingTime) {
        const msLeft = new Date(feed.nextFundingTime).getTime() - Date.now();
        if (msLeft > 0) {
          const h = Math.floor(msLeft / 3600000);
          const m = Math.floor((msLeft % 3600000) / 60000);
          const s = Math.floor((msLeft % 60000) / 1000);
          setFundingCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
          return;
        }
      }
      // No nextFundingTime from WS — derive from fixed 8-hour funding windows
      const now = new Date();
      const hours = now.getUTCHours();
      const nextFundingHour = hours < 8 ? 8 : hours < 16 ? 16 : 24;
      const nextFunding = new Date(now);
      nextFunding.setUTCHours(nextFundingHour, 0, 0, 0);
      const msLeft = nextFunding.getTime() - now.getTime();
      const h = Math.floor(msLeft / 3600000);
      const m = Math.floor((msLeft % 3600000) / 60000);
      const s = Math.floor((msLeft % 60000) / 1000);
      setFundingCountdown(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [feed.nextFundingTime]);

  const [baseAsset, quoteAsset = "USDT"] = selectedPair.split('/');
  // For stop-limit: futuresPrice is the TRIGGER price, stopLimitPrice is the LIMIT price
  const workingPrice = Number(futuresPrice) || feed.price || 0;
  const effectiveLimitPrice = orderType === 'stop' ? (Number(stopLimitPrice) || workingPrice) : workingPrice;
  const quantity = Number(futuresAmount) || 0;
  const orderValue = effectiveLimitPrice * quantity;
  const cost = leverage > 0 ? orderValue / leverage : 0;
  const maxNotional = availableQuote * leverage;
  const maxQuantity = effectiveLimitPrice > 0 ? maxNotional / effectiveLimitPrice : 0;
  const chartOrderLevels: OrderLevel[] = [
    ...(workingPrice && (quantity > 0 || tpslEnabled)
      ? [{
          id: 'entry-preview',
          label: 'Entry',
          price: workingPrice,
          color: 'entry' as const,
          detail: `${orderType.toUpperCase()} ${leverage}x`,
        }]
      : []),
    ...(tpslEnabled && Number(takeProfit)
      ? [{
          id: 'take-profit-preview',
          label: 'TP',
          price: Number(takeProfit),
          color: 'tp' as const,
        }]
      : []),
    ...(tpslEnabled && Number(stopLoss)
      ? [{
          id: 'stop-loss-preview',
          label: 'SL',
          price: Number(stopLoss),
          color: 'sl' as const,
        }]
      : []),
  ];
  // Open positions for the selected pair — draw Entry/TP/SL lines on the chart
  const positionLevels =
    (Array.isArray(futuresPositions) ? futuresPositions : [])
      .filter((p: any) => {
        const pPair = p.pair || `${p.base || ""}/${p.quote || "USDT"}`;
        return pPair.replace("/", "").replace("-", "").toUpperCase() === selectedPair.replace("/", "").replace("-", "").toUpperCase();
      })
      .flatMap((p: any) => {
        const side = String(p.side || "").toLowerCase();
        const sideLabel =
          side === "long" || side === "buy" ? "LONG" :
          side === "short" || side === "sell" ? "SHORT" :
          (p.side || "").toUpperCase();
        const size = Number(p.quantity ?? p.size ?? 0);
        const entry = Number(p.price || p.entryPrice || p.entry_price || 0);
        const tp = Number(p.takeProfit || p.take_profit_price || p.take_profit || p.tp_price || p.tp || 0);
        const sl = Number(p.stopLoss || p.stop_loss_price || p.stop_loss || p.sl_price || p.sl || 0);
        const key = p.id || p._id || p.position_id || `${p.pair}-${size}-${entry}`;
        const detail = `${sideLabel}${size ? ` ${size}` : ""}${p.leverage ? ` ${p.leverage}X` : ""}`;
        return [
          ...(entry ? [{ id: `pos-${key}-entry`, label: "Entry", price: entry, color: "entry" as const, detail }] : []),
          ...(tp ? [{ id: `pos-${key}-tp`, label: "TP", price: tp, color: "tp" as const }] : []),
          ...(sl ? [{ id: `pos-${key}-sl`, label: "SL", price: sl, color: "sl" as const }] : []),
        ];
      });
  positionLevels.forEach((level) => chartOrderLevels.push(level));

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

  const filteredMarkets = (feed.markets || []).filter((market: any) => {
    if (!pairSearch.trim()) return true;
    const needle = pairSearch.trim().toLowerCase();
    const marketPair = market.pair || market.symbol || `${market.base}/${market.quote}`;
    return marketPair.toLowerCase().includes(needle);
  });

  // Close both dropdowns and clear the search so the next open starts clean.
  const handleSelectPair = (base: string, quote: string) => {
    setSelectedPair(`${base}/${quote}`);
    setPairSearch('');
    setPairMenuOpen(false);
    setPairMenuDesktopOpen(false);
  };

  const formatPrice = (value: number | null) =>
    value !== null
      ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : null;

  const formatTime = (value: unknown) => {
    if (!value) return '—';
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString();
  };

  // Shared renderer for recent market trades (desktop + mobile) — mirrors margin
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
              const side = String(t.side ?? '').toUpperCase();
              const isBuy = side === 'BUY';
              const priceColor = isBuy ? 'text-success-6' : side === 'SELL' ? 'text-error-1' : 'text-white/80';
              return (
                <div key={t.id ?? t.tradeId ?? i} className="grid grid-cols-4 px-3 py-1.5 text-[11px] font-mono tabular-nums items-center">
                  <span className="text-white/40">{formatTime(t.createdAt ?? t.time ?? t.ts)}</span>
                  <span className="text-center">
                    <span className={isBuy ? 'text-success-6' : 'text-error-1'}>{isBuy ? 'BUY' : side === 'SELL' ? 'SELL' : '—'}</span>
                  </span>
                  <span className={'text-right ' + priceColor}>{Number(t.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
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
  const changeColor = isPositive ? 'text-success-6' : 'text-error-1';
  const maxAskVol = Math.max(...orderBook.sellOrders.map((o) => o.quantity), 0.001);
  const maxBidVol = Math.max(...orderBook.buyOrders.map((o) => o.quantity), 0.001);

  const validateTpsl = (side: TradeSide) => {
    if (!tpslEnabled) return;
    if (!workingPrice) throw new Error('Price is required before adding TP/SL.');

    const tp = Number(takeProfit) || 0;
    const sl = Number(stopLoss) || 0;

    if (!tp && !sl) throw new Error('Enter a take profit or stop loss value.');
    if (tp && side === 'buy' && tp <= workingPrice) throw new Error('Take profit must be above entry price for a long position.');
    if (tp && side === 'sell' && tp >= workingPrice) throw new Error('Take profit must be below entry price for a short position.');
    if (sl && side === 'buy' && sl >= workingPrice) throw new Error('Stop loss must be below entry price for a long position.');
    if (sl && side === 'sell' && sl <= workingPrice) throw new Error('Stop loss must be above entry price for a short position.');
  };

  const { mutate: placeOrder, isPending: orderPending } = useMutation({
    mutationFn: async (side: TradeSide): Promise<any> => {
      if (!hasFuturesAccount) {
        throw new Error('Open your futures account before placing an order.');
      }
      if (!quantity) {
        throw new Error('Enter a valid quantity.');
      }
      if (orderType !== 'market' && !workingPrice) {
        throw new Error(orderType === 'stop' ? 'Enter a trigger price.' : 'Enter a valid price.');
      }
      if (cost > availableQuote && availableQuote > 0) {
        throw new Error('Insufficient futures balance for this margin requirement.');
      }

      validateTpsl(side);

      const payload = {
        pair: selectedPair,
        side,
        type:
          orderType === 'market'
            ? ('market' as const)
            : orderType === 'stop'
              ? side === 'buy'
                ? ('stop_buy' as const)
                : ('stop_sell' as const)
              : ('limit' as const),
        quantity,
        leverage,
        ...(orderType === 'limit' ? { price: workingPrice } : {}),
        // Stop-limit: stopPrice = trigger, price = limit execution price
        ...(orderType === 'stop' ? { stopPrice: workingPrice, price: effectiveLimitPrice } : {}),
        marginMode,
        ...(tpslEnabled && Number(takeProfit) ? { takeProfit: Number(takeProfit) } : {}),
        ...(tpslEnabled && Number(stopLoss) ? { stopLoss: Number(stopLoss) } : {}),
      };

      return tradingService.placeFuturesOrder(payload);
    },
    onSuccess: (_, side) => {
      setPlacedFill({
        side,
        price: workingPrice,
        quantity,
        takeProfit: Number(takeProfit) > 0 ? Number(takeProfit) : undefined,
        stopLoss: Number(stopLoss) > 0 ? Number(stopLoss) : undefined,
      });
      successNotification(`Futures ${side} order placed successfully`);
      refreshBalances();
      refetchOpenOrders();
      setBuyingSide(null);
      setFuturesAmount('');
      setSliderValue(0);
      setTakeProfit('');
      setStopLoss('');
      setStopLimitPrice('');
    },
    onError: (error: any) => {
      errorMessageHandler(error);
      setBuyingSide(null);
    },
  });

  const updateSliderValue = (value: number) => {
    setSliderValue(value);
    if (!workingPrice) return;
    const nextQuantity = (maxQuantity * value) / 100;
    setFuturesAmount(Number(nextQuantity.toFixed(6)));
  };

  const inputLabel = orderType === 'stop' ? 'Trigger' : 'Price';
  const inputPlaceholder = feed.price ? feed.price.toString() : '0';
  const stopLimitPlaceholder = workingPrice > 0 ? workingPrice.toString() : inputPlaceholder;

  const tradeFormPanel = (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center text-xs">
        <span className="text-white/40" title="Funds available to open new positions (excludes margin locked in open positions)">Available</span>
        <span className="font-semibold text-white/90 flex items-center gap-1">
          {availableQuote.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {futuresQuoteAsset}
          <button
            type="button"
            onClick={refreshBalances}
            aria-label="Refresh available futures balance"
            title="Refresh balance"
            className="text-white/40 hover:text-white transition-colors"
          >
            <MdRefresh size={14} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          <span className="text-primary text-[10px]">
            {marginMode === 'cross' ? 'Cross' : 'Isolated'}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {orderType !== 'market' && (
          <div className="flex items-center bg-white/[0.03] border border-white/[0.06] focus-within:border-primary transition-colors rounded-lg px-3 h-10">
            <span className="text-xs text-white/40 w-14">{inputLabel}</span>
            <NumberInput
              hideControls
              value={futuresPrice}
              onChange={(val) => {
                setFuturesPrice(val);
                // Mark that the user is typing their own price — stop auto-fill
                priceUserEditedRef.current = val !== '' && val !== feed.price;
              }}
              classNames={{
                root: '!flex-1',
                input: '!bg-transparent !h-full !text-sm font-semibold !text-white !border-0 !text-right focus:!ring-0',
              }}
              placeholder={inputPlaceholder}
            />
            <span className="text-xs text-white/40 ml-2">USDT</span>
          </div>
        )}
        {/* Stop-limit: second field for the limit execution price */}
        {orderType === 'stop' && (
          <div className="flex items-center bg-white/[0.03] border border-white/[0.06] focus-within:border-primary transition-colors rounded-lg px-3 h-10">
            <span className="text-xs text-white/40 w-14">Limit</span>
            <NumberInput
              hideControls
              value={stopLimitPrice}
              onChange={setStopLimitPrice}
              classNames={{
                root: '!flex-1',
                input: '!bg-transparent !h-full !text-sm font-semibold !text-white !border-0 !text-right focus:!ring-0',
              }}
              placeholder={stopLimitPlaceholder}
            />
            <span className="text-xs text-white/40 ml-2">USDT</span>
          </div>
        )}

        <div className="flex items-center bg-white/[0.03] border border-white/[0.06] focus-within:border-primary transition-colors rounded-lg px-3 h-10">
          <span className="text-xs text-white/40 w-14">Qty</span>
          <NumberInput
            hideControls
            value={futuresAmount}
            onChange={setFuturesAmount}
            classNames={{
              root: '!flex-1',
              input: '!bg-transparent !h-full !text-sm font-semibold !text-white !border-0 !text-right focus:!ring-0',
            }}
            placeholder="0"
          />
          <span className="text-xs text-white/40 ml-2">{baseAsset}</span>
        </div>

        <div className="px-2 pt-2 pb-4">
          <Slider
            min={0}
            max={100}
            step={25}
            value={sliderValue}
            onChange={updateSliderValue}
            classNames={{
              track: '!h-1 before:!h-1 bg-white/10 before:!bg-white/10',
              bar: '!bg-white/40',
              thumb: '!border-2 !border-white/40 !bg-[#181a20]',
              mark: '!hidden',
            }}
            marks={PERCENT_MARKS}
          />
        </div>

        <div className="flex items-center justify-between">
          <Checkbox
            checked={tpslEnabled}
            onChange={(event) => setTpslEnabled(event.currentTarget.checked)}
            label="TP/SL"
            classNames={{
              label: '!text-xs !text-white/60 font-semibold !pl-2',
              input: '!border-white/20 !bg-transparent checked:!bg-primary',
            }}
          />
          <span className="text-[10px] text-white/40">
            Max {maxQuantity.toFixed(4)} {baseAsset}
          </span>
        </div>

        {tpslEnabled && (
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              hideControls
              value={takeProfit}
              onChange={setTakeProfit}
              classNames={{
                input: '!bg-white/[0.03] !h-10 !text-sm !font-semibold !text-white !border !border-success-6/20 placeholder:!text-white/25',
              }}
              placeholder="Take Profit"
            />
            <NumberInput
              hideControls
              value={stopLoss}
              onChange={setStopLoss}
              classNames={{
                input: '!bg-white/[0.03] !h-10 !text-sm !font-semibold !text-white !border !border-error-1/20 placeholder:!text-white/25',
              }}
              placeholder="Stop Loss"
            />
          </div>
        )}

        <div className="py-2 border-t border-white/[0.06] flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40">Entry</span>
            <span className="text-xs font-semibold text-white/90">
              {workingPrice ? `${workingPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDT` : '0.00 USDT'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40">Cost</span>
            <span className="text-xs font-semibold text-white/90">
              {cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40">Order Value</span>
            <span className="text-xs font-semibold text-white/90">
              {orderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => {
              setBuyingSide('buy');
              placeOrder('buy');
            }}
            disabled={orderPending || !hasFuturesAccount}
            className="bg-success-6 hover:bg-success-5 disabled:opacity-50 transition-colors text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-1 active:scale-95"
          >
            {orderPending && buyingSide === 'buy' && <Loader size={12} color="white" />}
            Buy / Long
          </button>
          <button
            onClick={() => {
              setBuyingSide('sell');
              placeOrder('sell');
            }}
            disabled={orderPending || !hasFuturesAccount}
            className="bg-error-1 hover:bg-error-2 disabled:opacity-50 transition-colors text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-1 active:scale-95"
          >
            {orderPending && buyingSide === 'sell' && <Loader size={12} color="white" />}
            Sell / Short
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return <FuturesTradePageSkeleton />;

  return (
    <div className="flex gap-1 flex-col h-full bg-black min-h-screen page-enter">

      {/* ─── Mobile Sticky Top Bar ─── */}
      <MobileTopBar
        showBack
        title=""
        leftElement={
          <div className="flex items-center gap-1">
            <button aria-label="Go back" onClick={() => window.history.back()} className="tap-scale p-0.5 -ml-1">
              <IoChevronDown className="rotate-90 text-white/70" size={20} />
            </button>
            <Popover width={300} position="bottom-start" shadow="md" opened={pairMenuOpen} onChange={setPairMenuOpen}>
              <PopoverTarget>
                <button
                  aria-label="Change trading pair"
                  onClick={() => setPairMenuOpen((v) => !v)}
                  className="flex items-center gap-1 px-1 py-0.5 rounded tap-scale"
                >
                  <IoSwapHorizontal size={16} className="text-white/40" />
                  <span className="text-[15px] font-bold text-white/90">
                    {selectedPair} <span className="text-primary text-[10px] align-top bg-primary/10 px-1 rounded ml-1">Perp</span>
                  </span>
                  <MdKeyboardArrowDown className="text-white/40" size={16} />
                </button>
              </PopoverTarget>
              <PopoverDropdown className="!bg-[#181a20] !border-white/[0.06] !p-0">
                <div className="max-h-[400px] overflow-auto flex flex-col p-2">
                  <TextInput
                    value={pairSearch}
                    onChange={(event) => setPairSearch(event.currentTarget.value)}
                    classNames={{
                      input: '!h-8 !bg-white/5 placeholder:!text-white/30 !border-0 focus:!border focus:!border-primary !rounded mb-2 text-xs',
                    }}
                    placeholder="Search pairs..."
                    leftSection={<Search className="w-4 h-4" />}
                  />
                  {filteredMarkets.length === 0 ? (
                    <div className="text-center py-8 text-xs text-white/30">No pairs found</div>
                  ) : (
                    filteredMarkets.slice(0, 25).map((market) => {
                      const symbol = `${market.base}/${market.quote}`;
                      return (
                        <button
                          key={market.symbol}
                          onClick={() => handleSelectPair(market.base, market.quote)}
                          className={clsx(
                            'flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors text-left',
                            selectedPair === symbol && 'bg-white/5'
                          )}
                        >
                          <span className="text-xs font-bold">
                            {market.base}<span className="text-white/40">/{market.quote} Perp</span>
                          </span>
                          <span className={clsx('text-xs font-semibold', market.percent_change >= 0 ? 'text-success-2' : 'text-error-1')}>
                            {market.percent_change >= 0 ? '+' : ''}{market.percent_change}%
                          </span>
                        </button>
                      );
                    })
                  )}
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

      <div className="hidden min-[1150px]:flex bg-[#181a20] py-3 px-4 justify-between items-center border-b border-white/[0.06]">
        <div className="flex items-center gap-8">
          {/* Back */}
          <button className="flex items-center gap-1 tap-scale" onClick={() => window.history.back()}>
            <IoChevronDown className="rotate-90 text-white/70" size={22} />
          </button>
          <Popover width={350} position="bottom-start" shadow="md" opened={pairMenuDesktopOpen} onChange={setPairMenuDesktopOpen}>
            <PopoverTarget>
              <button
                aria-label="Change trading pair"
                onClick={() => setPairMenuDesktopOpen((v) => !v)}
                className="flex items-center gap-2 hover:bg-white/5 py-1 px-2 rounded -ml-2 transition-colors"
              >
                <span className="text-xl font-bold text-white">
                  {selectedPair} <span className="text-primary text-[10px] ml-1 align-top bg-primary/10 px-1 rounded">Perp</span>
                </span>
                <MdKeyboardArrowDown className="text-white/50" size={20} />
              </button>
            </PopoverTarget>
            <PopoverDropdown className="!bg-[#181a20] !border-white/[0.06] !p-0">
              <div className="max-h-[400px] overflow-auto flex flex-col p-2">
                <TextInput
                  value={pairSearch}
                  onChange={(event) => setPairSearch(event.currentTarget.value)}
                  classNames={{
                    input: '!h-8 !bg-white/5 placeholder:!text-white/30 !border-0 focus:!border focus:!border-primary !rounded mb-2 text-xs',
                  }}
                  placeholder="Search pairs..."
                  leftSection={<Search className="w-4 h-4" />}
                />
                {filteredMarkets.length === 0 ? (
                  <div className="text-center py-8 text-xs text-white/30">No pairs found</div>
                ) : (
                  filteredMarkets.slice(0, 25).map((market) => {
                    const symbol = `${market.base}/${market.quote}`;
                    return (
                      <button
                        key={market.symbol}
                        onClick={() => handleSelectPair(market.base, market.quote)}
                        className={clsx(
                          'flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors text-left',
                          selectedPair === symbol && 'bg-white/5'
                        )}
                      >
                        <span className="text-xs font-bold">
                          {market.base}<span className="text-white/40">/{market.quote} Perp</span>
                        </span>
                        <span className={clsx('text-xs font-semibold', market.percent_change >= 0 ? 'text-success-2' : 'text-error-1')}>
                          {market.percent_change >= 0 ? '+' : ''}{market.percent_change}%
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </PopoverDropdown>
          </Popover>

          <div className={clsx('flex flex-col gap-0.5 px-2 rounded transition-colors', flashClass)}>
            {feed.price !== null ? (
              <span className={`text-lg font-bold ${changeColor}`}>{formatPrice(feed.price)}</span>
            ) : (
              <Skeleton variant="text" width="80px" height="24px" />
            )}
            <span className="text-xs text-white/50 font-medium flex items-center gap-2">
              {feed.price !== null ? `₦${(feed.price * 462.5).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
              <span className="underline decoration-dashed decoration-white/20 underline-offset-2">
                Index: {feed.price !== null ? formatPrice(feed.price * 0.9998) : '—'}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-6 hidden md:flex">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-white/40 font-medium">24h Change</span>
              <span className={`flex text-xs font-semibold ${changeColor} items-center gap-1`}>
                <span>{feed.change24h !== null ? formatPrice(feed.change24h) : '—'}</span>
                <span>{feed.changePercent24h !== null ? `${feed.changePercent24h >= 0 ? '+' : ''}${feed.changePercent24h}%` : '—'}</span>
              </span>
            </div>
            <div className="flex text-xs flex-col gap-0.5">
              <span className="text-[10px] text-white/40 font-medium">24h High</span>
              <span className="font-semibold text-white/90">{formatPrice(feed.high24h) ?? '—'}</span>
            </div>
            <div className="flex text-xs flex-col gap-0.5">
              <span className="text-[10px] text-white/40 font-medium">24h Low</span>
              <span className="font-semibold text-white/90">{formatPrice(feed.low24h) ?? '—'}</span>
            </div>
            <div className="flex text-xs flex-col gap-0.5">
              <span className="text-[10px] text-white/40 font-medium underline decoration-dashed decoration-white/20">Funding/Countdown</span>
              <span className="font-semibold text-primary">
                {feed.fundingRate !== null ? `${(feed.fundingRate * 100).toFixed(4)}%` : '0.0100%'}
                {' / '}{fundingCountdown}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span className={`text-xs font-semibold flex items-center gap-1.5 ${feed.isConnected ? 'text-success-6' : 'text-white/40'}`}>
            <span className={clsx('w-2 h-2 rounded-full', feed.isConnected ? 'bg-success-6 animate-pulse-glow' : 'bg-white/20')} />
            {feed.isConnected ? 'Live' : 'Connecting'}
          </span>
        </div>
      </div>

            <div className="hidden min-[1150px]:grid lg:grid-cols-[1fr_250px_320px] gap-1 px-1 flex-1 pr-1 pb-0 min-h-0 relative">
        {/* MOBILE: Floating Order Book Button */}
        <button className="min-[1150px]:hidden fixed bottom-[90px] right-4 z-40 bg-[#1c1e27] border border-white/[0.08] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg tap-scale flex items-center gap-2" onClick={() => setOrderBookOpen(true)}>
          <span>Order Book</span>
        </button>
        <div className="flex flex-col gap-1 overflow-hidden min-w-0 min-[1150px]:col-start-1">
          <div className={clsx("bg-[#181a20] rounded relative flex flex-col transition-all duration-300", chartExpanded ? "h-[450px]" : "h-[280px] min-[1150px]:min-h-[500px]")}>
            <CandlestickChart
              symbol={selectedPair}
              market="futures"
              orderLevels={chartOrderLevels}
              priceRange={{ min: feed.low24h, max: feed.high24h }}
              orderBook={orderBook}
            />
            <button 
              onClick={() => setChartExpanded(!chartExpanded)}
              className="min-[1150px]:hidden absolute bottom-2 right-2 w-8 h-8 bg-black/50 backdrop-blur border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:text-white"
            >
              {chartExpanded ? <IoChevronUp /> : <IoChevronDown />}
            </button>
          </div>

          <div className="hidden min-[1150px]:flex bg-[#181a20] rounded overflow-hidden flex-col h-[360px]">
            <Tabs
              classNames={{
                tab: '!pb-2 !pt-3 hover:!bg-transparent hover:!border-0 data-[active]:!border-b-[2px] data-[active]:!border-primary data-[active]:!text-primary !border-b-[2px] !border-transparent !rounded-none !text-xs !font-semibold text-white/50',
                list: '!flex !items-center border-b border-white/[0.06] px-4 shrink-0',
                panel: 'flex-1 flex flex-col min-h-0 overflow-hidden',
                root: '!flex !flex-col !min-h-0 !h-full',
              }}
              defaultValue="positions"
            >
              <div className="flex items-center justify-between shrink-0">
                <TabsList>
                  <TabsTab value="positions">Positions({futuresPositions.length})</TabsTab>
                  <TabsTab value="open">Open Orders({futuresOpenOrders?.length ?? 0})</TabsTab>
                  <TabsTab value="orders">Order History</TabsTab>
                  <TabsTab value="tradeHistory">Trade History</TabsTab>
                </TabsList>
                <div className="pr-4">
                  <Checkbox
                    classNames={{
                      label: '!text-[10px] !text-white/40',
                      input: '!border-white/20 !bg-transparent checked:!bg-primary',
                    }}
                    label="Hide Other Pairs"
                  />
                </div>
              </div>
              <TabsPanel value="positions">
                {!futuresPositions || futuresPositions.length === 0 ? (
                  <div className="flex-1 min-h-[150px] flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-white/30">You have no open positions.</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
                    <Table classNames={{
                      table: "min-w-[1100px] w-full",
                      th: "!text-[10px] uppercase tracking-wide !text-white/40 !border-b !border-white/[0.05] !py-3 !font-medium whitespace-nowrap",
                      td: "!text-sm !text-white/80 !border-b !border-white/[0.03] !py-3 whitespace-nowrap",
                      tr: "hover:!bg-white/[0.02] transition-colors"
                    }}>
                      <thead>
                        <TableTr>
                          <TableTh className="!pl-4">Pair</TableTh>
                          <TableTh>Side</TableTh>
                          <TableTh>Size</TableTh>
                          <TableTh>Entry Price</TableTh>
                          <TableTh>Mark Price</TableTh>
                          <TableTh>Margin</TableTh>
                          <TableTh>Unrealized PNL (ROE%)</TableTh>
                          <TableTh>TP / SL</TableTh>
                          <TableTh>Details</TableTh>
                          <TableTh className="!pr-4 !text-right">Action</TableTh>
                        </TableTr>
                      </thead>
                      <tbody>
                        {[...futuresPositions]
                          .sort((a: any, b: any) => {
                            // Fully stable sort: pair → side → leverage → entryPrice → size → id
                            const pairA = a.pair || '';
                            const pairB = b.pair || '';
                            if (pairA !== pairB) return pairA.localeCompare(pairB);
                            // Sort side: long before short
                            const sideA = (a.side || '').toLowerCase();
                            const sideB = (b.side || '').toLowerCase();
                            if (sideA !== sideB) return sideA.localeCompare(sideB);
                            // Then by leverage
                            if ((a.leverage || 0) !== (b.leverage || 0)) return (a.leverage || 0) - (b.leverage || 0);
                            // Then by entry price
                            const epA = Number(a.price || a.entryPrice || a.entry_price || 0);
                            const epB = Number(b.price || b.entryPrice || b.entry_price || 0);
                            if (epA !== epB) return epA - epB;
                            // Then by size
                            const szA = Number(a.quantity ?? a.size ?? 0);
                            const szB = Number(b.quantity ?? b.size ?? 0);
                            if (szA !== szB) return szA - szB;
                            // Final tiebreaker: id string
                            return String(a.id || a._id || '').localeCompare(String(b.id || b._id || ''));
                          })
                          .map((pos: any, idx: number) => {
                          const {
                            pair, isLong, size, entryPrice, markPrice, leverage, margin, pnl, roe, tp, sl,
                          } = resolveFuturesPosition(pos, feed, selectedPair);
                          const positionId = getFuturesPositionId(pos);

                          // Create a stable key combining available unique fields
                          const stableKey = pos.id || pos._id || pos.position_id || `${pair}-${pos.side}-${size}-${entryPrice}-${leverage}-${idx}`;
                          const pnlColor = pnl >= 0 ? "text-emerald-400" : "text-red-400";
                          const pnlSign = pnl >= 0 ? "+" : "";

                          return (
                            <TableTr key={stableKey}>
                              <TableTd className="!pl-4 font-bold text-white">{pair}</TableTd>
                              <TableTd>
                                <span className={clsx("text-xs font-bold uppercase px-1.5 py-0.5 rounded", isLong ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400")}>
                                  {pos.side} <span className="text-white/40 ml-1">{leverage}x</span>
                                </span>
                              </TableTd>
                              <TableTd className="font-mono">{size.toLocaleString()}</TableTd>
                              <TableTd className="font-mono">${entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</TableTd>
                              <TableTd className="font-mono">${markPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</TableTd>
                              <TableTd className="font-mono">{margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableTd>
                              <TableTd className="font-mono">
                                <div className="flex flex-col gap-0.5">
                                  <span className={clsx("font-bold text-[13px]", pnlColor)}>{pnlSign}{pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  <span className={clsx("text-[10px]", pnlColor)}>{pnlSign}{roe.toFixed(2)}%</span>
                                </div>
                              </TableTd>
                              <TableTd className="font-mono">
                                <div className="flex flex-col gap-1 text-[11px]">
                                  <span className="text-emerald-400">TP: {tp ?? '—'}</span>
                                  <span className="text-red-400">SL: {sl ?? '—'}</span>
                                </div>
                              </TableTd>
                              <TableTd className="whitespace-normal">{renderFuturesPositionDetails(pos)}</TableTd>
                              <TableTd className="!pr-4 !text-right">
                                <div className="flex justify-end gap-1.5">
                                   <button
                                    onClick={() => {
                                      let qty = '';
                                      modals.open({
                                        ...DEFAULT_MODAL_SETTINGS,
                                        size: 'lg',
                                        title: <span className="text-white font-bold text-base">Partial Close</span>,
                                        styles: POSITION_MODAL_STYLES,
                                        children: (
                                          <div className="flex flex-col gap-4">
<p className="text-xs text-white/50">Current size: <span className="text-white font-semibold">{size} {pair.split('/')[0]}</span></p>
                                            <TextInput
                                              label="Close Quantity"
                                              placeholder={`Max ${size}`}
                                              onChange={(e) => { qty = e.currentTarget.value; }}
                                            />
                                            <button
                                              className="w-full h-10 mt-1 rounded bg-amber-500/80 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
                                              onClick={() => {
                                                if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) return;
                                                partialClosePosition({ positionId, close_quantity: qty });
                                              }}
                                            >
                                              Confirm Partial Close
                                            </button>
                                          </div>
                                        ),
                                      });
                                    }}
                                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 px-2 py-1 bg-amber-400/10 hover:bg-amber-400/20 rounded transition-colors"
                                  >
                                    Partial
                                  </button>
                                  <button
                                    onClick={() => {
                                      let tp = pos.takeProfitPrice ?? pos.take_profit_price ?? pos.takeProfit ?? pos.take_profit ?? '';
                                      let sl = pos.stopLossPrice ?? pos.stop_loss_price ?? pos.stopLoss ?? pos.stop_loss ?? '';
                                      modals.open({
                                        ...DEFAULT_MODAL_SETTINGS,
                                        size: 'lg',
                                        title: <span className="text-white font-bold text-base">Update TP/SL</span>,
                                        styles: POSITION_MODAL_STYLES,
                                        children: (
                                          <div className="flex flex-col gap-4">
                                            <TextInput
                                              label="Take Profit Price"
                                              placeholder="Enter target price"
                                              defaultValue={tp}
                                              onChange={(e) => { tp = e.currentTarget.value; }}
                                            />
                                            <TextInput
                                              label="Stop Loss Price"
                                              placeholder="Enter trigger price"
                                              defaultValue={sl}
                                              onChange={(e) => { sl = e.currentTarget.value; }}
                                            />
                                            <button
                                              className="w-full h-10 mt-2 rounded bg-primary text-white text-sm font-semibold"
                                              onClick={() => updateTPSL({ positionId, take_profit_price: tp, stop_loss_price: sl })}
                                            >
                                              Confirm Update
                                            </button>
                                          </div>
                                        ),
                                      });
                                    }}
                                    className="text-[11px] font-semibold text-white/60 hover:text-white px-2 py-1 bg-white/5 rounded"
                                  >
                                    TP/SL
                                  </button>
                                  <button
                                    onClick={() => positionId && closePositionById(positionId)}
                                    disabled={!positionId || closingPositionIds.has(positionId)}
                                    className="text-[11px] font-semibold text-primary hover:underline px-2 py-1 bg-primary/10 rounded disabled:opacity-50"
                                  >
                                    {closingPositionIds.has(positionId) ? "Closing..." : "Close"}
                                  </button>
                                </div>
                              </TableTd>
                            </TableTr>
                          );
                        })}
                      </tbody>
                    </Table>
                    {/* uPNL Summary Footer */}
                    {futuresPositions.length > 0 && (() => {
                      const totalPnl = futuresPositions.reduce((sum: number, pos: any) => {
                        return sum + resolveFuturesPosition(pos, feed, selectedPair).pnl;
                      }, 0);
                      const totalMargin = futuresPositions.reduce((sum: number, pos: any) => {
                        return sum + resolveFuturesPosition(pos, feed, selectedPair).margin;
                      }, 0);
                      const equity = walletBalanceUsd + totalPnl;
                      const pnlColor = totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400';
                      const pnlSign = totalPnl >= 0 ? '+' : '';
                      return (
                        <div className="border-t border-white/[0.06] px-4 py-3 flex items-center justify-between bg-white/[0.01]">
                          <div className="flex items-center gap-6 text-xs">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-white/40 uppercase tracking-wide" title="Unrealised PnL: profit/loss on open positions at current mark price">Total uPNL</span>
                              <span className={`font-bold tabular-nums ${pnlColor}`}>{pnlSign}{totalPnl.toFixed(4)} USDT</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] text-white/40 uppercase tracking-wide" title="Total initial margin locked across all open positions">Margin Used</span>
                              <span className="font-semibold text-white/80 tabular-nums">{totalMargin.toFixed(4)} USDT</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="flex items-center gap-1 text-[10px] text-white/40 uppercase tracking-wide" title="Wallet Balance + Unrealised PnL. Higher than Available because margin is locked.">
                                Account Equity
                                <button
                                  type="button"
                                  onClick={refreshBalances}
                                  aria-label="Refresh futures account balance"
                                  title="Refresh balance"
                                  className="text-white/40 hover:text-white transition-colors"
                                >
                                  <MdRefresh size={13} className={isRefreshing ? "animate-spin" : ""} />
                                </button>
                              </span>
                              <span className="font-semibold text-white/80 tabular-nums">{equity.toFixed(4)} USDT</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </TabsPanel>
              <TabsPanel value="open">
                {!futuresOpenOrders || futuresOpenOrders.length === 0 ? (
                  <div className="flex-1 min-h-[150px] flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-white/30">You have no open orders.</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-auto">
                    <Table classNames={{ table: "min-w-[600px]", th: "!text-[10px] uppercase tracking-wide !text-white/40 !border-b !border-white/[0.05] !py-3 !font-medium", td: "!text-sm !text-white/80 !border-b !border-white/[0.03] !py-3", tr: "hover:!bg-white/[0.02] transition-colors" }}>
                      <thead>
                        <TableTr>
                          <TableTh className="!pl-4">Pair</TableTh>
                          <TableTh>Type</TableTh>
                          <TableTh>Side</TableTh>
                          <TableTh>Price</TableTh>
                          <TableTh>Quantity</TableTh>
                          <TableTh>Filled</TableTh>
                          <TableTh className="!pr-4 !text-right">Action</TableTh>
                        </TableTr>
                      </thead>
                      <tbody>
                        {futuresOpenOrders.map((ord: any, idx: number) => {
                          const pair = ord.pair || `${ord.base || ''}/${ord.quote || 'USDT'}`;
                          const isLong = ord.side?.toLowerCase() === 'long' || ord.side?.toLowerCase() === 'buy';
                          return (
                            <TableTr key={ord.id || idx}>
                              <TableTd className="!pl-4 font-bold text-white">{pair}</TableTd>
                              <TableTd className="capitalize">{ord.type || ord.orderType || '—'}</TableTd>
                              <TableTd>
                                <span className={clsx("text-xs font-bold uppercase px-1.5 py-0.5 rounded", isLong ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400")}>{ord.side}</span>
                              </TableTd>
                              <TableTd className="font-mono">${Number(ord.price || 0).toLocaleString()}</TableTd>
                              <TableTd className="font-mono">{Number(ord.quantity || ord.size || 0).toLocaleString()}</TableTd>
                              <TableTd className="font-mono text-white/50">{Number(ord.filled || ord.filledQty || 0).toLocaleString()}</TableTd>
                              <TableTd className="!pr-4 !text-right">
                                 <button onClick={() => cancelOrder(ord.id)} className="text-[11px] font-semibold text-red-400 hover:underline px-2 py-1 bg-red-400/10 rounded">Cancel</button>
                              </TableTd>
                            </TableTr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </TabsPanel>
              <TabsPanel value="orders">
                {!futuresOrderHistory || futuresOrderHistory.length === 0 ? (
                  <div className="flex-1 min-h-[150px] flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-white/30">No order history.</p>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-auto">
                    <Table classNames={{ table: "min-w-[600px]", th: "!text-[10px] uppercase tracking-wide !text-white/40 !border-b !border-white/[0.05] !py-3 !font-medium", td: "!text-sm !text-white/80 !border-b !border-white/[0.03] !py-3", tr: "hover:!bg-white/[0.02] transition-colors" }}>
                      <thead>
                        <TableTr>
                          <TableTh className="!pl-4">Pair</TableTh>
                          <TableTh>Type</TableTh>
                          <TableTh>Side</TableTh>
                          <TableTh>Price</TableTh>
                          <TableTh>Quantity</TableTh>
                          <TableTh>Status</TableTh>
                          <TableTh className="!pr-4">Date</TableTh>
                        </TableTr>
                      </thead>
                      <tbody>
                        {futuresOrderHistory.map((ord: any, idx: number) => {
                          const pair = ord.pair || `${ord.base || ''}/${ord.quote || 'USDT'}`;
                          const isLong = ord.side?.toLowerCase() === 'long' || ord.side?.toLowerCase() === 'buy';
                          return (
                            <TableTr key={ord.id || idx}>
                              <TableTd className="!pl-4 font-bold text-white">{pair}</TableTd>
                              <TableTd className="capitalize">{ord.type || ord.orderType || '—'}</TableTd>
                              <TableTd>
                                <span className={clsx("text-xs font-bold uppercase px-1.5 py-0.5 rounded", isLong ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400")}>{ord.side}</span>
                              </TableTd>
                              <TableTd className="font-mono">${Number(ord.price || 0).toLocaleString()}</TableTd>
                              <TableTd className="font-mono">{Number(ord.quantity || ord.size || 0).toLocaleString()}</TableTd>
                              <TableTd>
                                <span className={clsx("text-xs font-medium capitalize", ord.status === 'filled' ? 'text-emerald-400' : ord.status === 'cancelled' ? 'text-red-400' : 'text-white/50')}>{ord.status || '—'}</span>
                              </TableTd>
                              <TableTd className="!pr-4 text-white/40 text-xs">{ord.createdAt ? new Date(ord.createdAt).toLocaleString() : '—'}</TableTd>
                            </TableTr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </TabsPanel>
              <TabsPanel value="tradeHistory">
                <div className="flex-1 min-h-0 overflow-auto">
                  <TradeRecordsList trades={tradeHistory} isLoading={tradeHistoryLoading} emptyMessage="No trade history" />
                </div>
              </TabsPanel>
            </Tabs>
          </div>
        </div>

        <OrderBookTabs
          className="hidden min-[1150px]:flex rounded min-h-0"
          buyOrders={orderBook.buyOrders}
          sellOrders={orderBook.sellOrders}
          recentTrades={recentTrades}
          recentTradesLoading={recentTradesLoading}
          base={baseAsset}
          quote={quoteAsset}
          currentPrice={feed.price}
          buyPercentage={orderBook.buyPercentage}
          sellPercentage={orderBook.sellPercentage}
          isConnected={orderBook.isConnected}
          lastUpdated={orderBook.lastUpdated}
          onSelectPrice={(price) => {
            setFuturesPrice(price);
            priceUserEditedRef.current = true;
          }}
        />
        <div className="hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] text-sm text-white/90 font-semibold flex items-center justify-between">
            <span>Order Book</span>
            <div className="flex gap-2">
              <button className="w-5 h-5 rounded bg-white/10 flex flex-col items-center justify-center gap-px opacity-100 hover:bg-white/20 transition-colors">
                <span className="w-3 h-[2px] bg-error-1" />
                <span className="w-3 h-[2px] bg-success-6" />
              </button>
              <button className="w-5 h-5 rounded bg-transparent flex flex-col items-center justify-center gap-px opacity-50 hover:bg-white/10 transition-colors">
                <span className="w-3 h-[2px] bg-success-6" />
                <span className="w-3 h-[2px] bg-success-6" />
              </button>
              <button className="w-5 h-5 rounded bg-transparent flex flex-col items-center justify-center gap-px opacity-50 hover:bg-white/10 transition-colors">
                <span className="w-3 h-[2px] bg-error-1" />
                <span className="w-3 h-[2px] bg-error-1" />
              </button>
            </div>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden p-1">
            <div className="grid grid-cols-3 px-3 py-1 mb-1">
              <span className="text-[10px] font-medium text-white/40">Price(USDT)</span>
              <span className="text-[10px] font-medium text-white/40 text-right">Qty({baseAsset})</span>
              <span className="text-[10px] font-medium text-white/40 text-right">Total</span>
            </div>

            {orderBook.sellOrders.length === 0 && orderBook.buyOrders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-xs text-white/30 font-medium">No order data</span>
              </div>
            ) : (
              <div className="flex flex-col flex-1">
                <div className="flex flex-col justify-end flex-1 overflow-hidden gap-[2px]">
                  {[...orderBook.sellOrders].reverse().map((order, i) => {
                    const widthPercent = Math.min((order.quantity / maxAskVol) * 100, 100);
                    return (
                      <button
                        type="button"
                        key={`ask-${i}`}
                        onClick={() => { setFuturesPrice(order.price); priceUserEditedRef.current = true; }}
                        className="relative grid grid-cols-3 px-3 py-[2px] overflow-hidden cursor-pointer hover:bg-white/[0.02]"
                      >
                        <div className="absolute top-0 right-0 bottom-0 bg-error-1/[0.08] transition-all duration-300" style={{ width: `${widthPercent}%` }} />
                        <span className="text-[11px] font-mono tabular-nums font-semibold text-error-1 z-10">{order.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[11px] font-mono tabular-nums font-medium text-white/80 text-right z-10">{order.quantity.toFixed(4)}</span>
                        <span className="text-[11px] font-mono tabular-nums text-white/40 text-right z-10">{(order.price * order.quantity).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                      </button>
                    );
                  })}
                </div>

                {orderBook.sellOrders.length > 0 && orderBook.buyOrders.length > 0 && (() => {
                  const lowestAsk = Math.min(...orderBook.sellOrders.map((o) => o.price));
                  const highestBid = Math.max(...orderBook.buyOrders.map((o) => o.price));
                  const spread = +(lowestAsk - highestBid).toFixed(2);
                  return (
                    <div className="py-2.5 px-3 flex items-center justify-between border-y border-white/[0.04] my-2">
                      <span className={clsx('text-base font-bold font-mono tabular-nums', changeColor)}>
                        {feed.price !== null ? formatPrice(feed.price) : '—'}
                      </span>
                      <span className="text-[10px] font-medium text-white/40">Spread {spread}</span>
                    </div>
                  );
                })()}

                <div className="flex flex-col flex-1 overflow-hidden gap-[2px]">
                  {orderBook.buyOrders.map((order, i) => {
                    const widthPercent = Math.min((order.quantity / maxBidVol) * 100, 100);
                    return (
                      <button
                        type="button"
                        key={`bid-${i}`}
                        onClick={() => { setFuturesPrice(order.price); priceUserEditedRef.current = true; }}
                        className="relative grid grid-cols-3 px-3 py-[2px] overflow-hidden cursor-pointer hover:bg-white/[0.02]"
                      >
                        <div className="absolute top-0 right-0 bottom-0 bg-success-6/[0.08] transition-all duration-300" style={{ width: `${widthPercent}%` }} />
                        <span className="text-[11px] font-mono tabular-nums font-semibold text-success-6 z-10">{order.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-[11px] font-mono tabular-nums font-medium text-white/80 text-right z-10">{order.quantity.toFixed(4)}</span>
                        <span className="text-[11px] font-mono tabular-nums text-white/40 text-right z-10">{(order.price * order.quantity).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#181a20] rounded flex flex-col flex-1 p-4 overflow-auto max-[1150px]:min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Popover classNames={{ dropdown: '!bg-[#181a20] !border-white/[0.06] !px-1 !pt-3 !pb-2' }}>
                <PopoverTarget>
                  <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 transition-colors rounded flex items-center gap-1">
                    <span className="text-xs font-bold text-white/90">{marginMode === 'cross' ? 'Cross' : 'Isolated'}</span>
                    <MdKeyboardArrowDown className="text-white/50" />
                  </button>
                </PopoverTarget>
                <PopoverDropdown>
                  <div className="flex gap-2 flex-col">
                    <span className="pl-2 text-white/40 text-xs">Margin Type</span>
                    <div className="w-[120px] grid grid-rows-2 rounded border border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => handleSetFuturesMode('cross')}
                        className={clsx(
                          'h-8 flex cursor-pointer hover:bg-white/5 items-center border-b border-b-white/[0.06] px-3 text-xs font-bold',
                          marginMode === 'cross' ? 'text-white/90 bg-white/5' : 'text-white/50'
                        )}
                      >
                        Cross
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetFuturesMode('isolated')}
                        className={clsx(
                          'h-8 flex cursor-pointer hover:bg-white/5 items-center px-3 text-xs font-bold',
                          marginMode === 'isolated' ? 'text-white/90 bg-white/5' : 'text-white/50'
                        )}
                      >
                        Isolated
                      </button>
                    </div>
                  </div>
                </PopoverDropdown>
              </Popover>

              <Popover classNames={{ dropdown: '!bg-[#181a20] !border-white/[0.06] !p-4' }}>
                <PopoverTarget>
                  <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 transition-colors rounded flex items-center gap-1">
                    <span className="text-xs font-bold text-white/90">{leverage}x</span>
                    <MdKeyboardArrowDown className="text-white/50" />
                  </button>
                </PopoverTarget>
                <PopoverDropdown>
                  <div className="w-[220px] flex flex-col gap-3">
                    <span className="text-xs font-medium text-white/40">Adjust Leverage</span>
                    <Slider
                      classNames={{
                        track: '!h-1 before:!h-1 bg-white/10',
                        bar: '!bg-primary',
                        thumb: '!border-2 !border-primary !bg-white',
                      }}
                      value={leverage}
                      onChange={setLeverage}
                      onChangeEnd={(val) => handleSetFuturesLeverage(val)}
                      min={1}
                      max={marginMode === 'cross' ? 50 : 100}
                    />
                    <div className="grid grid-cols-5 gap-1">
                      {LEVERAGE_PRESETS.filter((value) => value <= (marginMode === 'cross' ? 50 : 100)).map((value) => (
                        <button
                          type="button"
                          key={value}
                          onClick={() => {
                            setLeverage(value);
                            handleSetFuturesLeverage(value);
                          }}
                          className={clsx(
                            'rounded py-1 text-[10px] font-bold transition-colors',
                            leverage === value ? 'bg-primary/20 text-primary' : 'bg-white/[0.05] text-white/55 hover:text-white/85'
                          )}
                        >
                          {value}x
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverDropdown>
              </Popover>
            </div>
            <MdMoreVert className="text-white/50 hover:text-white cursor-pointer" />
          </div>

          <Tabs
            classNames={{
              tab: '!p-0 hover:!bg-transparent text-xs font-bold text-white/50 hover:!text-white/80 data-[active]:!text-white !border-0',
              list: '!flex !items-center before:!border-0 !gap-6 mb-4',
              root: '!flex !flex-col',
            }}
            value={orderType}
            onChange={(value) => setOrderType((value as OrderType) ?? 'limit')}
          >
            <TabsList>
              <TabsTab value="limit">Limit</TabsTab>
              <TabsTab value="market">Market</TabsTab>
              <TabsTab value="stop">Stop-limit</TabsTab>
            </TabsList>
            <TabsPanel value="limit">{tradeFormPanel}</TabsPanel>
            <TabsPanel value="market">{tradeFormPanel}</TabsPanel>
            <TabsPanel value="stop">{tradeFormPanel}</TabsPanel>
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
            <span className="text-white/40">Funding</span>
            <span className="text-primary font-semibold tabular-nums">{feed.fundingRate !== null ? `${(feed.fundingRate * 100).toFixed(4)}%` : "0.0100%"}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/40">Countdown</span>
            <span className="text-primary font-semibold tabular-nums">{fundingCountdown}</span>
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
                symbol={selectedPair}
                market="futures"
                orderLevels={chartOrderLevels}
                priceRange={{ min: feed.low24h, max: feed.high24h }}
                orderBook={orderBook}
              />
            </div>
            
            {/* Bottom Action Bar */}
            <div className="bg-[#181a20] py-4 px-6 flex justify-center gap-4">
              <button onClick={() => setQuickOrderOpen(true)} className="flex-1 max-w-[160px] bg-[#2ecc71] text-white font-bold rounded-full py-2.5 text-sm active:scale-95 transition-transform">
                Long
              </button>
              <button onClick={() => setQuickOrderOpen(true)} className="flex-1 max-w-[160px] bg-[#e74c3c] text-white font-bold rounded-full py-2.5 text-sm active:scale-95 transition-transform">
                Short
              </button>
            </div>

            <OrderBookTabs
              className="min-[1150px]:hidden shrink-0"
              fixedHeight={320}
              buyOrders={orderBook.buyOrders}
              sellOrders={orderBook.sellOrders}
              recentTrades={recentTrades}
              recentTradesLoading={recentTradesLoading}
              base={baseAsset}
              quote="USDT"
              currentPrice={feed.price}
              buyPercentage={orderBook.buyPercentage}
              sellPercentage={orderBook.sellPercentage}
              isConnected={orderBook.isConnected}
              lastUpdated={orderBook.lastUpdated}
              onSelectPrice={(price) => {
                setFuturesPrice(price);
                priceUserEditedRef.current = true;
              }}
            />
            {/* Legacy mobile book markup kept hidden while the shared panel handles both tabs. */}
            <Tabs className="hidden" defaultValue="orderbook" classNames={{
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
                          <div key={`bid-${i}`} onClick={() => setFuturesPrice(order.price)} className="flex justify-between relative py-0.5 px-1 cursor-pointer">
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
                          <div key={`ask-${i}`} onClick={() => setFuturesPrice(order.price)} className="flex justify-between relative py-0.5 px-1 cursor-pointer">
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
                <div className="flex flex-col p-2">
                  {renderRecentTrades(30)}
                </div>
              </TabsPanel>
            </Tabs>

          </div>
        ) : (
          // --- TRADE VIEW ---
          <div className="flex flex-col flex-1 overflow-auto custom-scrollbar">
            <div className="flex bg-[#181a20] flex-1">
              {/* Left Side: Trade Form */}
              <div className="w-full px-3 py-4">
                {tradeFormPanel}
              </div>

              {/* Right Side: Stacked Order Book */}
              <div className="hidden">
                <div className="flex justify-between text-[10px] text-white/40 mb-2 px-1">
                  <span>Price</span><span>Qty</span>
                </div>
                {/* Asks */}
                <div className="flex flex-col justify-end flex-1 overflow-hidden gap-[2px]">
                  {[...orderBook.sellOrders].reverse().slice(-10).map((order, i) => {
                    const w = Math.min((order.quantity / maxAskVol) * 100, 100);
                    return (
                      <div key={`ask-${i}`} onClick={() => setFuturesPrice(order.price)} className="flex justify-between relative py-0.5 px-1 cursor-pointer">
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
                    {feed.price !== null ? formatPrice(feed.price) : "—"}
                  </span>
                  <span className="text-[10px] text-white/40">
                    ${feed.price !== null ? formatPrice(feed.price) : "—"}
                  </span>
                </div>

                {/* Bids */}
                <div className="flex flex-col flex-1 overflow-hidden gap-[2px]">
                  {orderBook.buyOrders.slice(0, 10).map((order, i) => {
                    const w = Math.min((order.quantity / maxBidVol) * 100, 100);
                    return (
                      <div key={`bid-${i}`} onClick={() => setFuturesPrice(order.price)} className="flex justify-between relative py-0.5 px-1 cursor-pointer">
                        <div className="absolute top-0 right-0 bottom-0 bg-success-6/[0.08]" style={{ width: `${w}%` }} />
                        <span className="text-[11px] font-mono text-success-6 z-10">{order.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        <span className="text-[11px] font-mono text-white/80 z-10">{order.quantity.toFixed(4)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <OrderBookTabs
              className="min-[1150px]:hidden shrink-0"
              fixedHeight={320}
              buyOrders={orderBook.buyOrders}
              sellOrders={orderBook.sellOrders}
              recentTrades={recentTrades}
              recentTradesLoading={recentTradesLoading}
              base={baseAsset}
              quote="USDT"
              currentPrice={feed.price}
              buyPercentage={orderBook.buyPercentage}
              sellPercentage={orderBook.sellPercentage}
              isConnected={orderBook.isConnected}
              lastUpdated={orderBook.lastUpdated}
              onSelectPrice={(price) => {
                setFuturesPrice(price);
                priceUserEditedRef.current = true;
              }}
            />

            {/* Positions & Orders Tabs */}
            <div className="bg-[#181a20] rounded flex flex-col mt-2 mb-[80px] h-[320px] overflow-hidden">
              <Tabs
                classNames={{
                  tab: "!pb-2 !pt-3 hover:!bg-transparent hover:!border-0 data-[active]:!border-b-[2px] data-[active]:!border-primary data-[active]:!text-primary !border-b-[2px] !border-transparent !rounded-none !text-xs !font-semibold text-white/50",
                  list: "!flex !items-center border-b border-white/[0.06] px-4 shrink-0",
                  panel: "flex-1 flex flex-col min-h-0 overflow-hidden",
                  root: "!flex !flex-col !min-h-0 !h-full",
                }}
                defaultValue="positions"
              >
                <TabsList>
                  <TabsTab value="positions">Positions ({futuresPositions.length})</TabsTab>
                  <TabsTab value="open-orders">Open Orders ({futuresOpenOrders?.length ?? 0})</TabsTab>
                  <TabsTab value="history">Order History</TabsTab>
                  <TabsTab value="tradeHistory">Trade History</TabsTab>
                </TabsList>
                <TabsPanel value="positions">
                  <div className="p-4 flex-1 min-h-0 overflow-y-auto flex flex-col">
                    {!futuresPositions || futuresPositions.length === 0 ? (
                      <div className="flex-1 min-h-[150px] flex flex-col items-center justify-center gap-2">
                        <p className="text-xs font-medium text-white/30">No open positions</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {futuresPositions.map((pos: any) => {
                          const { pair, isLong, size, entryPrice, markPrice, leverage, margin, pnl, roe, tp, sl } = resolveFuturesPosition(pos, feed, selectedPair);
                          const positionId = getFuturesPositionId(pos);
                          const pnlSign = pnl >= 0 ? '+' : '';
                          const pnlColor = pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
                          return (
                            <div key={pos.id || pos._id || `${pos.pair}-${pos.side}`} className="p-3 border border-white/[0.06] rounded-xl flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-white">{pair} <span className={`text-xs font-bold ${isLong ? 'text-emerald-400' : 'text-red-400'}`}>{pos.side?.toUpperCase()} {leverage}x</span></span>
                                <div className="text-right">
                                  <span className={`text-sm font-bold tabular-nums ${pnlColor}`}>{pnlSign}{pnl.toFixed(4)}</span>
                                  <span className={`block text-[10px] tabular-nums ${pnlColor}`}>{pnlSign}{roe.toFixed(2)}%</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                <div className="flex justify-between"><span className="text-white/40">Size</span><span className="text-white tabular-nums">{size}</span></div>
                                <div className="flex justify-between"><span className="text-white/40">Entry</span><span className="text-white tabular-nums">${entryPrice.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-white/40">Mark</span><span className="text-white tabular-nums">${markPrice.toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-white/40">Margin</span><span className="text-white tabular-nums">{margin.toFixed(2)}</span></div>
                                <div className="flex justify-between col-span-2"><span className="text-white/40">TP</span><span className="text-emerald-400 tabular-nums">{tp ?? '—'}</span></div>
                                <div className="flex justify-between col-span-2"><span className="text-white/40">SL</span><span className="text-red-400 tabular-nums">{sl ?? '—'}</span></div>
                              </div>
                              {renderFuturesPositionDetails(pos)}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    let qty = '';
                                    modals.open({
                                      ...DEFAULT_MODAL_SETTINGS,
                                      size: 'lg',
                                      title: <span className="text-white font-bold text-base">Partial Close</span>,
                                      styles: POSITION_MODAL_STYLES,
                                      children: (
                                        <div className="flex flex-col gap-4">
                                          <p className="text-xs text-white/50">Current size: <span className="text-white font-semibold">{size} {pair.split('/')[0]}</span></p>
                                          <TextInput
                                            label="Close Quantity"
                                            placeholder={`Max ${size}`}
                                            onChange={(e) => { qty = e.currentTarget.value; }}
                                          />
                                          <button
                                            className="w-full h-10 mt-1 rounded bg-amber-500/80 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
                                            onClick={() => {
                                              if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) return;
                                              partialClosePosition({ positionId, close_quantity: qty });
                                            }}
                                          >
                                            Confirm Partial Close
                                          </button>
                                        </div>
                                      ),
                                    });
                                  }}
                                  className="flex-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 px-2 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 rounded transition-colors"
                                >
                                  Partial
                                </button>
                                <button
                                  onClick={() => {
                                    let tp = pos.takeProfitPrice ?? pos.take_profit_price ?? pos.takeProfit ?? pos.take_profit ?? '';
                                    let sl = pos.stopLossPrice ?? pos.stop_loss_price ?? pos.stopLoss ?? pos.stop_loss ?? '';
                                    modals.open({
                                      ...DEFAULT_MODAL_SETTINGS,
                                      size: 'lg',
                                      title: <span className="text-white font-bold text-base">Update TP/SL</span>,
                                      styles: POSITION_MODAL_STYLES,
                                      children: (
                                        <div className="flex flex-col gap-4">
                                          <TextInput
                                            label="Take Profit Price"
                                            placeholder="Enter target price"
                                            defaultValue={tp}
                                            onChange={(e) => { tp = e.currentTarget.value; }}
                                          />
                                          <TextInput
                                            label="Stop Loss Price"
                                            placeholder="Enter trigger price"
                                            defaultValue={sl}
                                            onChange={(e) => { sl = e.currentTarget.value; }}
                                          />
                                          <button
                                            className="w-full h-10 mt-2 rounded bg-primary text-white text-sm font-semibold"
                                            onClick={() => updateTPSL({ positionId, take_profit_price: tp, stop_loss_price: sl })}
                                          >
                                            Confirm Update
                                          </button>
                                        </div>
                                      ),
                                    });
                                  }}
                                  className="flex-1 text-[11px] font-semibold text-white/60 hover:text-white px-2 py-1.5 bg-white/5 rounded"
                                >
                                  TP/SL
                                </button>
                                <button
                                  onClick={() => positionId && closePositionById(positionId)}
                                  disabled={!positionId || closingPositionIds.has(positionId)}
                                  className="flex-1 text-[11px] font-semibold text-primary hover:underline px-2 py-1.5 bg-primary/10 rounded disabled:opacity-50"
                                >
                                  {closingPositionIds.has(positionId) ? 'Closing...' : 'Close'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        <div className="border-t border-white/[0.06] pt-3 flex flex-col gap-1.5 text-xs">
                          {(() => {
                            const totalPnl = futuresPositions.reduce((sum: number, pos: any) => {
                              return sum + resolveFuturesPosition(pos, feed, selectedPair).pnl;
                            }, 0);
                            const totalMargin = futuresPositions.reduce((sum: number, pos: any) => {
                              return sum + resolveFuturesPosition(pos, feed, selectedPair).margin;
                            }, 0);
                            const equity = walletBalanceUsd + totalPnl;
                            const totalPnlColor = totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400';
                            const totalPnlSign = totalPnl >= 0 ? '+' : '';
                            return (
                              <>
                                <div className="flex justify-between"><span className="text-white/40">Total uPNL</span><span className={`font-bold tabular-nums ${totalPnlColor}`}>{totalPnlSign}{totalPnl.toFixed(4)} USDT</span></div>
                                <div className="flex justify-between"><span className="text-white/40">Margin Used</span><span className="font-semibold text-white/80 tabular-nums">{totalMargin.toFixed(4)} USDT</span></div>
                                <div className="flex justify-between">
                                  <span className="flex items-center gap-1 text-white/40">
                                    Account Equity
                                    <button
                                      type="button"
                                      onClick={refreshBalances}
                                      aria-label="Refresh futures account balance"
                                      title="Refresh balance"
                                      className="text-white/40 hover:text-white transition-colors"
                                    >
                                      <MdRefresh size={13} className={isRefreshing ? "animate-spin" : ""} />
                                    </button>
                                  </span>
                                  <span className="font-semibold text-white/80 tabular-nums">{equity.toFixed(4)} USDT</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsPanel>
                <TabsPanel value="open-orders">
                  <div className="p-4 flex-1 min-h-0 overflow-y-auto flex flex-col">
                    {!futuresOpenOrders || futuresOpenOrders.length === 0 ? (
                      <div className="flex-1 min-h-[150px] flex flex-col items-center justify-center gap-2">
                        <p className="text-xs font-medium text-white/30">No open orders</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {futuresOpenOrders.map((order: any) => {
                          const isLong = order.side?.toLowerCase() === 'long' || order.side?.toLowerCase() === 'buy';
                          return (
                            <div key={order.id} className="p-3 border border-white/[0.06] rounded-xl flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-white">{order.pair} <span className={`text-xs font-bold ${isLong ? 'text-emerald-400' : 'text-red-400'}`}>{order.side?.toUpperCase()}</span></span>
                                <button onClick={() => cancelOrder(order.id)} className="text-[11px] font-semibold text-red-400 px-2 py-1 bg-red-400/10 rounded">Cancel</button>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                <div className="flex justify-between"><span className="text-white/40">Type</span><span className="text-white capitalize">{order.type || '—'}</span></div>
                                <div className="flex justify-between"><span className="text-white/40">Price</span><span className="text-white tabular-nums">${Number(order.price || 0).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-white/40">Qty</span><span className="text-white tabular-nums">{Number(order.quantity || order.size || 0)}</span></div>
                                <div className="flex justify-between"><span className="text-white/40">Filled</span><span className="text-white tabular-nums">{Number(order.filled || 0)}</span></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsPanel>
                <TabsPanel value="history">
                  <div className="p-4 flex-1 min-h-0 overflow-y-auto flex flex-col">
                    {!futuresOrderHistory || futuresOrderHistory.length === 0 ? (
                      <div className="flex-1 min-h-[150px] flex flex-col items-center justify-center gap-2">
                        <p className="text-xs font-medium text-white/30">No order history</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {futuresOrderHistory.map((ord: any, idx: number) => {
                          const isLong = ord.side?.toLowerCase() === 'long' || ord.side?.toLowerCase() === 'buy';
                          return (
                            <div key={ord.id || idx} className="p-3 border border-white/[0.06] rounded-xl flex flex-col gap-2">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-sm font-bold text-white truncate">{ord.pair || `${ord.base || ''}/${ord.quote || 'USDT'}`} <span className={`text-[10px] font-bold uppercase ml-1 ${isLong ? 'text-emerald-400' : 'text-red-400'}`}>{ord.side}</span></span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${ord.status === 'filled' ? 'bg-emerald-400/15 text-emerald-400' : ord.status === 'cancelled' ? 'bg-red-400/15 text-red-400' : 'bg-white/10 text-white/50'}`}>{ord.status || '—'}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                <div className="flex justify-between"><span className="text-white/40">Type</span><span className="text-white capitalize">{ord.type || ord.orderType || '—'}</span></div>
                                <div className="flex justify-between"><span className="text-white/40">Price</span><span className="text-white tabular-nums">${Number(ord.price || 0).toLocaleString()}</span></div>
                                <div className="flex justify-between"><span className="text-white/40">Qty</span><span className="text-white tabular-nums">{Number(ord.quantity || ord.size || 0)}</span></div>
                                <div className="flex justify-between"><span className="text-white/40">Time</span><span className="text-white/60 text-right">{ord.createdAt ? new Date(ord.createdAt).toLocaleString() : '—'}</span></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsPanel>
                <TabsPanel value="tradeHistory">
                  <div className="p-4 flex-1 min-h-0 overflow-y-auto flex flex-col">
                    <TradeRecordsList trades={tradeHistory} isLoading={tradeHistoryLoading} emptyMessage="No trade history" />
                  </div>
                </TabsPanel>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      <MobileBottomSheet opened={quickOrderOpen} onClose={() => setQuickOrderOpen(false)} title="Quick Order">
        <div className="p-4 flex flex-col">
          {tradeFormPanel}
        </div>
      </MobileBottomSheet>

      <MobileBottomNav />
    </div>
  );
}

export default function FuturesTrades() {
  return (
    <PageSuspense fallback={<FuturesTradePageSkeleton />}>
      <FuturesTradesInner />
    </PageSuspense>
  );
}
