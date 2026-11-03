"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { Search } from "../icons/search";
import {
  fmtDate,
  fmtNum,
  getAmount,
  getPair,
  getTotal,
  selectStyles,
  searchInputClass,
  sideTone,
  StatusPill,
  TableCard,
  tableClassNames,
} from "./orders-shared";

export const OrderHistory = () => {
  const [query, setQuery] = useState("");
  const [side, setSide] = useState("All");
  const [status, setStatus] = useState("All");

  const { data: response, isLoading } = useQuery({
    queryKey: tradingKeys.orderHistory(),
    queryFn: () => tradingService.spotOrderHistory(),
    select: (res) => res?.data ?? [],
  });

  const orders: any[] = Array.isArray(response) ? response : [];
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase();
    return orders.filter((order) => {
      const pairMatch = !normalizedQuery || String(getPair(order)).toUpperCase().includes(normalizedQuery);
      const sideMatch = side === "All" || String(order.side ?? "").toLowerCase() === side.toLowerCase();
      const normalizedStatus = String(order.status ?? "").toLowerCase();
      const statusMatch =
        status === "All" ||
        normalizedStatus === status.toLowerCase() ||
        (status === "Cancelled" && normalizedStatus === "canceled") ||
        (status === "Filled" && ["completed", "fulfilled", "success"].includes(normalizedStatus));
      return pairMatch && sideMatch && statusMatch;
    });
  }, [orders, query, side, status]);

  const resetFilters = () => {
    setQuery("");
    setSide("All");
    setStatus("All");
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Order history</h2>
          <p className="mt-1 text-xs text-white/40">A record of your completed, cancelled and expired orders.</p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium tabular-nums text-white/55">
          {isLoading ? "Loading orders" : `${filtered.length} ${filtered.length === 1 ? "order" : "orders"}`}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-white/[0.07] bg-[#151820] p-3">
        <TextInput
          aria-label="Search order history by pair"
          classNames={searchInputClass}
          placeholder="Search pair"
          value={query}
          leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          onChange={(event) => setQuery(event.currentTarget.value)}
          className="min-w-[180px] flex-1"
        />
        <Select
          aria-label="Filter order history by side"
          data={["All", "Buy", "Sell"]}
          value={side}
          onChange={(value) => setSide(value ?? "All")}
          classNames={selectStyles}
          className="w-full sm:w-[132px]"
        />
        <Select
          aria-label="Filter order history by status"
          data={["All", "Filled", "Cancelled", "Expired", "Rejected"]}
          value={status}
          onChange={(value) => setStatus(value ?? "All")}
          classNames={selectStyles}
          className="w-full sm:w-[150px]"
        />
        <button
          type="button"
          onClick={resetFilters}
          disabled={!query && side === "All" && status === "All"}
          className="h-10 rounded-lg px-3 text-xs font-semibold text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white disabled:cursor-default disabled:opacity-35"
        >
          Clear filters
        </button>
      </div>

      <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="No orders match these filters." minHeight={340}>
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Time</TableTh>
              <TableTh>Pair</TableTh>
              <TableTh>Side</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Price</TableTh>
              <TableTh>Amount</TableTh>
              <TableTh>Filled</TableTh>
              <TableTh>Total</TableTh>
              <TableTh>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {filtered.map((order: any, index) => (
              <TableTr key={order.id ?? order.orderId ?? `${getPair(order)}-${index}`}>
                <TableTd className="pl-5 text-white/50">{fmtDate(order.createdAt ?? order.time)}</TableTd>
                <TableTd className="!font-bold !text-white">{getPair(order)}</TableTd>
                <TableTd className={sideTone(order.side)}>{String(order.side ?? "—").toUpperCase()}</TableTd>
                <TableTd className="text-white/65">{order.type ?? "—"}</TableTd>
                <TableTd className="font-mono tabular-nums">{fmtNum(order.price)}</TableTd>
                <TableTd className="font-mono tabular-nums">{fmtNum(getAmount(order))}</TableTd>
                <TableTd className="font-mono tabular-nums">{fmtNum(order.filled ?? order.filledQuantity ?? 0)}</TableTd>
                <TableTd className="font-mono tabular-nums !text-white">{fmtNum(getTotal(order))}</TableTd>
                <TableTd><StatusPill status={order.status} /></TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </section>
  );
};
