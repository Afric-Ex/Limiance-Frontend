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
  searchInputClass,
  selectStyles,
  sideTone,
  TableCard,
  tableClassNames,
  ChipToggle,
} from "./orders-shared";

const filters = ["Liquidation Orders", "Liquidation History"];

export const Liquidation = () => {
  const [filter, setFilter] = useState("Liquidation Orders");

  const { data: records, isLoading } = useQuery({
    queryKey: tradingKeys.marginLiquidationHistory,
    queryFn: () => tradingService.marginLiquidationHistory(),
    select: (res) => res.data,
  });

  const allRecords: any[] = Array.isArray(records) ? records : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-4 rounded-2xl bg-[#181a20] border border-white/[0.06]">
        <div className="flex flex-wrap gap-4 items-end">
          <ChipToggle value={filter} options={filters} onChange={setFilter} />
          <Select
            label="Trading Pair"
            data={["All"]}
            classNames={selectStyles}
            className="w-[140px]"
          />
        </div>
        <div className="flex items-center gap-4">
          <TextInput
            classNames={searchInputClass}
            placeholder="Search pair..."
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setFilter("Liquidation Orders")}
          >
            Reset
          </button>
        </div>
      </div>

      <TableCard loading={isLoading} hasData={allRecords.length > 0} emptyTitle="No liquidation records found.">
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Coin</TableTh>
              <TableTh>Trading Pair</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Date</TableTh>
              <TableTh>Price</TableTh>
              <TableTh>Executed</TableTh>
              <TableTh>Amount</TableTh>
              <TableTh>Total</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {allRecords.map((r: any, idx: number) => {
              const price = Number(r.price ?? r.liquidationPrice ?? 0) || 0;
              const qty = Number(r.quantity ?? r.executed ?? r.filled ?? 0) || 0;
              return (
                <TableTr key={r.id ?? idx}>
                  <TableTd className="pl-5 !text-white !font-bold">{r.coin ?? r.asset ?? getPair(r)}</TableTd>
                  <TableTd>{getPair(r)}</TableTd>
                  <TableTd className={sideTone(r.side)}>{String(r.side ?? "LIQUIDATED").toUpperCase()}</TableTd>
                  <TableTd className="text-white/50">{fmtDate(r.createdAt ?? r.time)}</TableTd>
                  <TableTd className="tabular-nums">{fmtNum(price)}</TableTd>
                  <TableTd className="tabular-nums">{fmtNum(qty)}</TableTd>
                  <TableTd className="tabular-nums">{fmtNum(r.amount ?? qty)}</TableTd>
                  <TableTd className="tabular-nums">{fmtNum(price * qty)}</TableTd>
                </TableTr>
              );
            })}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};