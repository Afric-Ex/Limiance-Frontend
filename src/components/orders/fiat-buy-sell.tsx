"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import {
  fmtDateTime,
  fmtNum,
  searchInputClass,
  selectStyles,
  sideTone,
  StatusPill,
  TableCard,
  tableClassNames,
} from "./orders-shared";

export const FiatBuySell = () => {
  const [query, setQuery] = useState("");

  const { data: history, isLoading } = useQuery({
    queryKey: tradingKeys.fiatOrderHistory,
    queryFn: () => tradingService.fiatOrderHistory(),
    select: (res) => res.data,
  });

  const allHistory: any[] = Array.isArray(history) ? history : [];
  const filtered = query
    ? allHistory.filter((i) => String(i.id ?? "").includes(query))
    : allHistory;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-4 rounded-2xl bg-[#181a20] border border-white/[0.06]">
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="Coin"
            data={["All"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[120px]"
          />
          <Select
            label="Category"
            data={["All", "Buy", "Sell"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[130px]"
          />
          <Select
            label="Time"
            data={["All", "Last 7 Days", "Last 30 Days"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[130px]"
          />
          <Select
            label="Currency"
            data={["USD", "NGN", "EUR", "GBP"]}
            defaultValue="USD"
            classNames={selectStyles}
            className="w-[110px]"
          />
        </div>
        <div className="flex items-center gap-4">
          <TextInput
            classNames={searchInputClass}
            placeholder="Search order no."
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setQuery("")}
          >
            Reset
          </button>
        </div>
      </div>

      <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="No fiat orders found.">
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Order ID</TableTh>
              <TableTh>Time</TableTh>
              <TableTh>Category</TableTh>
              <TableTh>Price</TableTh>
              <TableTh>Fiat/Crypto Amount</TableTh>
              <TableTh>Received</TableTh>
              <TableTh>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {filtered.map((item: any) => (
              <TableTr key={item.id}>
                <TableTd className="pl-5 font-mono text-xs !text-white/70">{item.id}</TableTd>
                <TableTd className="text-white/50">{fmtDateTime(item.createdAt)}</TableTd>
                <TableTd className={sideTone(item.type)}>{String(item.type ?? "—").toUpperCase()}</TableTd>
                <TableTd className="tabular-nums">{item.rate ? fmtNum(item.rate) : "—"}</TableTd>
                <TableTd className="tabular-nums">
                  {item.fiatAmount ? `${fmtNum(item.fiatAmount)} ${item.currency ?? ""}`.trim() : "—"}
                </TableTd>
                <TableTd className="tabular-nums">
                  {item.assetAmount ? `${fmtNum(item.assetAmount)} ${item.asset ?? ""}`.trim() : "—"}
                </TableTd>
                <TableTd><StatusPill status={item.status} /></TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};