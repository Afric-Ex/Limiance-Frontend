"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import {
  fmtDateTime,
  fmtNum,
  getPair,
  selectStyles,
  searchInputClass,
  sideTone,
  TableCard,
  tableClassNames,
} from "./orders-shared";

export const normalizeSymbol = (value: string) =>
  String(value ?? "")
    .replace(/[-/_\\\s]+/g, "")
    .toUpperCase();

export const OrderDetails = () => {
  const [symbol, setSymbol] = useState("BTCUSDT");

  const { data: trades, isLoading } = useQuery({
    queryKey: tradingKeys.spotRecentTrades(symbol),
    queryFn: () => tradingService.spotRecentTrades({ symbol }),
    select: (res) => res.data,
  });

  const allTrades: any[] = Array.isArray(trades) ? trades : [];
  const filtered = allTrades;

  const fee = (t: any) =>
    t.fee ?? t.commission ?? (t.feeAmount !== undefined ? t.feeAmount : null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-4 rounded-2xl bg-[#181a20] border border-white/[0.06]">
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="Time"
            data={["All", "Last 7 Days", "Last 30 Days"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[140px]"
          />
        </div>
        <div className="flex items-center gap-4">
          <TextInput
            classNames={searchInputClass}
            placeholder={symbol === "BTCUSDT" ? "BTCUSDT" : "Search pair..."}
            value={symbol}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            onChange={(e) => setSymbol(normalizeSymbol(e.currentTarget.value))}
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setSymbol("BTCUSDT")}
          >
            Reset
          </button>
        </div>
      </div>

      <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="No trade records found.">
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Time</TableTh>
              <TableTh>Trading Pair</TableTh>
              <TableTh>Side</TableTh>
              <TableTh>Price</TableTh>
              <TableTh>Filled</TableTh>
              <TableTh>Fee</TableTh>
              <TableTh>Total</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {filtered.map((t: any, idx: number) => (
              <TableTr key={t.id ?? t.tradeId ?? idx}>
                <TableTd className="pl-5 text-white/50">{fmtDateTime(t.createdAt ?? t.time ?? t.ts)}</TableTd>
                <TableTd className="!text-white !font-bold">{getPair(t) ?? t.symbol}</TableTd>
                <TableTd className={sideTone(t.side)}>{String(t.side ?? "—").toUpperCase()}</TableTd>
                <TableTd>{fmtNum(t.price)}</TableTd>
                <TableTd>{fmtNum(t.quantity ?? t.qty ?? t.filled)}</TableTd>
                <TableTd>{fmtNum(fee(t))}</TableTd>
                <TableTd>{fmtNum(t.total ?? (t.price && t.quantity ? t.price * t.quantity : null))}</TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};