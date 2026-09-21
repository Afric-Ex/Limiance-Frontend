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
  searchInputClass,
  sideTone,
  StatusPill,
  TableCard,
  tableClassNames,
  ChipToggle,
} from "./orders-shared";

const filters = ["Cross", "Isolated"];

export const MarginRecords = () => {
  const [filter, setFilter] = useState("Cross");
  const [pair, setPair] = useState("");

  const { data: records, isLoading } = useQuery({
    queryKey: tradingKeys.marginOrderHistory,
    queryFn: () => tradingService.marginOrderHistory(),
    select: (res) => res?.data ?? [],
  });

  const allRecords: any[] = Array.isArray(records) ? records : [];
  const filtered = pair
    ? allRecords.filter((r) => String(getPair(r)).toUpperCase().includes(pair.toUpperCase()))
    : allRecords;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-4 rounded-2xl bg-[#181a20] border border-white/[0.06]">
        <ChipToggle value={filter} options={filters} onChange={setFilter} />
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

      <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="No margin records found.">
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Pair</TableTh>
              <TableTh>Side</TableTh>
              <TableTh>Time</TableTh>
              <TableTh>Price</TableTh>
              <TableTh>Quantity</TableTh>
              <TableTh>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {filtered.map((rec: any, idx: number) => (
              <TableTr key={rec.id ?? idx}>
                <TableTd className="pl-5 !text-white !font-bold">{getPair(rec)}</TableTd>
                <TableTd className={sideTone(rec.side)}>{rec.side ?? "—"}</TableTd>
                <TableTd className="text-white/50">{fmtDateTime(rec.createdAt)}</TableTd>
                <TableTd className="tabular-nums">{fmtNum(rec.price)}</TableTd>
                <TableTd className="tabular-nums">{fmtNum(rec.quantity ?? rec.amount)}</TableTd>
                <TableTd><StatusPill status={rec.status} fallback="Closed" /></TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};