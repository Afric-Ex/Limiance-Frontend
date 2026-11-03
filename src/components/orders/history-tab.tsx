"use client";

import { Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput, Select } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { cancelSpotOrderWs } from "@/src/lib/order-ws";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import {
  fmtDate,
  fmtNum,
  getAmount,
  getPair,
  getTotal,
  selectStyles,
  searchInputClass,
  sideTone,
  TableCard,
  tableClassNames,
} from "./orders-shared";

export const OpenTab = () => {
  const queryClient = useQueryClient();
  const [side, setSide] = useState("All");
  const [pair, setPair] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: tradingKeys.openOrders(),
    queryFn: () => tradingService.fetchOpenOrders(),
    select: (res) => res?.data ?? [],
  });

  const { mutate: cancelOrder } = useMutation({
    mutationFn: (orderId: string): Promise<any> => cancelSpotOrderWs(orderId),
    onSuccess: () => {
      successNotification("Order cancelled");
      queryClient.invalidateQueries({ queryKey: tradingKeys.openOrders() });
      queryClient.invalidateQueries({ queryKey: ["order-history"] });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const allOrders: any[] = Array.isArray(orders) ? orders : [];
  const filtered = allOrders.filter((o) => {
    const pairMatch = !pair || String(getPair(o)).toUpperCase().includes(pair.toUpperCase());
    const sideMatch = side === "All" || String(o.side ?? "").toLowerCase() === side.toLowerCase();
    return pairMatch && sideMatch;
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Open orders</h2>
          <p className="mt-1 text-xs text-white/40">Track or cancel your active spot orders.</p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium tabular-nums text-white/55">
          {isLoading ? "Loading orders" : `${filtered.length} active`}
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-white/[0.07] bg-elevated p-3">
        <Select
          aria-label="Filter open orders by side"
          data={["All", "Buy", "Sell"]}
          value={side}
          onChange={(v) => setSide(v || "All")}
          classNames={selectStyles}
          className="w-full sm:w-[140px]"
        />
        <div className="flex min-w-[180px] flex-1 items-end gap-2">
          <TextInput
            classNames={searchInputClass}
            aria-label="Search open orders by pair"
            placeholder="Search pair"
            value={pair}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            onChange={(e) => setPair(e.currentTarget.value)}
          />
        </div>
        <button
          type="button"
          disabled={!pair && side === "All"}
          className="h-10 rounded-lg px-3 text-xs font-semibold text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white disabled:cursor-default disabled:opacity-35"
          onClick={() => { setPair(""); setSide("All"); }}
        >
          Clear filters
        </button>
      </div>

      <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="No open orders right now.">
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Pair</TableTh>
              <TableTh>Side</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Price</TableTh>
              <TableTh>Amount</TableTh>
              <TableTh>Filled</TableTh>
              <TableTh>Total</TableTh>
              <TableTh>Time</TableTh>
              <TableTh className="pr-5 text-right">Action</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {filtered.map((order: any) => (
              <TableTr key={order.id}>
                <TableTd className="pl-5 !text-white !font-bold">{getPair(order)}</TableTd>
                <TableTd className={sideTone(order.side)}>
                  {String(order.side ?? "—").toUpperCase()}
                </TableTd>
                <TableTd>{order.type ?? "—"}</TableTd>
                <TableTd>{fmtNum(order.price)}</TableTd>
                <TableTd>{fmtNum(getAmount(order))}</TableTd>
                <TableTd>{fmtNum(order.filled ?? order.filledQuantity ?? 0)}</TableTd>
                <TableTd>{fmtNum(getTotal(order))}</TableTd>
                <TableTd className="text-white/50">{fmtDate(order.createdAt)}</TableTd>
                <TableTd className="pr-5 text-right">
                  <button
                    className="text-[#F6465D] hover:text-[#F6465D]/80 bg-[#F6465D]/10 hover:bg-[#F6465D]/20 transition-all font-semibold text-xs px-3 py-1.5 rounded-lg active:scale-95"
                    onClick={() => cancelOrder(order.id)}
                  >
                    Cancel
                  </button>
                </TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </section>
  );
};