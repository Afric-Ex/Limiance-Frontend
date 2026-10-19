"use client";

import { useState } from "react";
import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { asset } from "@/src/services/asset";
import { TransactionDetailsModal } from "@/src/components/transactions/transaction-details-modal";
import {
  fmtDateTime,
  fmtNum,
  selectStyles,
  StatusPill,
  TableCard,
  tableClassNames,
} from "./orders-shared";

export const FundingWallet = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const { data: records, isLoading } = useQuery({
    queryKey: ["all-transaction-history"],
    queryFn: () => asset.allTransactionHistory(),
    select: (res) => (res as any)?.data ?? [],
  });

  const allRecords: any[] = Array.isArray(records) ? records : [];

  const changeTone = (amount: number) =>
    amount > 0 ? "text-[#25AB42]" : amount < 0 ? "text-[#F6465D]" : "text-white/80";

  return (
    <div className="flex flex-col gap-6">
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
      <div className="flex flex-wrap items-end gap-4 p-4 rounded-2xl bg-[#181a20] border border-white/[0.06]">
        <Select
          label="Time"
          data={["All", "Last 7 Days", "Last 30 Days", "Last 3 Months"]}
          defaultValue="All"
          classNames={selectStyles}
          className="w-[160px]"
        />
        <Select
          label="Coin"
          data={["All", "USDT", "BTC", "ETH"]}
          defaultValue="All"
          classNames={selectStyles}
          className="w-[140px]"
        />
        <Select
          label="Transaction Type"
          data={["All", "Deposit", "Withdrawal", "P2P Buy", "P2P Sell"]}
          defaultValue="All"
          classNames={selectStyles}
          className="w-[170px]"
        />
      </div>

      <TableCard loading={isLoading} hasData={allRecords.length > 0} emptyTitle="No funding transactions found.">
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Coin</TableTh>
              <TableTh>Time</TableTh>
              <TableTh>Transaction Type</TableTh>
              <TableTh>Change</TableTh>
              <TableTh>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {allRecords.map((rec: any, idx: number) => {
              const amount = Number(rec.amount ?? rec.quantity ?? 0);
              return (
                <TableTr
                  key={rec.id ?? idx}
                  onClick={() => setSelectedTransaction(rec)}
                  className="cursor-pointer"
                >
                  <TableTd className="pl-5 !text-white !font-bold">{rec.coin ?? rec.asset ?? "—"}</TableTd>
                  <TableTd className="text-white/50">{fmtDateTime(rec.createdAt)}</TableTd>
                  <TableTd className="capitalize">{rec.type ?? rec.transactionType ?? "—"}</TableTd>
                  <TableTd className={`tabular-nums font-semibold ${changeTone(amount)}`}>
                    {amount > 0 ? `+${fmtNum(amount)}` : fmtNum(amount)}
                  </TableTd>
                  <TableTd><StatusPill status={rec.status} fallback="Completed" /></TableTd>
                </TableTr>
              );
            })}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};