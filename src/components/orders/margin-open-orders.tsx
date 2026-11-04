"use client";

import { Popover, PopoverDropdown, PopoverTarget, Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput, Skeleton } from "@mantine/core";
import React, { useState } from "react";
import clsx from "clsx";
import { MdTune } from "react-icons/md";
import { Search } from "../icons/search";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { readList } from "@/src/lib/api-response";
import { cancelMarginOrderWs } from "@/src/lib/order-ws";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { OrdersEmptyState } from "./orders-shared";

const selectStyles = {
  input: "!h-10 !rounded-lg !border !border-white/[0.09] hover:!border-white/[0.16] focus:!border-primary/50 !text-white !bg-elevated !text-sm !font-medium !transition-colors",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  dropdown: "!bg-elevated !border-white/[0.08]",
  option: "hover:!bg-white/[0.04] !text-sm data-[checked]:!bg-primary/20 data-[checked]:!text-primary"
};

const filters = ["Cross", "Isolated"];

const formatNumber = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toLocaleString() : "—";
};

const getOrderId = (order: any): string => {
  const id = order?.id ?? order?.orderId ?? order?.order_id ?? order?._id;
  return id != null ? String(id) : "";
};

const getOrderSymbol = (order: any): string => {
  const symbol =
    order?.pair ??
    order?.symbol ??
    (order?.base && order?.quote ? `${order.base}/${order.quote}` : "");
  return String(symbol || "");
};

const getOrderLevels = (order: any) => {
  const takeProfit = Number(
    order?.takeProfit ??
      order?.take_profit ??
      order?.take_profit_price ??
      order?.tp_trigger_price ??
      order?.tp_price ??
      order?.tp
  );
  const stopLoss = Number(
    order?.stopLoss ??
      order?.stop_loss ??
      order?.stop_loss_price ??
      order?.sl_trigger_price ??
      order?.sl_price ??
      order?.sl
  );
  return {
    takeProfit: Number.isFinite(takeProfit) && takeProfit > 0 ? takeProfit : null,
    stopLoss: Number.isFinite(stopLoss) && stopLoss > 0 ? stopLoss : null,
  };
};

export const MarginOpenOrders = () => {
  const [filter, setFilter] = useState("Cross");
  const [orderType, setOrderType] = useState("All");
  const [baseAsset, setBaseAsset] = useState("All");
  const [quoteAsset, setQuoteAsset] = useState("All");
  const [tradeSide, setTradeSide] = useState("All");
  const [pairSearch, setPairSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: tradingKeys.marginOpenOrders,
    queryFn: () =>
      tradingService.fetchMarginOpenOrders(),
    select: (res: unknown) => readList<Record<string, any>>(res),
  });

  const { mutate: cancelOrder } = useMutation({
    mutationFn: ({ orderId, symbol }: { orderId: string; symbol?: string }): Promise<any> =>
      cancelMarginOrderWs(orderId, symbol),
    onSuccess: () => {
      successNotification("Order cancelled");
      queryClient.invalidateQueries({ queryKey: tradingKeys.marginOpenOrders });
      queryClient.invalidateQueries({ queryKey: ["order-history"] });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const filteredOrders = orders.filter((order: any) => {
    const symbol = getOrderSymbol(order);
    const [pairBase = "", pairQuote = ""] = symbol.includes("/")
      ? symbol.split("/")
      : [String(order.base ?? ""), String(order.quote ?? "")];
    const type = String(order.orderType ?? order.order_type ?? order.type ?? "").toLowerCase();
    const side = String(order.side ?? order.order_side ?? "").toLowerCase();
    const mode = String(order.marginMode ?? order.margin_mode ?? order.tradeMode ?? "").toLowerCase();
    if (orderType !== "All" && !type.includes(orderType.toLowerCase())) return false;
    if (baseAsset !== "All" && pairBase.toUpperCase() !== baseAsset) return false;
    if (quoteAsset !== "All" && pairQuote.toUpperCase() !== quoteAsset) return false;
    if (tradeSide !== "All" && side !== tradeSide.toLowerCase()) return false;
    if (pairSearch && !symbol.toUpperCase().includes(pairSearch.toUpperCase())) return false;
    if (mode && mode !== filter.toLowerCase()) return false;
    return true;
  });
  const hasOrders = filteredOrders.length > 0;

  const filterControls = (
    <>
      <Select label="Order Type" data={["All", "Limit", "Market", "Stop Loss", "Take Profit"]} value={orderType} onChange={(value) => setOrderType(value ?? "All")} classNames={selectStyles} className="w-full sm:w-[140px]" />
      <Select label="Base Asset" data={["All", "BTC", "ETH"]} value={baseAsset} onChange={(value) => setBaseAsset(value ?? "All")} classNames={selectStyles} className="w-full sm:w-[120px]" />
      <Select label="Quote Asset" data={["All", "USDT", "USDC"]} value={quoteAsset} onChange={(value) => setQuoteAsset(value ?? "All")} classNames={selectStyles} className="w-full sm:w-[120px]" />
      <Select label="Trade Side" data={["All", "Buy", "Sell"]} value={tradeSide} onChange={(value) => setTradeSide(value ?? "All")} classNames={selectStyles} className="w-full sm:w-[120px]" />
    </>
  );

  const modeToggle = (
    <div className="flex shrink-0 self-end rounded-lg border border-white/[0.06] bg-white/[0.04] p-1">
      {filters.map((item) => (
        <button key={item} type="button" onClick={() => setFilter(item)} className={clsx("rounded-md px-4 py-1.5 text-xs font-semibold transition-colors", filter === item ? "bg-primary text-white" : "text-white/50 hover:bg-white/[0.04] hover:text-white")}>
          {item}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-end gap-3 border-y border-white/[0.08] py-3">
        <div className="hidden min-[768px]:flex flex-wrap items-end gap-3">
          {filterControls}
          {modeToggle}
        </div>
        <div className="min-[768px]:hidden">
          <Popover position="bottom-start" shadow="md">
            <PopoverTarget>
              <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.09] bg-elevated px-3 text-sm font-semibold text-white/75"><MdTune size={16} />Filters</button>
            </PopoverTarget>
            <PopoverDropdown className="!bg-[#181a20] !border-white/[0.08] !p-3">
              <div className="flex w-[min(320px,calc(100vw-48px))] flex-col gap-3">
                {filterControls}
                {modeToggle}
              </div>
            </PopoverDropdown>
          </Popover>
        </div>
        <div className="flex min-w-0 flex-1 items-end gap-3">
            <TextInput
              classNames={{
                input: "!h-11 !bg-white/[0.04] hover:!bg-white/[0.06] focus:!bg-white/[0.08] !border !border-white/[0.08] focus:!border-primary/50 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !w-full sm:!w-[280px] !rounded-xl !transition-all placeholder:!text-white/20",
              }}
              placeholder="Search pair..."
              leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
              value={pairSearch}
              onChange={(event) => setPairSearch(event.currentTarget.value)}
              className="min-w-0 flex-1"
            />
            <button type="button" className="h-10 shrink-0 px-2 text-sm font-semibold text-white/40 hover:text-white transition-colors" onClick={() => { setOrderType("All"); setBaseAsset("All"); setQuoteAsset("All"); setTradeSide("All"); setPairSearch(""); setFilter("Cross"); }}>Reset</button>
        </div>
      </div>

      {/* Table Section */}
      <div className="min-h-[260px] overflow-hidden border-y border-white/[0.08]">
        {isLoading ? (
          <div className="p-6 flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={50} radius="md" className="!bg-white/[0.02] before:!bg-white/[0.02]" />
            ))}
          </div>
        ) : hasOrders ? (
          <div className="overflow-x-auto custom-scrollbar">
            <Table classNames={{ 
              table: "min-w-[900px]",
              th: "!text-white/40 !uppercase !tracking-wider !text-xs !font-bold !border-b !border-white/[0.06] !py-4 !bg-surface",
              td: "!text-sm !py-4 !border-b !border-white/[0.04] !text-white/80 !font-medium",
              tr: "hover:!bg-white/[0.02] !transition-colors"
            }}>
              <TableThead>
                <TableTr>
                  <TableTh className="pl-6">Pair</TableTh>
                  <TableTh>Side</TableTh>
                  <TableTh>Type</TableTh>
                  <TableTh>Price</TableTh>
                  <TableTh>Amount</TableTh>
                  <TableTh>Filled</TableTh>
                  <TableTh>Total</TableTh>
                  <TableTh>TP / SL</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh>Time</TableTh>
                  <TableTh className="pr-6 text-right">Action</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {filteredOrders.map((order: any, index: number) => {
                  const orderId = getOrderId(order);
                  const levels = getOrderLevels(order);
                  const side = String(order.side ?? order.order_side ?? "").toUpperCase();
                  return (
                  <TableTr key={orderId || index}>
                    <TableTd className="pl-6 !text-white !font-bold">{order.pair ?? order.symbol ?? `${order.base ?? ""}/${order.quote ?? ""}`}</TableTd>
                    <TableTd className={side === "BUY" ? "!text-success-6" : "!text-error-1"}>
                      {side || "—"}
                    </TableTd>
                    <TableTd>{order.type ?? order.order_type ?? "—"}</TableTd>
                    <TableTd>{formatNumber(order.price)}</TableTd>
                    <TableTd>{formatNumber(order.amount ?? order.quantity)}</TableTd>
                    <TableTd>{formatNumber(order.filled ?? order.filledQuantity)}</TableTd>
                    <TableTd>{formatNumber(order.total)}</TableTd>
                    <TableTd>
                      <span className="text-xs">
                        {levels.takeProfit ? <span className="text-success-6">{levels.takeProfit.toLocaleString()}</span> : "—"}
                        {" / "}
                        {levels.stopLoss ? <span className="text-error-1">{levels.stopLoss.toLocaleString()}</span> : "—"}
                      </span>
                    </TableTd>
                    <TableTd>
                      <span className="text-warning-1 bg-warning-1/10 px-2 py-1 flex items-center justify-center w-fit text-xs font-bold rounded-md uppercase tracking-wider">
                        {order.status || "OPEN"}
                      </span>
                    </TableTd>
                    <TableTd className="text-white/50">{order.createdAt ? new Date(order.createdAt).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : "—"}</TableTd>
                    <TableTd className="pr-6 text-right">
                      <button
                        className="text-error-1 hover:text-error-1/80 bg-error-1/10 hover:bg-error-1/20 transition-all font-semibold text-xs px-3 py-1.5 rounded-lg active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                        disabled={!orderId}
                        onClick={() => cancelOrder({ orderId, symbol: getOrderSymbol(order) })}
                      >
                        Cancel
                      </button>
                    </TableTd>
                  </TableTr>
                  );
                })}
              </TableTbody>
            </Table>
          </div>
        ) : (
          <OrdersEmptyState
            title="No open margin orders"
            description="Open margin orders will appear here when you place them."
          />
        )}
      </div>
    </div>
  );
};
