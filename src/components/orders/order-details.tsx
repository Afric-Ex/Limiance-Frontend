"use client";

import { Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import {
  fmtDateTime,
  fmtNum,
  getPair,
  OrdersEmptyState,
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
    select: (res) => res?.data ?? [],
  });

  const allTrades: any[] = Array.isArray(trades) ? trades : [];
  const filtered = allTrades;
  const resetPair = () => setSymbol("BTCUSDT");

  const fee = (t: any) =>
    t.fee ?? t.commission ?? (t.feeAmount !== undefined ? t.feeAmount : null);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Trade fills</h2>
          <p className="mt-1 text-xs text-white/40">Individual executions, fees and settled amounts by trading pair.</p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium tabular-nums text-white/55">
          {isLoading ? "Loading fills" : `${filtered.length} ${filtered.length === 1 ? "fill" : "fills"}`}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] py-3">
        <div className="min-w-[180px] flex-1">
          <TextInput
            classNames={searchInputClass}
            aria-label="Search trade fills by pair"
            placeholder="Search pair (e.g. BTCUSDT)"
            value={symbol}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            onChange={(e) => setSymbol(normalizeSymbol(e.currentTarget.value))}
          />
        </div>
        {symbol !== "BTCUSDT" && (
          <button
            type="button"
            className="h-9 rounded-lg px-2 text-xs font-semibold text-white/45 transition-colors hover:text-white"
            onClick={resetPair}
          >
            Reset pair
          </button>
        )}
      </div>

      {isLoading || filtered.length > 0 ? (
        <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="" minHeight={340}>
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
                  <TableTd className="!text-white !font-bold">{getPair(t) !== "—" ? getPair(t) : t.symbol ?? "—"}</TableTd>
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
      ) : (
        <OrdersEmptyState
          title="No trade fills found"
          description={`There are no recent executions for ${symbol}. Try another trading pair or place a spot trade.`}
          actionLabel="Browse spot markets"
          actionHref="/trades/spot"
        />
      )}
    </section>
  );
};