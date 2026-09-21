"use client";

import { Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import {
  fmtDate,
  fmtNum,
  searchInputClass,
  StatusPill,
  TableCard,
  tableClassNames,
  ChipToggle,
} from "./orders-shared";

const filters = ["Capital Flow", "Transfer"];

export const CapitalFlow = () => {
  const [filter, setFilter] = useState("Capital Flow");

  const { data: records, isLoading } = useQuery({
    queryKey: tradingKeys.marginBorrowHistory,
    queryFn: () => tradingService.marginBorrowHistory(),
    select: (res) => res.data,
  });

  const allRecords: any[] = Array.isArray(records) ? records : [];

  const coin = (r: any) => r.coin ?? r.asset ?? r.symbol ?? "—";
  const amount = (r: any) => r.amount ?? r.quantity ?? r.borrowed ?? 0;
  const typeName = (r: any) => r.type ?? r.transactionType ?? (r.isRepay ? "Repayment" : "Borrow");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-4 rounded-2xl bg-[#181a20] border border-white/[0.06]">
        <ChipToggle value={filter} options={filters} onChange={setFilter} />
        <div className="flex items-center gap-4">
          <TextInput
            classNames={searchInputClass}
            placeholder="Search coin..."
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setFilter("Capital Flow")}
          >
            Reset
          </button>
        </div>
      </div>

      <TableCard loading={isLoading} hasData={allRecords.length > 0} emptyTitle="No capital flow records found.">
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Date</TableTh>
              <TableTh>Coin</TableTh>
              <TableTh>Amount</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {allRecords.map((r: any, idx: number) => (
              <TableTr key={r.id ?? idx}>
                <TableTd className="pl-5 text-white/50">{fmtDate(r.createdAt)}</TableTd>
                <TableTd className="!text-white !font-bold">{coin(r)}</TableTd>
                <TableTd className="!text-white tabular-nums">{fmtNum(amount(r))}</TableTd>
                <TableTd className="capitalize">{typeName(r)}</TableTd>
                <TableTd><StatusPill status={r.status} fallback="Completed" /></TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};