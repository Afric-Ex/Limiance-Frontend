"use client";

import { Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { asset, assetKeys } from "@/src/services/asset";
import {
  fmtDateTime,
  fmtNum,
  searchInputClass,
  StatusPill,
  TableCard,
  tableClassNames,
  ChipToggle,
} from "./orders-shared";
import { truncateCryptoAddress, isZeroAddress } from "@/src/utils/truncate-address";
import { TransactionDetailsModal } from "@/src/components/transactions/transaction-details-modal";

export const Crypto = () => {
  const [type, setType] = useState<"Deposit" | "Withdrawal">("Deposit");
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: assetKeys.transactionHistory({ transaction_type: type.toLowerCase() }),
    queryFn: () => asset.transactionHistory({ transaction_type: type.toLowerCase() as "deposit" | "withdrawal" }),
    select: (res) => res?.data ?? [],
  });

  const allHistory: any[] = Array.isArray(history) ? history : [];

  return (
    <div className="flex flex-col gap-6">
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-4 rounded-2xl bg-[#181a20] border border-white/[0.06]">
        <ChipToggle value={type} options={["Deposit", "Withdrawal"]} onChange={(v) => setType(v as "Deposit" | "Withdrawal")} />
        <div className="flex items-center gap-4">
          <TextInput
            classNames={searchInputClass}
            placeholder="Search..."
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setType("Deposit")}
          >
            Reset
          </button>
        </div>
      </div>

      <TableCard
        loading={isLoading}
        hasData={allHistory.length > 0}
        emptyTitle="No transaction records found."
      >
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Time</TableTh>
              <TableTh>Type</TableTh>
              <TableTh>Wallet</TableTh>
              <TableTh>Coin</TableTh>
              <TableTh>Amount</TableTh>
              <TableTh>Destination</TableTh>
              <TableTh>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {allHistory.map((tx: any, idx: number) => (
              <TableTr
                key={tx.id ?? idx}
                onClick={() => setSelectedTransaction(tx)}
                className="cursor-pointer"
              >
                <TableTd className="pl-5 text-white/50">{fmtDateTime(tx.createdAt)}</TableTd>
                <TableTd className="capitalize">{tx.type ?? type}</TableTd>
                <TableTd>
                  {(() => {
                    const wallet = String(tx.wallet ?? "").trim();
                    if (!wallet || isZeroAddress(wallet)) return "—";
                    return <span title={wallet}>{truncateCryptoAddress(wallet)}</span>;
                  })()}
                </TableTd>
                <TableTd className="!text-white !font-bold">{tx.coin ?? tx.asset ?? "—"}</TableTd>
                <TableTd className="tabular-nums !text-white">{fmtNum(tx.amount)}</TableTd>
                <TableTd className="font-mono text-xs !text-white/60">
                  {(() => {
                    const destination = String(tx.destination ?? tx.address ?? "").trim();
                    // The all-zero address is the backend's "not set" placeholder —
                    // printing 42 zeroes wraps the row and means nothing to users.
                    if (!destination || isZeroAddress(destination)) return "—";
                    return (
                      <span title={destination}>{truncateCryptoAddress(destination)}</span>
                    );
                  })()}
                </TableTd>
                <TableTd><StatusPill status={tx.status} fallback="Completed" /></TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};