"use client";

import { Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { asset, assetKeys } from "@/src/services/asset";
import {
  fmtDateTime,
  fmtNum,
  searchInputClass,
  StatusPill,
  TableCard,
  tableClassNames,
  ChipToggle,
  ResponsiveFilters,
} from "./orders-shared";
import { truncateCryptoAddress, isZeroAddress } from "@/src/utils/truncate-address";
import { TransactionDetailsModal } from "@/src/components/transactions/transaction-details-modal";

const readMetadata = (value: unknown): Record<string, any> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const displayAddress = (value: unknown) => {
  const address = String(value ?? "").trim();
  return address.length > 16 ? truncateCryptoAddress(address) : address;
};

export const Crypto = () => {
  const t = useTranslations("Orders");
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
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] px-5 py-3">
        <ResponsiveFilters>
          <ChipToggle value={type} options={["Deposit", "Withdrawal"]} onChange={(v) => setType(v as "Deposit" | "Withdrawal")} labels={{ Deposit: t("deposit"), Withdrawal: t("withdrawal") }} />
        </ResponsiveFilters>
        <div className="flex items-center gap-4">
          <TextInput
            classNames={searchInputClass}
            placeholder={t("search")}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setType("Deposit")}
          >
            {t("reset")}
          </button>
        </div>
      </div>

      <TableCard
        loading={isLoading}
        hasData={allHistory.length > 0}
        emptyTitle={t("emptyTransactionRecords")}
      >
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">{t("time")}</TableTh>
              <TableTh>{t("type")}</TableTh>
              <TableTh>{t("wallet")}</TableTh>
              <TableTh>{t("coin")}</TableTh>
              <TableTh>{t("amount")}</TableTh>
              <TableTh>{t("destination")}</TableTh>
              <TableTh>{t("status")}</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {allHistory.map((tx: any, idx: number) => {
              const metadata = readMetadata(tx.metadata);
              const isWithdrawal = String(tx.type ?? type).toLowerCase().includes("withdraw");
              const wallet = String(
                tx.walletAddress ??
                  tx.wallet_address ??
                  tx.wallet ??
                  (isWithdrawal
                    ? tx.fromBalance ?? tx.fromAddress
                    : tx.toBalance ?? metadata.depositAddress) ??
                  ""
              ).trim();
              const destination = String(
                tx.destination ??
                  tx.address ??
                  tx.toAddress ??
                  metadata.destination ??
                  metadata.withdrawalAddress ??
                  metadata.depositAddress ??
                  tx.toBalance ??
                  ""
              ).trim();
              const coin = String(
                metadata.asset ?? tx.coin ?? tx.asset ?? metadata.symbol ?? metadata.token ?? ""
              ).trim();

              return (
              <TableTr
                key={tx.id ?? idx}
                onClick={() => setSelectedTransaction(tx)}
                className="cursor-pointer hover:!bg-white/[0.03]"
              >
                <TableTd className="pl-5 text-white/50">{fmtDateTime(tx.createdAt)}</TableTd>
                <TableTd className="capitalize">{tx.type ?? (type === "Deposit" ? t("deposit") : t("withdrawal"))}</TableTd>
                <TableTd>
                  {(() => {
                    if (!wallet || isZeroAddress(wallet)) return "—";
                    return <span title={wallet}>{displayAddress(wallet)}</span>;
                  })()}
                </TableTd>
                <TableTd className="!text-white !font-bold">
                  <span title={coin}>{coin ? displayAddress(coin) : "—"}</span>
                </TableTd>
                <TableTd className="tabular-nums !text-white">{fmtNum(tx.amount)}</TableTd>
                <TableTd className="font-mono text-xs !text-white/60">
                  {(() => {
                    // The all-zero address is the backend's "not set" placeholder —
                    // printing 42 zeroes wraps the row and means nothing to users.
                    if (!destination || isZeroAddress(destination)) return "—";
                    return (
                      <span title={destination}>{displayAddress(destination)}</span>
                    );
                  })()}
                </TableTd>
                <TableTd><StatusPill status={tx.status} /></TableTd>
              </TableTr>
              );
            })}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};