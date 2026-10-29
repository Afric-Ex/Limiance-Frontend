"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tradingKeys, tradingService, type TradingMarket } from "@/src/services/trading";
import { cancelSpotOrderWs, closeFuturesPositionWs } from "@/src/lib/order-ws";
import { readList } from "@/src/lib/api-response";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { PositionsTable, buildPositionRows } from "@/src/components/trades/positions-table";
import {
  OrderHistoryTable,
  buildOrderHistoryRows,
  filterOrderHistoryRows,
  DATE_RANGES,
  type StatusFilter,
} from "@/src/components/trades/order-history-table";
import { useOrderHistory, ORDER_HISTORY_QUERY_KEY, type HistoryMarket } from "@/src/hooks/use-order-history";
import { Loader, Checkbox, Popover, PopoverTarget, PopoverDropdown, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import clsx from "clsx";
import { MdMoreVert, MdCalculate, MdKeyboardArrowDown, MdInfo, MdContentCopy } from "react-icons/md";
import { IoEyeOff } from "react-icons/io5";

interface TradingPanelProps {
  selectedPair: string;
  market?: TradingMarket;
  className?: string;
  mobile?: boolean;
}

type MainTab = "open_orders" | "positions" | "order_history" | "trade_history" | "assets" | "borrowings" | "tools" | "pnl";
type OrderTypeTab = "limit_market" | "conditional" | "tpsl" | "trailing_stop" | "oco" | "mmr_close" | "spread_trading";

export function TradingPanel({ selectedPair, market = "spot", className, mobile = false }: TradingPanelProps) {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("open_orders");
  const [historyDays, setHistoryDays] = useState<number>(7);
  const [historyStatus, setHistoryStatus] = useState<StatusFilter>("all");
  const [historyPage, setHistoryPage] = useState(1);
  const [activeOrderTypeTab, setActiveOrderTypeTab] = useState<OrderTypeTab>("limit_market");
  const [hideOtherPairs, setHideOtherPairs] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState("all");
  const [selectedMarket, setSelectedMarket] = useState("all");
  // Trade History specific filters
  const [tradeHistoryDays, setTradeHistoryDays] = useState<number>(7);
  const [tradeHistoryAllMarkets, setTradeHistoryAllMarkets] = useState(true);
  const [tradeHistoryInstrument, setTradeHistoryInstrument] = useState("all");
  
  const queryClient = useQueryClient();
  const { refreshBalances } = usePortfolioWs({});

  // Open Orders
  const { data: openOrders, isLoading: openOrdersLoading } = useQuery({
    queryKey: tradingKeys.openOrders(hideOtherPairs ? selectedPair : undefined),
    queryFn: () => tradingService.fetchOpenOrders({ pair: hideOtherPairs ? selectedPair : undefined }),
    select: (res: unknown) => readList<Record<string, any>>(res),
    retry: false,
    refetchInterval: 5000,
  });

  // Order History: unified endpoint returns all markets or just this market based on the filter.
  const historyMarketType = selectedMarket === "all" ? "all" : (market as "spot" | "margin" | "futures");
  const { data: historyPages = [], isLoading: orderHistoryLoading } = useOrderHistory({
    enabled: activeMainTab === "order_history",
    marketType: historyMarketType,
    page: historyPage,
    status: historyStatus === "all" ? undefined : historyStatus,
  });
  const allHistoryRows = useMemo(() => buildOrderHistoryRows(historyPages), [historyPages]);
  const historyTotalPages = historyPages[0]?.totalPages ?? 1;

  // Trade History
  const { data: tradeHistory = [], isLoading: tradeHistoryLoading } = useQuery({
    queryKey: tradingKeys.tradeHistory(market),
    queryFn: () => tradingService.tradeHistory(market),
    select: (res: unknown) => readList<Record<string, unknown>>(res),
    retry: false,
  });

  const selectMainTab = (tab: MainTab) => {
    setActiveMainTab(tab);
    setActiveOrderTypeTab("limit_market");
    setSelectedInstrument("all");
    setHistoryPage(1);
  };

  // Positions: live futures positions (portfolio WebSocket) + margin positions (REST).
  // Shown on every page, like Bybit's unified account.
  const { futuresPositions, refreshBalances: refreshPositions } = usePortfolioWs({ futures: true });
  const { data: marginPositionList = [], isLoading: marginPositionsLoading } = useQuery({
    queryKey: ["margin-positions"],
    queryFn: () => tradingService.marginPositions(),
    select: (res: any) => {
      const raw = res?.data ?? res ?? [];
      return Array.isArray(raw) ? raw : [];
    },
    retry: false,
    throwOnError: false,
    refetchInterval: 5000,
  });
  const allPositions = useMemo(
    () => buildPositionRows(futuresPositions, marginPositionList),
    [futuresPositions, marginPositionList]
  );

  // Borrowings (margin only)
  const { data: borrowings = [], isLoading: borrowingsLoading } = useQuery({
    queryKey: tradingKeys.marginBorrowHistory,
    queryFn: () => tradingService.marginBorrowHistory(),
    enabled: market === "margin",
    select: (res: any) => {
      const raw = res?.data ?? res ?? [];
      return Array.isArray(raw) ? raw : [];
    },
    retry: false,
  });

  // Portfolio assets
  const { coins: portfolioResponse } = usePortfolioWs({ coins: true });

  const { mutate: closeOrder, isPending: closeOrderPending } = useMutation({
    mutationFn: (orderId: string) => cancelSpotOrderWs(orderId),
    onSuccess: () => {
      successNotification("Order cancelled");
      queryClient.invalidateQueries({ queryKey: tradingKeys.openOrders() });
      queryClient.invalidateQueries({ queryKey: [ORDER_HISTORY_QUERY_KEY] });
      refreshBalances();
    },
    onError: (e) => errorMessageHandler(e),
  });

  // Position actions (futures). Margin positions have no close endpoint yet.
  const [closingPositionIds, setClosingPositionIds] = useState<Set<string>>(new Set());
  const { mutate: closePosition } = useMutation({
    mutationFn: (positionId: string) => closeFuturesPositionWs(positionId),
    onSuccess: () => {
      successNotification("Position closed");
      refreshPositions();
      refreshBalances();
    },
    onError: (e) => errorMessageHandler(e),
    onSettled: (_data, _error, positionId) =>
      setClosingPositionIds((current) => {
        const next = new Set(current);
        next.delete(positionId);
        return next;
      }),
  });
  const handleClosePosition = (positionId: string) => {
    if (!positionId) return;
    setClosingPositionIds((current) => new Set(current).add(positionId));
    closePosition(positionId);
  };
  const { mutate: partialClosePosition } = useMutation({
    mutationFn: (data: { positionId: string; close_quantity: string }) =>
      tradingService.partialCloseFuturesPosition(data),
    onSuccess: () => {
      successNotification("Partial close executed");
      refreshPositions();
      refreshBalances();
      modals.closeAll();
    },
    onError: (e) => errorMessageHandler(e),
  });
  const { mutate: updatePositionTpsl } = useMutation({
    mutationFn: (data: { positionId: string; take_profit_price?: string; stop_loss_price?: string }) =>
      tradingService.updateFuturesPositionTPSL(data),
    onSuccess: () => {
      successNotification("TP/SL updated");
      refreshPositions();
      modals.closeAll();
    },
    onError: (e) => errorMessageHandler(e),
  });

  const formatOrderDate = (value: unknown, timeOnly = false) => {
    if (!value) return "—";
    const raw = String(value);
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      return timeOnly ? date.toLocaleTimeString() : date.toLocaleString();
    }
    return timeOnly ? (raw.split(/\s+/).pop() ?? raw) : raw;
  };

  const formatOrderNumber = (value: unknown) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—";
  };

  const getOrderPair = (order: any) =>
    order?.pair || (order?.base && order?.quote ? `${order.base}/${order.quote}` : order?.symbol || "—");

  const getOrderTotal = (order: any) => {
    const total = Number(order?.total);
    if (Number.isFinite(total) && total >= 0) return total;
    const price = Number(order?.price);
    const qty = Number(order?.quantity ?? order?.amount);
    return Number.isFinite(price) && Number.isFinite(qty) ? price * qty : null;
  };

  const isBuySide = (side: unknown) => String(side ?? "").toUpperCase() === "BUY";

  const filteredOrders = useMemo(() => {
    if (!openOrders) return [];
    let filtered = [...openOrders];
    
    if (hideOtherPairs && selectedPair) {
      const normalized = selectedPair.replace("/", "").toUpperCase();
      filtered = filtered.filter((order: any) => {
        const orderPair = getOrderPair(order).replace("/", "").toUpperCase();
        return orderPair === normalized;
      });
    }
    
    if (selectedInstrument !== "all") {
      filtered = filtered.filter((order: any) => {
        const orderPair = getOrderPair(order);
        return orderPair.includes(selectedInstrument);
      });
    }
    
    return filtered;
  }, [openOrders, hideOtherPairs, selectedPair, selectedInstrument]);

  const openOrderCount = filteredOrders?.length ?? 0;
  const filteredPositions = useMemo(() => {
    const normalize = (value: string) => value.replace(/[/\\\-_\s]/g, "").toUpperCase();
    let rows = allPositions;
    // "All Markets" off = only the market of the page you're on
    if (selectedMarket !== "all") rows = rows.filter((row) => row.market === market);
    if (hideOtherPairs && selectedPair) {
      const current = normalize(selectedPair);
      rows = rows.filter((row) => normalize(row.pair) === current);
    }
    if (selectedInstrument !== "all") rows = rows.filter((row) => row.pair.includes(selectedInstrument));
    return rows;
  }, [allPositions, selectedMarket, market, hideOtherPairs, selectedPair, selectedInstrument]);
  const positionCount = filteredPositions.length;

  const filteredHistory = useMemo(
    () =>
      filterOrderHistoryRows(allHistoryRows, {
        orderType: activeOrderTypeTab,
        days: historyDays,
        instrument: selectedInstrument,
        hideOtherPairs,
        selectedPair,
        status: historyStatus,
      }),
    [allHistoryRows, activeOrderTypeTab, historyDays, selectedInstrument, hideOtherPairs, selectedPair, historyStatus]
  );

  // Instrument choices come from the pairs actually present in the current tab.
  const instrumentOptions = useMemo(() => {
    const pairs = new Set<string>();
    if (activeMainTab === "positions") allPositions.forEach((row) => pairs.add(row.pair));
    else if (activeMainTab === "order_history") allHistoryRows.forEach((row) => pairs.add(row.pair));
    else (openOrders ?? []).forEach((order: any) => pairs.add(getOrderPair(order)));
    pairs.delete("—");
    if (selectedInstrument !== "all") pairs.add(selectedInstrument);
    return Array.from(pairs).sort();
  }, [activeMainTab, allPositions, allHistoryRows, openOrders, selectedInstrument]);
  const borrowingCount = borrowings?.length ?? 0;

  const handleCalculator = () => {
    modals.open({
      ...DEFAULT_MODAL_SETTINGS,
      title: "Trading Calculator",
      children: (
        <div className="p-4 text-white/80 text-sm">
          <p>Order value, fees, and profit/loss calculations.</p>
          <p className="mt-2 text-white/40 text-xs">Calculator functionality coming soon.</p>
        </div>
      ),
    });
  };

  const handleMarginTransfer = () => {
    modals.open({
      ...DEFAULT_MODAL_SETTINGS,
      title: "Transfer Collateral",
      children: (
        <div className="p-4 text-white/80 text-sm">
          <p>Transfer assets between Spot and Margin accounts.</p>
          <p className="mt-2 text-white/40 text-xs">Transfer functionality available in account settings.</p>
        </div>
      ),
    });
  };

  const handleBorrowTrade = () => {
    modals.open({
      ...DEFAULT_MODAL_SETTINGS,
      title: "Borrow / Trade",
      children: (
        <div className="p-4 text-white/80 text-sm">
          <p>Borrow assets to trade on margin.</p>
          <p className="mt-2 text-white/40 text-xs">Margin trading is available when you select a margin trading pair.</p>
        </div>
      ),
    });
  };

  const handleManualRepay = () => {
    modals.open({
      ...DEFAULT_MODAL_SETTINGS,
      title: "Manual Repay",
      children: (
        <div className="p-4 text-white/80 text-sm">
          <p>Repay borrowed assets manually.</p>
          <p className="mt-2 text-white/40 text-xs">Repayment functionality available in the margin account panel.</p>
        </div>
      ),
    });
  };

  return (
    <div className={clsx("flex flex-col bg-[#181a20] rounded overflow-hidden", className)}>
      {/* Margin Trading Info Bar */}
      {market === "margin" && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] text-xs">
          <div className="flex items-center gap-2 text-white/60">
            <span>Margin trading steps: Transfer collateral →</span>
            <button onClick={handleBorrowTrade} className="text-primary hover:underline">
              Borrow/Trade &gt;
            </button>
            <button onClick={handleManualRepay} className="text-white/60 hover:text-white">
              Manual repay
            </button>
          </div>
          <button onClick={handleCalculator} className="flex items-center gap-1 text-white/60 hover:text-white">
            <MdCalculate size={16} />
            <span>Calculator</span>
          </button>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex items-center border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1 px-4 overflow-x-auto scrollbar-none">
          <Tab active={activeMainTab === "open_orders"} onClick={() => selectMainTab("open_orders")}>
            Open Orders <span className="text-white/40">({openOrderCount})</span>
          </Tab>
          <Tab active={activeMainTab === "positions"} onClick={() => selectMainTab("positions")}>
            Positions <span className="text-white/40">({positionCount})</span>
          </Tab>
          <Tab active={activeMainTab === "order_history"} onClick={() => selectMainTab("order_history")}>
            Order History
          </Tab>
          <Tab active={activeMainTab === "trade_history"} onClick={() => selectMainTab("trade_history")}>
            Trade History
          </Tab>
          <Tab active={activeMainTab === "assets"} onClick={() => selectMainTab("assets")}>
            Assets
          </Tab>
          {market === "margin" && (
            <Tab active={activeMainTab === "borrowings"} onClick={() => selectMainTab("borrowings")}>
              Borrowings <span className="text-white/40">({borrowingCount})</span>
            </Tab>
          )}
          <Tab active={activeMainTab === "tools"} onClick={() => selectMainTab("tools")}>
            Tools <span className="text-white/40">(0)</span>
          </Tab>
          <Tab active={activeMainTab === "pnl"} onClick={() => selectMainTab("pnl")}>
            P&amp;L
          </Tab>
        </div>
      </div>

      {/* Order Type Sub-Tabs (open orders + order history) */}
      {(activeMainTab === "open_orders" || activeMainTab === "order_history") && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <SubTab active={activeOrderTypeTab === "limit_market"} onClick={() => setActiveOrderTypeTab("limit_market")}>
              Limit &amp; Market Orders
            </SubTab>
            <SubTab active={activeOrderTypeTab === "conditional"} onClick={() => setActiveOrderTypeTab("conditional")} disabled>
              Conditional
            </SubTab>
            <SubTab active={activeOrderTypeTab === "tpsl"} onClick={() => setActiveOrderTypeTab("tpsl")}>
              TP/SL
            </SubTab>
            <SubTab active={activeOrderTypeTab === "trailing_stop"} onClick={() => setActiveOrderTypeTab("trailing_stop")} disabled>
              Trailing Stop
            </SubTab>
            <SubTab active={activeOrderTypeTab === "oco"} onClick={() => setActiveOrderTypeTab("oco")} disabled={market !== "margin"}>
              OCO
            </SubTab>
            <SubTab active={activeOrderTypeTab === "mmr_close"} onClick={() => setActiveOrderTypeTab("mmr_close")} disabled>
              MMR Close
            </SubTab>
            <SubTab active={activeOrderTypeTab === "spread_trading"} onClick={() => setActiveOrderTypeTab("spread_trading")} disabled>
              Spread Trading
            </SubTab>
          </div>
          {activeMainTab === "order_history" && (
            <div className="ml-3 flex shrink-0 items-center gap-1">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.days}
                  type="button"
                  onClick={() => setHistoryDays(range.days)}
                  aria-pressed={historyDays === range.days}
                  className={clsx(
                    "whitespace-nowrap rounded px-2 py-1 text-xs font-semibold transition-colors",
                    historyDays === range.days ? "text-white" : "text-white/40 hover:text-white/80"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters Bar */}
      {(activeMainTab === "open_orders" || activeMainTab === "positions" || activeMainTab === "order_history") && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.06] shrink-0">
          <Checkbox
            classNames={{
              label: "!text-xs !text-white/60",
              input: "!border-white/20 !bg-transparent checked:!bg-primary",
            }}
            label="All Markets"
            checked={selectedMarket === "all"}
            onChange={(e) => {
              setSelectedMarket(e.target.checked ? "all" : "spot");
              setHistoryPage(1);
            }}
          />
          
          <select
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value)}
            className="h-6 px-2 text-xs bg-white/[0.05] border border-white/10 rounded text-white/80 outline-none"
          >
            <option value="all">All Instruments</option>
            {instrumentOptions.map((pair) => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </select>

          {activeMainTab === "order_history" && (
            <select
              value={historyStatus}
              onChange={(e) => {
                setHistoryStatus(e.target.value as StatusFilter);
                setHistoryPage(1);
              }}
              aria-label="Order status"
              className="ml-auto h-6 rounded border border-white/10 bg-white/[0.05] px-2 text-xs font-semibold text-primary outline-none"
            >
              <option value="all">All Orders</option>
              <option value="FILLED">Filled</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REJECTED">Rejected</option>
            </select>
          )}

          <Popover width={200} position="bottom-end">
            <PopoverTarget>
              <button className={clsx("text-white/40 hover:text-white", activeMainTab !== "order_history" && "ml-auto")}>
                <MdMoreVert size={18} />
              </button>
            </PopoverTarget>
            <PopoverDropdown className="!bg-[#1c1e27] !border-white/[0.08] !p-2">
              <Checkbox
                classNames={{
                  label: "!text-xs !text-white/80",
                  input: "!border-white/20 !bg-transparent checked:!bg-primary",
                }}
                label="Hide Other Pairs"
                checked={hideOtherPairs}
                onChange={(e) => setHideOtherPairs(e.target.checked)}
              />
            </PopoverDropdown>
          </Popover>
        </div>
      )}

      {/* Trade History filter bar */}
      {activeMainTab === "trade_history" && (
        <div className="flex flex-col border-b border-white/[0.06] shrink-0">
          {/* Date chips row */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
            <div className="flex items-center gap-1">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.days}
                  type="button"
                  onClick={() => setTradeHistoryDays(range.days)}
                  className={clsx(
                    "whitespace-nowrap rounded px-2 py-1 text-xs font-semibold transition-colors",
                    tradeHistoryDays === range.days ? "text-white" : "text-white/40 hover:text-white/80"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-semibold shrink-0"
              onClick={() => {/* Trading Performance modal - stub */}}
            >
              Trading Performance <MdInfo size={13} className="opacity-60" />
            </button>
          </div>
          {/* Filters row */}
          <div className="flex items-center gap-3 px-4 py-2">
            <Checkbox
              classNames={{ label: "!text-xs !text-white/60", input: "!border-white/20 !bg-transparent checked:!bg-primary" }}
              label="All Markets"
              checked={tradeHistoryAllMarkets}
              onChange={(e) => setTradeHistoryAllMarkets(e.target.checked)}
            />
            <select
              value={tradeHistoryInstrument}
              onChange={(e) => setTradeHistoryInstrument(e.target.value)}
              className="h-6 px-2 text-xs bg-white/[0.05] border border-white/10 rounded text-white/80 outline-none"
            >
              <option value="all">All Instruments</option>
              {Array.from(new Set((tradeHistory ?? []).map((t: any) => t.pair ?? t.symbol ?? "").filter(Boolean))).sort().map((pair) => (
                <option key={String(pair)} value={String(pair)}>{String(pair)}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto min-h-0">
        {activeMainTab === "open_orders" && <OpenOrdersTable orders={filteredOrders} loading={openOrdersLoading} onCancel={closeOrder} cancelling={closeOrderPending} orderType={activeOrderTypeTab} mobile={mobile} />}
        {activeMainTab === "positions" && (
          <PositionsTable
            rows={filteredPositions}
            loading={marginPositionsLoading}
            emptyState={<EmptyState />}
            closingIds={closingPositionIds}
            onClose={handleClosePosition}
            onPartialClose={(positionId, close_quantity) => partialClosePosition({ positionId, close_quantity })}
            onUpdateTpsl={(positionId, take_profit_price, stop_loss_price) =>
              updatePositionTpsl({ positionId, take_profit_price, stop_loss_price })
            }
            mobile={mobile}
          />
        )}
        {activeMainTab === "order_history" && (
          <OrderHistoryTable
            rows={filteredHistory}
            loading={orderHistoryLoading}
            emptyState={<EmptyState />}
            page={historyPage}
            totalPages={historyTotalPages}
            onPage={setHistoryPage}
            mobile={mobile}
          />
        )}
        {activeMainTab === "trade_history" && (
          <TradeHistoryTable
            trades={tradeHistory}
            loading={tradeHistoryLoading}
            mobile={mobile}
            days={tradeHistoryDays}
            allMarkets={tradeHistoryAllMarkets}
            instrument={tradeHistoryInstrument}
            selectedPair={selectedPair}
          />
        )}
        {activeMainTab === "assets" && <AssetsTable assets={portfolioResponse} mobile={mobile} />}
        {activeMainTab === "borrowings" && <BorrowingsTable borrowings={borrowings} loading={borrowingsLoading} mobile={mobile} />}
        {activeMainTab === "tools" && <ToolsPanel />}
        {activeMainTab === "pnl" && <PnLPanel />}
      </div>
    </div>
  );
}

// Tab Components
function Tab({ active, onClick, children, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "flex items-center gap-1 px-3 py-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap",
        active ? "border-primary text-primary" : "border-transparent text-white/50 hover:text-white/80",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function SubTab({ active, onClick, children, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap",
        active ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

// ─── Mobile card helpers ───────────────────────────────────────────────
function MobileRow({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-white/40 shrink-0">{label}</span>
      <span className={clsx("text-right truncate ml-2", valueClass || "text-white/90")}>{value}</span>
    </div>
  );
}

// Table Components
function OpenOrdersTable({ orders, loading, onCancel, cancelling, orderType, mobile }: any) {
  const formatOrderNumber = (value: unknown) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—";
  };

  const formatOrderDate = (value: unknown) => {
    if (!value) return "—";
    const date = new Date(String(value));
    return !Number.isNaN(date.getTime()) ? date.toLocaleString() : String(value);
  };

  const getOrderPair = (order: any) =>
    order?.pair || (order?.base && order?.quote ? `${order.base}/${order.quote}` : order?.symbol || "—");

  const getOrderTotal = (order: any) => {
    const total = Number(order?.total);
    if (Number.isFinite(total) && total >= 0) return total;
    const price = Number(order?.price);
    const qty = Number(order?.quantity ?? order?.amount);
    return Number.isFinite(price) && Number.isFinite(qty) ? price * qty : null;
  };

  const isBuySide = (side: unknown) => String(side ?? "").toUpperCase() === "BUY";

  // Filter by order type tab
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (orderType === "limit_market") {
      return orders.filter((o: any) => {
        const type = String(o.type || "").toLowerCase();
        return type === "limit" || type === "market" || type.includes("limit") || type.includes("market");
      });
    }
    if (orderType === "tpsl") {
      return orders.filter((o: any) => o.takeProfit || o.stopLoss || o.tp_trigger_price || o.sl_trigger_price);
    }
    if (orderType === "oco") {
      return orders.filter((o: any) => o.orderType === "oco" || o.type === "oco");
    }
    return orders;
  }, [orders, orderType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="sm" color="gray" />
      </div>
    );
  }

  if (!filteredOrders || filteredOrders.length === 0) {
    return <EmptyState />;
  }

  if (mobile) {
    return (
      <div className="flex flex-col divide-y divide-white/[0.04]">
        {filteredOrders.map((order: any, idx: number) => (
          <div key={order.id ?? idx} className="px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{getOrderPair(order)}</span>
                <span className={clsx("text-xs font-bold uppercase", isBuySide(order.side) ? "text-success-5" : "text-error-1")}>{order.side}</span>
                <span className="text-[10px] text-white/40 capitalize bg-white/[0.06] px-1.5 py-0.5 rounded">{order.type}</span>
              </div>
              <button onClick={() => onCancel(order.id)} disabled={cancelling} className="text-xs font-semibold text-white/40 active:text-primary transition-colors">Cancel</button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <MobileRow label="Price" value={formatOrderNumber(order.price)} />
              <MobileRow label="Amount" value={`${formatOrderNumber(order.filledQuantity ?? 0)} / ${formatOrderNumber(order.quantity ?? order.amount)}`} />
              <MobileRow label="Total" value={getOrderTotal(order)?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"} />
              <MobileRow label="Time" value={formatOrderDate(order.createdAt)} />
              {(order.takeProfit || order.stopLoss) && (
                <MobileRow label="TP/SL" value={
                  <span>{order.takeProfit ? <span className="text-success-6">{formatOrderNumber(order.takeProfit)}</span> : "—"} / {order.stopLoss ? <span className="text-error-1">{formatOrderNumber(order.stopLoss)}</span> : "—"}</span>
                } />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#181a20] z-10">
          <tr className="border-b border-white/[0.06]">
            <TableHeader>Market</TableHeader>
            <TableHeader>Instrument</TableHeader>
            <TableHeader>Order Type</TableHeader>
            <TableHeader>Direction</TableHeader>
            <TableHeader>Order Price</TableHeader>
            <TableHeader>Filled/Order Quantity</TableHeader>
            <TableHeader>Order Value</TableHeader>
            <TableHeader>TP/SL</TableHeader>
            <TableHeader>Trade Type</TableHeader>
            <TableHeader>Order Time</TableHeader>
            <TableHeader>Order ID</TableHeader>
            <TableHeader align="right">Action</TableHeader>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order: any, idx: number) => (
            <tr key={order.id ?? idx} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
              <td className="px-3 py-2.5 text-white/70">Spot</td>
              <td className="px-3 py-2.5 font-semibold text-white/90">{getOrderPair(order)}</td>
              <td className="px-3 py-2.5 text-white/70 capitalize">{order.type || "—"}</td>
              <td className="px-3 py-2.5">
                <span className={clsx("font-bold", isBuySide(order.side) ? "text-success-5" : "text-error-1")}>
                  {String(order.side || "").toUpperCase()}
                </span>
              </td>
              <td className="px-3 py-2.5 text-white/90 font-mono">{formatOrderNumber(order.price)}</td>
              <td className="px-3 py-2.5 text-white/90 font-mono">
                {formatOrderNumber(order.filledQuantity ?? order.filled ?? 0)} / {formatOrderNumber(order.quantity ?? order.amount)}
              </td>
              <td className="px-3 py-2.5 text-white/90 font-mono">
                {getOrderTotal(order)?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
              </td>
              <td className="px-3 py-2.5 text-white/70">
                {order.takeProfit ? <span className="text-success-6">{formatOrderNumber(order.takeProfit)}</span> : "—"}
                {" / "}
                {order.stopLoss ? <span className="text-error-1">{formatOrderNumber(order.stopLoss)}</span> : "—"}
              </td>
              <td className="px-3 py-2.5 text-white/70">{order.tradeType || "Normal"}</td>
              <td className="px-3 py-2.5 text-white/70 font-mono">{formatOrderDate(order.createdAt)}</td>
              <td className="px-3 py-2.5 text-white/50 font-mono text-[10px]">
                {order.id ? String(order.id).slice(0, 8) + "..." : "—"}
              </td>
              <td className="px-3 py-2.5 text-right">
                <button
                  onClick={() => onCancel(order.id)}
                  disabled={cancelling}
                  className="text-xs font-semibold text-white/40 hover:text-primary transition-colors"
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TradeHistoryTable({ trades, loading, mobile, days, allMarkets, instrument, selectedPair }: any) {
  const fmt = (value: unknown, decimals = 8) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: decimals }) : "—";
  };
  const fmtDate = (value: unknown) => {
    if (!value) return "—";
    const d = new Date(String(value));
    return !Number.isNaN(d.getTime()) ? d.toLocaleString() : String(value);
  };
  const first = (trade: any, keys: string[]) => keys.map((k) => trade[k]).find((v) => v !== undefined && v !== null && v !== "");
  const getPair = (t: any) => t.pair ?? (t.base && t.quote ? `${t.base}/${t.quote}` : t.symbol ?? "");

  if (loading) return <div className="flex items-center justify-center py-12"><Loader size="sm" color="gray" /></div>;

  // Apply filters
  const cutoff = Date.now() - (days ?? 7) * 864e5;
  const filtered = (trades ?? []).filter((t: any) => {
    const timeStr = first(t, ["createdAt", "created_at", "executedAt", "timestamp", "time"]);
    const timeMs = timeStr ? new Date(String(timeStr)).getTime() : 0;
    if (timeMs && timeMs < cutoff) return false;
    if (instrument && instrument !== "all") {
      if (!getPair(t).includes(instrument)) return false;
    }
    return true;
  }).sort((a: any, b: any) => {
    const ta = new Date(String(first(a, ["createdAt","created_at","executedAt","timestamp","time"]) ?? 0)).getTime();
    const tb = new Date(String(first(b, ["createdAt","created_at","executedAt","timestamp","time"]) ?? 0)).getTime();
    return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
  });

  if (!filtered.length) return <EmptyState message="No trade history" />;

  if (mobile) {
    return (
      <div className="flex flex-col divide-y divide-white/[0.04]">
        {filtered.map((trade: any, idx: number) => {
          const pair = getPair(trade);
          const side = String(first(trade, ["side","orderSide","direction"]) ?? "").toUpperCase();
          const isBuy = side === "BUY";
          const filledPrice = Number(first(trade, ["filledPrice","fill_price","avgPrice","avg_price","price","executionPrice"]));
          const filledQty = Number(first(trade, ["filledQuantity","filled_quantity","executedQuantity","qty","quantity","amount","size"]));
          const filledValue = Number(first(trade, ["filledValue","filled_value","total"])) || (filledPrice * filledQty);
          const fee = Number(first(trade, ["fee","commission","tradingFee","trading_fee"]));
          const feeAsset = String(first(trade, ["feeAsset","fee_asset","commissionAsset"]) ?? "");
          const txId = String(first(trade, ["id","tradeId","trade_id","transactionId","transaction_id","fillId"]) ?? "");
          const time = first(trade, ["createdAt","created_at","executedAt","timestamp","time"]);
          const orderType = String(first(trade, ["orderType","order_type","type"]) ?? "Limit");
          return (
            <div key={txId || idx} className="px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{pair || "—"}</span>
                  <span className={clsx("text-xs font-bold", isBuy ? "text-[#25AB42]" : "text-[#F6465D]")}>{side || "—"}</span>
                  <span className="text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded text-white/50 capitalize">{orderType}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <MobileRow label="Filled Price" value={fmt(filledPrice, 6)} />
                <MobileRow label="Filled Qty" value={fmt(filledQty, 6)} />
                <MobileRow label="Filled Value" value={fmt(filledValue, 2)} />
                {Number.isFinite(fee) && fee !== 0 && <MobileRow label="Trading Fee" value={`${fmt(fee, 8)} ${feeAsset}`} />}
                <MobileRow label="Time" value={fmtDate(time)} />
                {txId && (
                  <div className="col-span-2 flex items-center gap-1 text-[10px] text-white/30">
                    <span>ID: {txId.length > 12 ? txId.slice(0, 12) + "…" : txId}</span>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(txId).catch(() => {})}><MdContentCopy size={10} /></button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-xs">
        <thead className="sticky top-0 bg-[#181a20] z-10">
          <tr className="border-b border-white/[0.06]">
            <TableHeader>Market</TableHeader>
            <TableHeader>Instrument</TableHeader>
            <TableHeader>Order Type</TableHeader>
            <TableHeader>Direction</TableHeader>
            <TableHeader>Filled Value</TableHeader>
            <TableHeader>Filled Price</TableHeader>
            <TableHeader>Filled Qty</TableHeader>
            <TableHeader>Filled Type</TableHeader>
            <TableHeader>Trading Fees</TableHeader>
            <TableHeader>Transaction Time</TableHeader>
            <TableHeader>Transaction ID</TableHeader>
          </tr>
        </thead>
        <tbody>
          {filtered.map((trade: any, idx: number) => {
            const pair = getPair(trade);
            const mkt = String(first(trade, ["market","market_type"]) ?? "Spot");
            const side = String(first(trade, ["side","orderSide","direction"]) ?? "").toUpperCase();
            const isBuy = side === "BUY" || side === "LONG";
            const orderType = String(first(trade, ["orderType","order_type","type"]) ?? "Limit");
            const filledType = String(first(trade, ["filledType","filled_type","execType","exec_type","tradeType"]) ?? "Normal");
            const filledPrice = Number(first(trade, ["filledPrice","fill_price","avgPrice","avg_price","price","executionPrice"]));
            const filledQty = Number(first(trade, ["filledQuantity","filled_quantity","executedQuantity","qty","quantity","amount","size"]));
            const filledValue = Number(first(trade, ["filledValue","filled_value","total"])) || (filledPrice * filledQty);
            const fee = Number(first(trade, ["fee","commission","tradingFee","trading_fee"]));
            const feeAsset = String(first(trade, ["feeAsset","fee_asset","commissionAsset"]) ?? "");
            const txId = String(first(trade, ["id","tradeId","trade_id","transactionId","transaction_id","fillId"]) ?? "");
            const time = first(trade, ["createdAt","created_at","executedAt","timestamp","time"]);
            const [base, quote] = pair.includes("/") ? pair.split("/") : ["", ""];
            return (
              <tr key={txId || idx} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                <td className="px-3 py-2.5 text-white/70 capitalize">{mkt}</td>
                <td className="px-3 py-2.5 font-semibold text-white/90">{pair || "—"}</td>
                <td className="px-3 py-2.5 text-white/70 capitalize">{orderType}</td>
                <td className="px-3 py-2.5">
                  <span className={clsx("font-bold", isBuy ? "text-[#25AB42]" : "text-[#F6465D]")}>{side || "—"}</span>
                </td>
                <td className="px-3 py-2.5 font-mono text-white/90">
                  {Number.isFinite(filledValue) && filledValue > 0 ? fmt(filledValue, 4) : "—"}
                  {quote && <span className="ml-1 text-white/40">{quote}</span>}
                </td>
                <td className="px-3 py-2.5 font-mono text-white/90">{Number.isFinite(filledPrice) && filledPrice > 0 ? fmt(filledPrice, 6) : "—"}</td>
                <td className="px-3 py-2.5 font-mono text-white/90">
                  {Number.isFinite(filledQty) && filledQty > 0 ? fmt(filledQty, 6) : "—"}
                  {base && <span className="ml-1 text-white/40">{base}</span>}
                </td>
                <td className="px-3 py-2.5 text-white/70 capitalize">{filledType}</td>
                <td className="px-3 py-2.5 font-mono text-white/70">
                  {Number.isFinite(fee) && fee !== 0 ? <>{fmt(fee, 8)}{feeAsset && <span className="ml-1 text-white/40">{feeAsset}</span>}</> : "—"}
                </td>
                <td className="px-3 py-2.5 font-mono text-white/70 whitespace-nowrap">{fmtDate(time)}</td>
                <td className="px-3 py-2.5">
                  {txId ? (
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(txId).catch(() => {})}
                      title={`${txId} (click to copy)`}
                      className="inline-flex items-center gap-1 font-mono text-white/60 hover:text-white transition-colors"
                    >
                      {txId.length > 12 ? txId.slice(0, 12) + "…" : txId}
                      <MdContentCopy size={11} className="text-white/30" />
                    </button>
                  ) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AssetsTable({ assets, mobile }: any) {
  if (!assets || assets.length === 0) {
    return <EmptyState message="No assets found" />;
  }

  if (mobile) {
    return (
      <div className="flex flex-col divide-y divide-white/[0.04]">
        {assets.map((asset: any, idx: number) => {
          const spot = Number(asset.spotBalance ?? asset.free ?? 0);
          const margin = Number(asset.marginBalance ?? 0);
          const locked = Number(asset.locked ?? 0);
          const available = spot - locked;
          const usdValue = Number(asset.usdValue ?? 0);
          if (spot === 0 && margin === 0 && locked === 0) return null;
          return (
            <div key={asset.symbol ?? idx} className="px-4 py-3 flex flex-col gap-2">
              <span className="font-bold text-sm text-white">{asset.symbol}</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <MobileRow label="Spot" value={spot.toLocaleString(undefined, { maximumFractionDigits: 6 })} />
                <MobileRow label="Available" value={available.toLocaleString(undefined, { maximumFractionDigits: 6 })} />
                <MobileRow label="In Order" value={locked.toLocaleString(undefined, { maximumFractionDigits: 6 })} />
                <MobileRow label="USD Value" value={`$${usdValue.toFixed(2)}`} />
                {margin > 0 && <MobileRow label="Margin" value={margin.toLocaleString(undefined, { maximumFractionDigits: 6 })} />}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#181a20] z-10">
          <tr className="border-b border-white/[0.06]">
            <TableHeader>Asset</TableHeader>
            <TableHeader>Spot Balance</TableHeader>
            <TableHeader>Margin Balance</TableHeader>
            <TableHeader>Available</TableHeader>
            <TableHeader>In Order</TableHeader>
            <TableHeader>USD Value</TableHeader>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset: any, idx: number) => {
            const spot = Number(asset.spotBalance ?? asset.free ?? 0);
            const margin = Number(asset.marginBalance ?? 0);
            const locked = Number(asset.locked ?? 0);
            const available = spot - locked;
            const usdValue = Number(asset.usdValue ?? 0);

            if (spot === 0 && margin === 0 && locked === 0) return null;

            return (
              <tr key={asset.symbol ?? idx} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                <td className="px-3 py-2.5 font-semibold text-white/90">{asset.symbol}</td>
                <td className="px-3 py-2.5 font-mono text-white/90">{spot.toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                <td className="px-3 py-2.5 font-mono text-white/90">{margin.toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                <td className="px-3 py-2.5 font-mono text-white/90">{available.toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                <td className="px-3 py-2.5 font-mono text-white/70">{locked.toLocaleString(undefined, { maximumFractionDigits: 8 })}</td>
                <td className="px-3 py-2.5 font-mono text-white/90">${usdValue.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BorrowingsTable({ borrowings, loading, mobile }: any) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="sm" color="gray" />
      </div>
    );
  }

  if (!borrowings || borrowings.length === 0) {
    return <EmptyState message="No borrowings" />;
  }

  if (mobile) {
    return (
      <div className="flex flex-col divide-y divide-white/[0.04]">
        {borrowings.map((borrow: any, idx: number) => (
          <div key={borrow.id ?? idx} className="px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white">{borrow.asset ?? borrow.symbol}</span>
              <button className="text-xs font-semibold text-primary">Repay</button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <MobileRow label="Borrowed" value={Number(borrow.amount ?? borrow.borrowed).toLocaleString()} />
              <MobileRow label="Interest" value={Number(borrow.interest ?? 0).toLocaleString()} />
              <MobileRow label="Total Debt" value={Number(borrow.totalDebt ?? borrow.amount).toLocaleString()} />
              <MobileRow label="Time" value={borrow.createdAt ? new Date(borrow.createdAt).toLocaleDateString() : "—"} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#181a20] z-10">
          <tr className="border-b border-white/[0.06]">
            <TableHeader>Asset</TableHeader>
            <TableHeader>Borrowed</TableHeader>
            <TableHeader>Interest</TableHeader>
            <TableHeader>Total Debt</TableHeader>
            <TableHeader>Time</TableHeader>
            <TableHeader align="right">Action</TableHeader>
          </tr>
        </thead>
        <tbody>
          {borrowings.map((borrow: any, idx: number) => (
            <tr key={borrow.id ?? idx} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
              <td className="px-3 py-2.5 font-semibold text-white/90">{borrow.asset ?? borrow.symbol}</td>
              <td className="px-3 py-2.5 font-mono text-white/90">{Number(borrow.amount ?? borrow.borrowed).toLocaleString()}</td>
              <td className="px-3 py-2.5 font-mono text-white/70">{Number(borrow.interest ?? 0).toLocaleString()}</td>
              <td className="px-3 py-2.5 font-mono text-white/90">{Number(borrow.totalDebt ?? borrow.amount).toLocaleString()}</td>
              <td className="px-3 py-2.5 text-white/70 font-mono">
                {borrow.createdAt ? new Date(borrow.createdAt).toLocaleString() : "—"}
              </td>
              <td className="px-3 py-2.5 text-right">
                <button className="text-xs font-semibold text-white/40 hover:text-primary">Repay</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ToolsPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <MdInfo size={32} className="text-white/20" />
      <p className="text-xs text-white/40">No active tools</p>
      <p className="text-xs text-white/30 max-w-md text-center">
        Trading tools like automated strategies, grid bots, and DCA bots will appear here when configured.
      </p>
    </div>
  );
}

function PnLPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <MdInfo size={32} className="text-white/20" />
      <p className="text-xs text-white/40">Profit & Loss tracking</p>
      <p className="text-xs text-white/30 max-w-md text-center">
        Your realized and unrealized P&L will be calculated and displayed here based on your trading activity.
      </p>
    </div>
  );
}

function TableHeader({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th className={clsx("px-3 py-2 text-white/40 font-medium uppercase text-[10px] tracking-wide", `text-${align}`)}>
      {children}
    </th>
  );
}

function EmptyState({ message = "No Available Data" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <svg width="84" height="92" viewBox="0 0 84 92" fill="none" className="opacity-60">
        <rect width="23" height="74" rx="1" transform="matrix(-1 0 0 1 53 9)" fill="url(#paint0_linear)" />
        <rect opacity="0.41" x="17" y="39" width="4" height="19" transform="rotate(180 17 39)" fill="url(#paint1_linear)" />
        <rect opacity="0.41" width="4" height="15" transform="matrix(-1 0 0 1 71 56)" fill="url(#paint2_linear)" />
        <path d="M51.6118 27H19V60.3582C19 63.4741 21.5259 66 24.6418 66H58.4775L55.45 64.6792C52.9147 63.573 51.2857 61.0589 51.3122 58.2929L51.6118 27Z" fill="#16171A" stroke="#71757A" />
        <path d="M59.5074 34.2344H64.9999V58.4667C64.9999 62.2498 62.2217 65.4589 58.4775 66.0005V66.0005" stroke="#71757A" />
        <rect x="25.8506" y="35.3945" width="18.5957" height="7" stroke="#F7A600" />
        <line x1="25.8506" y1="53.9902" x2="45.1063" y2="53.9902" stroke="#F7A600" />
        <line x1="25.8506" y1="48.9727" x2="45.1063" y2="48.9727" stroke="#F7A600" />
        <defs>
          <linearGradient id="paint0_linear" x1="7.82979" y1="158.355" x2="8.80749" y2="3.73347" gradientUnits="userSpaceOnUse">
            <stop offset="0.190594" stopColor="#F7A600" />
            <stop offset="1" stopColor="#F7A600" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="paint1_linear" x1="18.3617" y1="79.6587" x2="18.7323" y2="39.9605" gradientUnits="userSpaceOnUse">
            <stop offset="0.190594" stopColor="#F7A600" />
            <stop offset="1" stopColor="#F7A600" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="paint2_linear" x1="1.3617" y1="32.099" x2="1.59269" y2="0.757234" gradientUnits="userSpaceOnUse">
            <stop offset="0.190594" stopColor="#F7A600" />
            <stop offset="1" stopColor="#F7A600" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-xs font-medium text-white/30">{message}</span>
    </div>
  );
}
