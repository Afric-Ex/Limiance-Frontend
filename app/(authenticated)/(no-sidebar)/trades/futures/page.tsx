'use client';

import { Search } from '@/src/components/icons/search';
import { Skeleton } from '@/src/components/shared/skeleton';
import { OpenFuturesModal } from '@/src/components/trades/open-futures-modal';
import { useMarketFeed } from '@/src/hooks/use-market-feed';
import { useOrderBook } from '@/src/hooks/use-order-book';
import { useRecentTrades } from '@/src/hooks/use-recent-trades';
import { OrderBookTabs } from '@/src/components/trades/order-book-tabs';
import { SpotPairHeader } from '@/src/components/trades/spot-pair-header';
import { TradingPanel } from '@/src/components/trades/trading-panel';
import { usePortfolioWs } from '@/src/hooks/use-portfolio-ws';
import { readList } from '@/src/lib/api-response';
import { getLatestTradePrice } from '@/src/lib/recent-trades';
import { errorMessageHandler } from '@/src/lib/error-handler';
import { successNotification } from '@/src/lib/notification-handler';
import { useUserStore } from '@/src/stores/user-store';
import { tradingService } from '@/src/services/trading';
import { placeFuturesOrderWs } from '@/src/lib/order-ws';
import { DEFAULT_MODAL_SETTINGS } from '@/src/utils/constants';
import {
  Checkbox,
  Loader,
  NumberInput,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Slider,
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
import { useSearchParams, useRouter } from 'next/navigation';
import { MdKeyboardArrowDown, MdMoreVert, MdRefresh } from 'react-icons/md';
import { MobileTopBar } from '@/src/components/shared/mobile-top-bar';
import { IoChevronDown, IoChevronUp, IoSwapHorizontal, IoBarChartOutline, IoListOutline } from 'react-icons/io5';
import { MobileBottomSheet } from '@/src/components/shared/mobile-bottom-sheet';
import { MobileBottomNav } from '@/src/components/shared/mobile-bottom-nav';
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { FuturesTradePageSkeleton } from "@/src/components/skeletons/trades";
import type { OrderLevel } from "@/src/components/trades/candlestick-chart";

const CandlestickChart = dynamic(
  () => import('@/src/components/trades/candlestick-chart'),
  { ssr: false, loading: () => <Skeleton variant="chart" height="100%" /> }
);

const LEVERAGE_PRESETS = [1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100];
const PERCENT_MARKS = [{ value: 25 }, { value: 50 }, { value: 75 }];

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
  const [chartLastPrice, setChartLastPrice] = useState<number | null>(null);
  const accountModalShownRef = useRef(false);
  const router = useRouter();
  const priceUserEditedRef = useRef(false); // true when user has manually typed a custom price
  const [chartExpanded, setChartExpanded] = useState(false);
  const [, setOrderBookOpen] = useState(false);
  const [mobileMode, setMobileMode] = useState<"trade" | "chart">("trade");
  const [mobileTradePanel, setMobileTradePanel] = useState<"order" | "book">("order");
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

  const { refetch: refetchOpenOrders } = useQuery({
    queryKey: ['futures-open-orders', selectedPair],
    queryFn: () => tradingService.fetchFuturesOpenOrders({ pair: selectedPair }),
    select: (res: unknown) => readList<Record<string, any>>(res),
    retry: false,
    throwOnError: false,
  });

  const { recentTrades, recentTradesLoading } = useRecentTrades(selectedPair, "futures");
  const latestTradePrice = getLatestTradePrice(recentTrades);
  const bestAsk = orderBook.sellOrders[0]?.price;
  const bestBid = orderBook.buyOrders[0]?.price;
  const orderBookMidPrice = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : bestAsk ?? bestBid ?? null;

  const isFeedPriceConsistent =
    feed.price != null &&
    feed.price > 0 &&
    (bestBid == null || bestAsk == null || (feed.price >= bestBid * 0.98 && feed.price <= bestAsk * 1.02));

  const effectiveMarketPrice =
    (latestTradePrice != null && latestTradePrice > 0 ? latestTradePrice : null) ??
    (chartLastPrice != null && chartLastPrice > 0 ? chartLastPrice : null) ??
    orderBookMidPrice ??
    (isFeedPriceConsistent ? feed.price : null) ??
    (feed.price != null && feed.price > 0 ? feed.price : null) ??
    null;
  const lastTradedPrice = latestTradePrice ?? chartLastPrice ?? feed.price ?? null;

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
          onExit={() => {
            modals.closeAll();
            router.push('/dashboard');
          }}
        />
      ),
      closeOnClickOutside: false,
      closeOnEscape: false,
      ...DEFAULT_MODAL_SETTINGS,
    });
  }, [hasFuturesAccount, user, router]);

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
    // Intentionally depend only on pair/type so live price ticks do not reset
    // the user's entered amounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPair, orderType]);

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

  const isPositive = (feed.changePercent24h ?? 0) >= 0;
  const changeColor = isPositive ? 'text-success-6' : 'text-error-1';

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
        ...(tpslEnabled && Number(takeProfit) > 0 ? { takeProfit: Number(takeProfit) } : {}),
        ...(tpslEnabled && Number(stopLoss) > 0 ? { stopLoss: Number(stopLoss) } : {}),
      };

      return placeFuturesOrderWs(payload);
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
          <span className="text-primary text-2xs">
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
          <span className="text-2xs text-white/40">
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
        title=""
        leftElement={
          <div className="flex items-center gap-1">
            <Popover width={300} position="bottom-start" shadow="md" opened={pairMenuOpen} onChange={setPairMenuOpen}>
              <PopoverTarget>
                <button
                  aria-label="Change trading pair"
                  onClick={() => setPairMenuOpen((v) => !v)}
                  className="flex items-center gap-1 px-1 py-0.5 rounded tap-scale"
                >
                  <IoSwapHorizontal size={16} className="text-white/40" />
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-body font-bold text-white/90 truncate">
                      {selectedPair}
                    </span>
                    <span className="text-primary text-2xs bg-primary/10 px-1 rounded shrink-0 whitespace-nowrap">Perp</span>
                  </div>
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
              market="futures"
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
          base={baseAsset}
          quote={quoteAsset}
          currentPrice={effectiveMarketPrice}
          dayChangePercent={feed.changePercent24h}
          buyPercentage={orderBook.buyPercentage}
          sellPercentage={orderBook.sellPercentage}
          isConnected={orderBook.isConnected}
          lastUpdated={orderBook.lastUpdated}
          onSelectPrice={(price) => {
            setFuturesPrice(price);
            priceUserEditedRef.current = true;
          }}
        />

        {/* Desktop trading panel: Positions / Open Orders / Order History / ... (spans under chart + order book) */}
        <div className="hidden min-[1150px]:flex flex-col min-w-0 min-h-[260px] max-h-[420px] col-span-2 col-start-1 row-start-3">
          <TradingPanel selectedPair={selectedPair} market="futures" className="flex-1 min-h-0" />
        </div>

        {/* COL 3: Trade Form (Responsive) */}
        <div className="bg-[#181a20] flex flex-col flex-1 p-4 overflow-auto max-[1150px]:min-h-[400px] min-[1150px]:col-start-3 min-[1150px]:row-start-1 min-[1150px]:row-span-3">
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
                            'rounded py-1 text-2xs font-bold transition-colors',
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
          <div className="flex justify-between items-center text-micro">
            <span className="text-white/40">24h High</span>
            <span className="text-white/90 font-semibold tabular-nums">{formatPrice(feed.high24h) ?? "—"}</span>
          </div>
          <div className="flex justify-between items-center text-micro">
            <span className="text-white/40">24h Low</span>
            <span className="text-white/90 font-semibold tabular-nums">{formatPrice(feed.low24h) ?? "—"}</span>
          </div>
          <div className="flex justify-between items-center text-micro">
            <span className="text-white/40">Funding</span>
            <span className="text-primary font-semibold tabular-nums">{feed.fundingRate !== null ? `${(feed.fundingRate * 100).toFixed(4)}%` : "0.0100%"}</span>
          </div>
          <div className="flex justify-between items-center text-micro">
            <span className="text-white/40">Countdown</span>
            <span className="text-primary font-semibold tabular-nums">{fundingCountdown}</span>
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
                market="futures"
                orderBook={orderBook}
                orderLevels={chartOrderLevels}
                priceRange={{ min: feed.low24h, max: feed.high24h }}
                lastPrice={lastTradedPrice}
                onLastPriceChange={setChartLastPrice}
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
              quote={quoteAsset}
              currentPrice={effectiveMarketPrice}
              buyPercentage={orderBook.buyPercentage}
              sellPercentage={orderBook.sellPercentage}
              isConnected={orderBook.isConnected}
              lastUpdated={orderBook.lastUpdated}
              onSelectPrice={(price) => {
                setFuturesPrice(price);
                priceUserEditedRef.current = true;
              }}
            />
          </div>
        ) : (
          // --- TRADE VIEW ---
          <div className="flex flex-col flex-1 min-h-0 bg-[#181a20] pb-[65px]">
            <div className="flex flex-1 min-h-[360px] flex-col gap-2 p-3 overflow-hidden min-[480px]:flex-row min-[480px]:gap-3">
              <div role="tablist" aria-label="Trading panels" className="grid shrink-0 grid-cols-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 min-[480px]:hidden">
                <button type="button" role="tab" aria-selected={mobileTradePanel === "order"} onClick={() => setMobileTradePanel("order")} className={clsx("rounded-md px-3 py-2 text-xs font-semibold transition-colors", mobileTradePanel === "order" ? "bg-white/[0.08] text-white" : "text-white/45")}>Place Order</button>
                <button type="button" role="tab" aria-selected={mobileTradePanel === "book"} onClick={() => setMobileTradePanel("book")} className={clsx("rounded-md px-3 py-2 text-xs font-semibold transition-colors", mobileTradePanel === "book" ? "bg-white/[0.08] text-white" : "text-white/45")}>Order Book</button>
              </div>
              <div className={clsx("min-h-0 min-w-0 flex-1 flex-col overflow-y-auto rounded-xl border border-white/[0.06] bg-[#181a20]", mobileTradePanel === "order" ? "flex" : "hidden", "min-[480px]:flex min-[480px]:flex-[1.5]")}>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#181a20]">
                  <div className="w-full px-3 py-4">{tradeFormPanel}</div>
                </div>
              </div>
              <div className={clsx("min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06]", mobileTradePanel === "book" ? "flex" : "hidden", "min-[480px]:flex min-[480px]:flex-1")}>
            <OrderBookTabs
              className="flex-1 min-h-0"
              buyOrders={orderBook.buyOrders}
              sellOrders={orderBook.sellOrders}
              recentTrades={recentTrades}
              recentTradesLoading={recentTradesLoading}
              base={baseAsset}
              quote={quoteAsset}
              currentPrice={effectiveMarketPrice}
              buyPercentage={orderBook.buyPercentage}
              sellPercentage={orderBook.sellPercentage}
              isConnected={orderBook.isConnected}
              lastUpdated={orderBook.lastUpdated}
              onSelectPrice={(price) => {
                setFuturesPrice(price);
                priceUserEditedRef.current = true;
              }}
            />
              </div>
            </div>

            {/* Mobile trading panel */}
            <TradingPanel selectedPair={selectedPair} market="futures" mobile className="rounded mt-2 min-h-[420px]" />
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
