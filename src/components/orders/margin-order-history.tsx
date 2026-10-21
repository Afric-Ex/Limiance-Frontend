"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
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
} from "./orders-shared";

const filters = ["Cross", "Isolated"];

export const MarginOrderHistory = () => {
  const [filter, setFilter] = useState("Cross");
  const [pair, setPair] = useState("");

  const { data: history, isLoading } = useQuery({
    queryKey: tradingKeys.marginOrderHistory,
    queryFn: () => tradingService.marginOrderHistory(),
    select: (res) => res.data,
  });

  const allHistory: any[] = Array.isArray(history) ? history : [];
  const filtered = pair
    ? allHistory.filter((o) => String(getPair(o)).toUpperCase().includes(pair.toUpperCase()))
    : allHistory;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-4 rounded-2xl bg-[#181a20] border border-white/[0.06]">
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="Order"
            data={["Limit / Market"]}
            classNames={selectStyles}
            className="w-[150px]"
          />
          <Select
            label="Trade Side"
            data={["All", "Buy", "Sell"]}
            classNames={selectStyles}
            className="w-[140px]"
          />
          <ChipToggle value={filter} options={filters} onChange={setFilter} />
        </div>
        <div className="flex items-center gap-4">
          <TextInput
            classNames={searchInputClass}
            placeholder="Search pair..."
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            onChange={(e) => setPair(e.currentTarget.value)}
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setPair("")}
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
              <TableTr key={order.id}>
                <TableTd className="pl-5 text-white/50">{fmtDate(order.createdAt)}</TableTd>
                <TableTd className="!text-white !font-bold">{getPair(order)}</TableTd>
                <TableTd>{order.type ?? "—"}</TableTd>
                <TableTd className={sideTone(order.side)}>{String(order.side ?? "—").toUpperCase()}</TableTd>
                <TableTd>{fmtNum(order.price)}</TableTd>
                <TableTd>{fmtNum(order.filled ?? 0)}</TableTd>
                <TableTd>{fmtNum(order.amount ?? order.quantity)}</TableTd>
                <TableTd><StatusPill status={order.status} /></TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};