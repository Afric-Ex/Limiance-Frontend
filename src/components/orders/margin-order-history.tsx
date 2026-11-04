"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { TransactionDetailsModal } from "@/src/components/transactions/transaction-details-modal";
import {
  fmtDate,
  fmtNum,
  getPair,
  selectStyles,
  searchInputClass,
  sideTone,
  StatusPill,
  TableCard,
  tableClassNames,
  ChipToggle,
  ResponsiveFilters,
} from "./orders-shared";

const filters = ["Cross", "Isolated"];

export const MarginOrderHistory = () => {
  const [filter, setFilter] = useState("Cross");
  const [pair, setPair] = useState("");
  const [orderType, setOrderType] = useState("All");
  const [tradeSide, setTradeSide] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: tradingKeys.marginOrderHistory,
    queryFn: () => tradingService.marginOrderHistory(),
    select: (res) => res?.data ?? [],
  });

  const allHistory: any[] = Array.isArray(history) ? history : [];
  const filtered = allHistory.filter((order) => {
    const type = String(order.orderType ?? order.order_type ?? order.type ?? "").toLowerCase();
    const side = String(order.side ?? "").toLowerCase();
    const mode = String(order.marginMode ?? order.margin_mode ?? order.tradeMode ?? "").toLowerCase();
    if (pair && !String(getPair(order)).toUpperCase().includes(pair.toUpperCase())) return false;
    if (orderType !== "All" && !type.includes(orderType.toLowerCase())) return false;
    if (tradeSide !== "All" && side !== tradeSide.toLowerCase()) return false;
    if (mode && mode !== filter.toLowerCase()) return false;
    return true;
  });

  const resetFilters = () => {
    setPair("");
    setOrderType("All");
    setTradeSide("All");
    setFilter("Cross");
  };

  const filterControls = (
    <>
      <Select label="Order" data={["All", "Limit", "Market"]} value={orderType} onChange={(value) => setOrderType(value ?? "All")} classNames={selectStyles} className="w-full sm:w-[150px]" />
      <Select label="Trade Side" data={["All", "Buy", "Sell"]} value={tradeSide} onChange={(value) => setTradeSide(value ?? "All")} classNames={selectStyles} className="w-full sm:w-[140px]" />
      <ChipToggle value={filter} options={filters} onChange={setFilter} />
    </>
  );

  return (
    <>
    <TransactionDetailsModal transaction={selectedOrder} onClose={() => setSelectedOrder(null)} />
    <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-end gap-3 border-y border-white/[0.08] py-3">
      <ResponsiveFilters>
        {filterControls}
      </ResponsiveFilters>
        <div className="flex min-w-0 flex-1 items-end gap-3">
          <TextInput
            classNames={searchInputClass}
            placeholder="Search pair..."
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            value={pair}
            onChange={(e) => setPair(e.currentTarget.value)}
            className="min-w-0 flex-1"
          />
          <button
            className="h-10 shrink-0 px-2 text-sm font-semibold text-white/40 hover:text-white transition-colors"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </div>

      <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="No margin order history found.">
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Order Time</TableTh>
              <TableTh>Trading Pair</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Side</TableTh>
              <TableTh>Price</TableTh>
              <TableTh>Executed</TableTh>
              <TableTh>Amount</TableTh>
              <TableTh>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {filtered.map((order: any) => (
              <TableTr key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer">
                <TableTd className="pl-5 text-white/50">{fmtDate(order.createdAt)}</TableTd>
                <TableTd className="!text-white !font-bold">{getPair(order)}</TableTd>
                <TableTd>{order.type ?? "—"}</TableTd>
                <TableTd className={sideTone(order.side)}>{String(order.side ?? "—").toUpperCase()}</TableTd>
                <TableTd>{fmtNum(order.price)}</TableTd>
                <TableTd>{fmtNum(order.filled ?? 0)}</TableTd>
                <TableTd>{fmtNum(order.amount ?? order.quantity)}</TableTd>
                <TableTd><StatusPill status={order.orderStatus ?? order.status} /></TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
    </>
  );
};