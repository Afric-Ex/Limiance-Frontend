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
  StatusPill,
  TableCard,
  tableClassNames,
  ChipToggle,
} from "./orders-shared";

const filters = ["Borrowing", "Repayment", "Interest"];

export const DebtHistory = () => {
  const [filter, setFilter] = useState("Borrowing");

  const { data: records, isLoading } = useQuery({
    queryKey: tradingKeys.marginBorrowHistory,
    queryFn: () => tradingService.marginBorrowHistory(),
    select: (res) => res.data,
  });

  const allRecords: any[] = Array.isArray(records) ? records : [];

  const coin = (r: any) => r.coin ?? r.asset ?? r.symbol ?? getPair(r);
  const borrowed = (r: any) => r.amount ?? r.quantity ?? r.borrowed ?? r.principal ?? 0;
  const interest = (r: any) => (r.interest !== undefined ? r.interest : 0);
  const category = (r: any) => r.category ?? r.type ?? (r.isRepay ? "Repayment" : "Borrowing");

  const display = allRecords.filter((r) => {
    const cat = String(category(r)).toLowerCase();
    if (filter === "Interest") return cat.includes("interest");
    if (filter === "Repayment") return cat.includes("repay");
    return cat.includes("borrow") || cat.includes("debt") || cat.includes("loan");
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-4 rounded-2xl bg-[#181a20] border border-white/[0.06]">
        <div className="flex flex-wrap gap-4 items-end">
          <ChipToggle value={filter} options={filters} onChange={setFilter} />
          <Select
            label="Coin"
            data={["All"]}
            classNames={selectStyles}
            className="w-[120px]"
          />
        </div>
        <div className="flex items-center gap-4">
          <TextInput
            classNames={searchInputClass}
            placeholder="Search..."
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setFilter("Borrowing")}
          >
            Reset
          </button>
        </div>
      </div>

      <TableCard loading={isLoading} hasData={display.length > 0} emptyTitle="No debt history found.">
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Coin</TableTh>
              <TableTh>Date</TableTh>
              <TableTh>Borrowing</TableTh>
              <TableTh>Interest</TableTh>
              <TableTh>Sum</TableTh>
              <TableTh>Category</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {display.map((r: any, idx: number) => {
              const principal = Number(borrowed(r)) || 0;
              const int = Number(interest(r)) || 0;
              return (
                <TableTr key={r.id ?? idx}>
                  <TableTd className="pl-5 !text-white !font-bold">{coin(r)}</TableTd>
                  <TableTd className="text-white/50">{fmtDate(r.createdAt)}</TableTd>
                  <TableTd className="tabular-nums">{fmtNum(principal)}</TableTd>
                  <TableTd className="tabular-nums">{fmtNum(int)}</TableTd>
                  <TableTd className="!text-white tabular-nums">{fmtNum(principal + int)}</TableTd>
                  <TableTd><StatusPill status={category(r)} /></TableTd>
                </TableTr>
              );
            })}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};