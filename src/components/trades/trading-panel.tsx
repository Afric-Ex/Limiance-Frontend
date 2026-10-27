"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tradingKeys, tradingService, type TradingMarket } from "@/src/services/trading";
import { cancelSpotOrderWs } from "@/src/lib/order-ws";
import { readList } from "@/src/lib/api-response";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { Loader, Checkbox, Popover, PopoverTarget, PopoverDropdown, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import clsx from "clsx";
import { MdMoreVert, MdCalculate, MdKeyboardArrowDown, MdInfo } from "react-icons/md";
import { IoEyeOff } from "react-icons/io5";

interface TradingPanelProps {
  selectedPair: string;
  market?: TradingMarket;
  className?: string;
}

type MainTab = "open_orders" | "positions" | "order_history" | "trade_history" | "assets" | "borrowings" | "tools" | "pnl";
type OrderTypeTab = "limit_market" | "conditional" | "tpsl" | "trailing_stop" | "oco" | "mmr_close" | "spread_trading";

export function TradingPanel({ selectedPair, market = "spot", className }: TradingPanelProps) {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("open_orders");
  const [activeOrderTypeTab, setActiveOrderTypeTab] = useState<OrderTypeTab>("limit_market");
  const [hideOtherPairs, setHideOtherPairs] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState("all");
  const [selectedMarket, setSelectedMarket] = useState("all");
  
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

  // Order History
  const { data: orderHistory, isLoading: orderHistoryLoading } = useQuery({
    queryKey: tradingKeys.orderHistory(market),
    queryFn: () => tradingService.spotOrderHistory(),
    select: (res: any) => {
      const raw = res?.data ?? res ?? [];
      return Array.isArray(raw) ? raw : [];
    },
    retry: false,
  });

  // Trade History
  const { data: tradeHistory = [], isLoading: tradeHistoryLoading } = useQuery({
    queryKey: tradingKeys.tradeHistory(market),
    queryFn: () => tradingService.tradeHistory(market),
    select: (res: unknown) => readList<Record<string, unknown>>(res),
    retry: false,
  });

  // Positions (futures/margin)
  const { data: positions = [], isLoading: positionsLoading } = useQuery({
    queryKey: ["positions", market],
    queryFn: () => market === "margin" ? tradingService.marginPositions() : Promise.resolve([]),
    enabled: market !== "spot",
    select: (res: any) => {
      const raw = res?.data ?? res ?? [];
      return Array.isArray(raw) ? raw : [];
    },
    retry: false,
  });

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
      refreshBalances();
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
  const positionCount = positions?.length ?? 0;
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
          <Tab active={activeMainTab === "open_orders"} onClick={() => setActiveMainTab("open_orders")}>
            Open Orders <span className="text-white/40">({openOrderCount})</span>
          </Tab>
          <Tab active={activeMainTab === "positions"} onClick={() => setActiveMainTab("positions")}>
            Positions <span className="text-white/40">({positionCount})</span>
          </Tab>
          <Tab active={activeMainTab === "order_history"} onClick={() => setActiveMainTab("order_history")}>
            Order History
          </Tab>
          <Tab active={activeMainTab === "trade_history"} onClick={() => setActiveMainTab("trade_history")}>
            Trade History
          </Tab>
          <Tab active={activeMainTab === "assets"} onClick={() => setActiveMainTab("assets")}>
            Assets
          </Tab>
          {market === "margin" && (
            <Tab active={activeMainTab === "borrowings"} onClick={() => setActiveMainTab("borrowings")}>
              Borrowings <span className="text-white/40">({borrowingCount})</span>
            </Tab>
          )}
          <Tab active={activeMainTab === "tools"} onClick={() => setActiveMainTab("tools")}>
            Tools <span className="text-white/40">(0)</span>
          </Tab>
          <Tab active={activeMainTab === "pnl"} onClick={() => setActiveMainTab("pnl")}>
            P&amp;L
          </Tab>
        </div>
      </div>

      {/* Order Type Sub-Tabs (only for open_orders) */}
      {activeMainTab === "open_orders" && (
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
        </div>
      )}

      {/* Filters Bar */}
      {activeMainTab === "open_orders" && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.06] shrink-0">
          <Checkbox
            classNames={{
              label: "!text-xs !text-white/60",
              input: "!border-white/20 !bg-transparent checked:!bg-primary",
            }}
            label="All Markets"
            checked={selectedMarket === "all"}
            onChange={(e) => setSelectedMarket(e.target.checked ? "all" : "spot")}
          />
          
          <select
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value)}
            className="h-6 px-2 text-xs bg-white/[0.05] border border-white/10 rounded text-white/80 outline-none"
          >
            <option value="all">All Instruments</option>
            <option value="BTC">BTC Pairs</option>
            <option value="ETH">ETH Pairs</option>
            <option value="USDT">USDT Pairs</option>
          </select>

          <Popover width={200} position="bottom-end">
            <PopoverTarget>
              <button className="ml-auto text-white/40 hover:text-white">
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

      {/* Content Area */}
      <div className="flex-1 overflow-auto min-h-0">
        {activeMainTab === "open_orders" && <OpenOrdersTable orders={filteredOrders} loading={openOrdersLoading} onCancel={closeOrder} cancelling={closeOrderPending} orderType={activeOrderTypeTab} />}
        {activeMainTab === "positions" && <PositionsTable positions={positions} loading={positionsLoading} market={market} />}
        {activeMainTab === "order_history" && <OrderHistoryTable orders={orderHistory} loading={orderHistoryLoading} />}
        {activeMainTab === "trade_history" && <TradeHistoryTable trades={tradeHistory} loading={tradeHistoryLoading} />}
        {activeMainTab === "assets" && <AssetsTable assets={portfolioResponse} />}
        {activeMainTab === "borrowings" && <BorrowingsTable borrowings={borrowings} loading={borrowingsLoading} />}
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

// Table Components
function OpenOrdersTable({ orders, loading, onCancel, cancelling, orderType }: any) {
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

function PositionsTable({ positions, loading, market }: any) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="sm" color="gray" />
      </div>
    );
  }

  if (market === "spot") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <MdInfo size={32} className="text-white/20" />
        <p className="text-xs text-white/40">Positions are not available for spot trading</p>
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#181a20] z-10">
          <tr className="border-b border-white/[0.06]">
            <TableHeader>Symbol</TableHeader>
            <TableHeader>Size</TableHeader>
            <TableHeader>Entry Price</TableHeader>
            <TableHeader>Mark Price</TableHeader>
            <TableHeader>Liq. Price</TableHeader>
            <TableHeader>Margin</TableHeader>
            <TableHeader>PnL</TableHeader>
            <TableHeader>PnL%</TableHeader>
            <TableHeader align="right">Action</TableHeader>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos: any, idx: number) => {
            const pnl = Number(pos.unrealizedPnl ?? pos.pnl ?? 0);
            const pnlPercent = Number(pos.pnlPercent ?? pos.roi ?? 0);
            return (
              <tr key={pos.id ?? idx} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                <td className="px-3 py-2.5 font-semibold">{pos.symbol || pos.pair}</td>
                <td className="px-3 py-2.5 font-mono">{Number(pos.size ?? pos.quantity).toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono">{Number(pos.entryPrice).toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono">{Number(pos.markPrice ?? pos.currentPrice).toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono">{Number(pos.liquidationPrice ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono">{Number(pos.margin ?? pos.marginUsed).toLocaleString()}</td>
                <td className={clsx("px-3 py-2.5 font-mono font-semibold", pnl >= 0 ? "text-success-6" : "text-error-1")}>
                  {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                </td>
                <td className={clsx("px-3 py-2.5 font-mono font-semibold", pnlPercent >= 0 ? "text-success-6" : "text-error-1")}>
                  {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button className="text-xs font-semibold text-white/40 hover:text-primary">Close</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrderHistoryTable({ orders, loading }: any) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="sm" color="gray" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return <EmptyState message="No order history" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#181a20] z-10">
          <tr className="border-b border-white/[0.06]">
            <TableHeader>Time</TableHeader>
            <TableHeader>Pair</TableHeader>
            <TableHeader>Type</TableHeader>
            <TableHeader>Direction</TableHeader>
            <TableHeader>Price</TableHeader>
            <TableHeader>Amount</TableHeader>
            <TableHeader>Total</TableHeader>
            <TableHeader>Status</TableHeader>
          </tr>
        </thead>
        <tbody>
          {orders.map((order: any, idx: number) => (
            <tr key={order.id ?? idx} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
              <td className="px-3 py-2.5 text-white/70 font-mono">{formatOrderDate(order.createdAt)}</td>
              <td className="px-3 py-2.5 font-semibold text-white/90">{getOrderPair(order)}</td>
              <td className="px-3 py-2.5 text-white/70 capitalize">{order.type || "—"}</td>
              <td className="px-3 py-2.5">
                <span className={clsx("font-bold", isBuySide(order.side) ? "text-success-5" : "text-error-1")}>
                  {String(order.side || "").toUpperCase()}
                </span>
              </td>
              <td className="px-3 py-2.5 text-white/90 font-mono">{formatOrderNumber(order.price)}</td>
              <td className="px-3 py-2.5 text-white/90 font-mono">{formatOrderNumber(order.quantity ?? order.amount)}</td>
              <td className="px-3 py-2.5 text-white/90 font-mono">
                {getOrderTotal(order)?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
              </td>
              <td className="px-3 py-2.5">
                <span className={clsx(
                  "text-xs px-2 py-0.5 rounded",
                  order.status === "FILLED" ? "bg-success-6/20 text-success-6" :
                  order.status === "CANCELLED" ? "bg-white/10 text-white/40" :
                  order.status === "REJECTED" ? "bg-error-1/20 text-error-1" :
                  "bg-white/10 text-white/60"
                )}>
                  {order.status || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TradeHistoryTable({ trades, loading }: any) {
  const formatOrderNumber = (value: unknown) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—";
  };

  const formatOrderDate = (value: unknown) => {
    if (!value) return "—";
    const date = new Date(String(value));
    return !Number.isNaN(date.getTime()) ? date.toLocaleString() : String(value);
  };

  const isBuySide = (side: unknown) => String(side ?? "").toUpperCase() === "BUY";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="sm" color="gray" />
      </div>
    );
  }

  if (!trades || trades.length === 0) {
    return <EmptyState message="No trade history" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[#181a20] z-10">
          <tr className="border-b border-white/[0.06]">
            <TableHeader>Time</TableHeader>
            <TableHeader>Symbol</TableHeader>
            <TableHeader>Side</TableHeader>
            <TableHeader>Price</TableHeader>
            <TableHeader>Quantity</TableHeader>
            <TableHeader>Fee</TableHeader>
            <TableHeader>Total</TableHeader>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade: any, idx: number) => {
            const price = Number(trade.price ?? trade.executedPrice);
            const qty = Number(trade.quantity ?? trade.filledQuantity ?? trade.amount);
            const fee = Number(trade.fee ?? trade.commission ?? 0);
            const total = price * qty;

            return (
              <tr key={trade.id ?? idx} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                <td className="px-3 py-2.5 text-white/70 font-mono">{formatOrderDate(trade.createdAt ?? trade.timestamp)}</td>
                <td className="px-3 py-2.5 font-semibold text-white/90">{trade.symbol ?? trade.pair}</td>
                <td className="px-3 py-2.5">
                  <span className={clsx("font-bold", isBuySide(trade.side) ? "text-success-5" : "text-error-1")}>
                    {String(trade.side || "").toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-white/90 font-mono">{formatOrderNumber(price)}</td>
                <td className="px-3 py-2.5 text-white/90 font-mono">{formatOrderNumber(qty)}</td>
                <td className="px-3 py-2.5 text-white/70 font-mono">{formatOrderNumber(fee)}</td>
                <td className="px-3 py-2.5 text-white/90 font-mono">{total.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AssetsTable({ assets }: any) {
  if (!assets || assets.length === 0) {
    return <EmptyState message="No assets found" />;
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

function BorrowingsTable({ borrowings, loading }: any) {
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
