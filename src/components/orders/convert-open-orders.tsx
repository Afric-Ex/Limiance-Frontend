"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import {
  fmtDateTime,
  fmtNum,
  selectStyles,
  StatusPill,
  TableCard,
  tableClassNames,
  ResponsiveFilters,
} from "./orders-shared";

const TERMINAL = new Set(["completed", "success", "successful", "filled", "cancelled", "canceled", "rejected", "failed", "expired"]);

export const ConvertOpenOrders = () => {
  const { data: history, isLoading } = useQuery({
    queryKey: tradingKeys.convertHistory,
    queryFn: () => tradingService.convertHistory(),
    select: (res) => res?.data ?? [],
  });

  const allHistory: any[] = Array.isArray(history) ? history : [];
  const openRecords = allHistory.filter((i) => !TERMINAL.has(String(i.status ?? "").toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] py-3">
        <ResponsiveFilters>
          <Select
            label="Wallet"
            data={["All", "Spot", "Funding"]}
            classNames={selectStyles}
            className="w-[140px]"
          />
        </ResponsiveFilters>
      </div>

      <TableCard loading={isLoading} hasData={openRecords.length > 0} emptyTitle="No open conversions right now.">
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Conversion Time</TableTh>
              <TableTh>Wallet</TableTh>
              <TableTh>Trading Pair</TableTh>
              <TableTh>From</TableTh>
              <TableTh>To</TableTh>
              <TableTh>Price</TableTh>
              <TableTh>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {openRecords.map((item: any) => (
              <TableTr key={item.id}>
                <TableTd className="pl-5 text-white/50">{fmtDateTime(item.createdAt)}</TableTd>
                <TableTd className="capitalize">{item.wallet ?? "Spot"}</TableTd>
                <TableTd className="!text-white !font-bold">{item.from}/{item.to}</TableTd>
                <TableTd className="!text-[#F6465D]">- {fmtNum(item.fromAmount)} {item.from}</TableTd>
                <TableTd className="!text-[#25AB42]">+ {fmtNum(item.toAmount)} {item.to}</TableTd>
                <TableTd className="tabular-nums">{fmtNum(item.rate)}</TableTd>
                <TableTd><StatusPill status={item.status} /></TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};