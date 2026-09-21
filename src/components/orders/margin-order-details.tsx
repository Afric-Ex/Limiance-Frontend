"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import {
  fmtDate,
  fmtNum,
  getAmount,
  getPair,
  selectStyles,
  searchInputClass,
  sideTone,
  TableCard,
  tableClassNames,
  ChipToggle,
} from "./orders-shared";

const filters = ["Cross", "Isolated"];

export const MarginOrderDetails = () => {
  const [filter, setFilter] = useState("Cross");
  const [pair, setPair] = useState("");

  const { data: records, isLoading } = useQuery({
    queryKey: tradingKeys.marginOrderHistory,
    queryFn: () => tradingService.marginOrderHistory(),
    select: (res) => res.data,
  });

  const allRecords: any[] = Array.isArray(records) ? records : [];
  const filtered = pair
    ? allRecords.filter((r) => String(getPair(r)).toUpperCase().includes(pair.toUpperCase()))
    : allRecords;

  const fee = (r: any) =>
    r.fee ?? r.commission ?? (r.feeAmount !== undefined ? r.feeAmount : null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-4 rounded-2xl bg-[#181a20] border border-white/[0.06]">
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="Order"
            data={["Limit / Market"]}
            defaultValue="Limit / Market"
            classNames={selectStyles}
            className="w-[150px]"
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

      <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="No margin trade records found.">
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Date</TableTh>
              <TableTh>Trading Pair</TableTh>
              <TableTh>Side</TableTh>
              <TableTh>Price</TableTh>
              <TableTh>Filled</TableTh>
              <TableTh>Fee</TableTh>
              <TableTh>Total</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {filtered.map((r: any) => (
              <TableTr key={r.id}>
                <TableTd className="pl-5 text-white/50">{fmtDate(r.createdAt)}</TableTd>
                <TableTd className="!text-white !font-bold">{getPair(r)}</TableTd>
                <TableTd className={sideTone(r.side)}>{String(r.side ?? "—").toUpperCase()}</TableTd>
                <TableTd>{fmtNum(r.price)}</TableTd>
                <TableTd>{fmtNum(r.filled ?? getAmount(r))}</TableTd>
                <TableTd>{fmtNum(fee(r))}</TableTd>
                <TableTd>{fmtNum(r.total ?? (r.price && r.quantity ? r.price * r.quantity : null))}</TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};