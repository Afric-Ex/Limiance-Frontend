"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, Skeleton } from "@mantine/core";
import React from "react";
import { EmptyTable } from "../icons/empty-table";
import { DateInput } from "@mantine/dates";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { parseDate } from "./orders-shared";

const selectStyles = {
  input: "!h-11 !rounded-xl !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !bg-[#181a20] !text-sm !font-medium !transition-all !duration-200",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  dropdown: "!bg-[#181a20] !border-white/[0.08]",
  option: "hover:!bg-white/[0.04] !text-sm data-[checked]:!bg-primary/20 data-[checked]:!text-primary"
};

const dateStyles = {
  input: "!h-11 !rounded-xl !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !bg-[#181a20] !text-sm !font-medium !transition-all !duration-200",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  calendarHeader: "!text-white",
  day: "data-[selected]:!bg-primary hover:!bg-white/[0.04]",
};

const toNumber = (value: unknown): number | null => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const formatNumber = (value: unknown, fallback = "—") => {
  const numberValue = toNumber(value);
  return numberValue === null ? fallback : numberValue.toLocaleString();
};

const formatDate = (value: unknown) => {
  const date = parseDate(value);
  return !date
    ? "—"
    : date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const getPair = (order: any) =>
  order.pair || (order.base && order.quote ? `${order.base}/${order.quote}` : "—");

const getAmount = (order: any) => order.amount ?? order.quantity;

const getTotal = (order: any) => {
  if (order.total !== undefined && order.total !== null) return order.total;
  const price = toNumber(order.price);
  const amount = toNumber(getAmount(order));
  return price !== null && amount !== null ? price * amount : null;
};

export const OrderHistory = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: tradingKeys.orderHistory(),
    queryFn: () => tradingService.spotOrderHistory(),
    select: (res) => res.data,
  });

  const hasOrders = orders && orders.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-[#181a20] p-4 rounded-2xl border border-white/[0.06]">
        <DateInput label="Date" classNames={dateStyles} className="w-[160px]" />
        
        <div className="flex items-center gap-2">
          <Select
            label="Base Asset"
            data={["All", "BTC", "ETH", "USDT"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[120px]"
          />
          <span className="text-white/40 mb-1 font-bold">-</span>
          <Select
            label="Quote Asset"
            data={["All", "USDT", "USDC", "NGN"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[120px]"
          />
        </div>

        <Select
          label="Trade Side"
          data={["All", "Buy", "Sell"]}
          defaultValue="All"
          classNames={selectStyles}
          className="w-[140px]"
        />

        <Select
          label="Sort By"
          data={["Order Time", "Amount", "Price"]}
          defaultValue="Order Time"
          classNames={selectStyles}
          className="w-[160px]"
        />
      </div>

      {/* Table Section */}
      <div className="min-h-[400px] rounded-2xl bg-[#181a20] border border-white/[0.06] overflow-hidden">
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
              th: "!text-white/40 !uppercase !tracking-wider !text-xs !font-bold !border-b !border-white/[0.06] !py-4 !bg-[#181a20]", 
              td: "!text-sm !py-4 !border-b !border-white/[0.04] !text-white/80 !font-medium",
              tr: "hover:!bg-white/[0.02] !transition-colors cursor-default"
            }}>
              <TableThead>
                <TableTr>
                  <TableTh className="pl-6">Time</TableTh>
                  <TableTh>Pair</TableTh>
                  <TableTh>Side</TableTh>
                  <TableTh>Type</TableTh>
                  <TableTh>Price</TableTh>
                  <TableTh>Amount</TableTh>
                  <TableTh>Filled</TableTh>
                  <TableTh>Total</TableTh>
                  <TableTh className="pr-6">Status</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {orders.map((order: any) => (
                  <TableTr key={order.id}>
                    <TableTd className="pl-6 text-white/50">{formatDate(order.createdAt)}</TableTd>
                    <TableTd className="!text-white !font-bold">{getPair(order)}</TableTd>
                    <TableTd className={order.side === "buy" ? "!text-success-6" : "!text-error-1"}>
                      {order.side?.toUpperCase() ?? "—"}
                    </TableTd>
                    <TableTd>{order.type ?? "—"}</TableTd>
                    <TableTd>{formatNumber(order.price)}</TableTd>
                    <TableTd>{formatNumber(getAmount(order))}</TableTd>
                    <TableTd>{formatNumber(order.filled ?? order.filledQuantity ?? 0)}</TableTd>
                    <TableTd>{formatNumber(getTotal(order))}</TableTd>
                    <TableTd className="pr-6">
                      <span className={`px-2 py-1 flex items-center justify-center w-fit text-xs font-bold rounded-md uppercase tracking-wider ${
                        order.status === "filled" ? "text-success-6 bg-success-6/10" :
                        order.status === "cancelled" ? "text-error-1 bg-error-1/10" :
                        "text-warning-1 bg-warning-1/10"
                      }`}>
                        {order.status}
                      </span>
                    </TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center flex-col gap-4 opacity-70">
            <EmptyTable />
            <span className="text-sm font-semibold text-white/40">No orders found matching your criteria.</span>
          </div>
        )}
      </div>
    </div>
  );
};
