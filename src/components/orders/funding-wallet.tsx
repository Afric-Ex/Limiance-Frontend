"use client";

import { useState } from "react";
import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { asset } from "@/src/services/asset";
import { TransactionDetailsModal } from "@/src/components/transactions/transaction-details-modal";
import {
  fmtDateTime,
  fmtNum,
  selectStyles,
  StatusPill,
  TableCard,
  tableClassNames,
  ResponsiveFilters,
} from "./orders-shared";

export const FundingWallet = () => {
  const t = useTranslations("Orders");
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
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] px-5 py-3">
        <ResponsiveFilters>
          <Select
            label={t("time")}
            data={[{ value: "All", label: t("all") }, { value: "Last 7 Days", label: t("last7Days") }, { value: "Last 30 Days", label: t("last30Days") }, { value: "Last 3 Months", label: t("last3Months") }]}
            classNames={selectStyles}
            className="w-[160px]"
          />
          <Select
            label={t("coin")}
            data={[{ value: "All", label: t("all") }, { value: "USDT", label: "USDT" }, { value: "BTC", label: "BTC" }, { value: "ETH", label: "ETH" }]}
            classNames={selectStyles}
            className="w-[140px]"
          />
          <Select
            label={t("transactionType")}
            data={[{ value: "All", label: t("all") }, { value: "Deposit", label: t("deposit") }, { value: "Withdrawal", label: t("withdrawal") }, { value: "P2P Buy", label: t("p2pBuy") }, { value: "P2P Sell", label: t("p2pSell") }]}
            classNames={selectStyles}
            className="w-[170px]"
          />
        </ResponsiveFilters>
      </div>

      <TableCard loading={isLoading} hasData={allRecords.length > 0} emptyTitle={t("emptyFundingTransactions")}>
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">{t("coin")}</TableTh>
              <TableTh>{t("time")}</TableTh>
              <TableTh>{t("transactionType")}</TableTh>
              <TableTh>{t("change")}</TableTh>
              <TableTh>{t("status")}</TableTh>
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
                  <TableTd><StatusPill status={rec.status} /></TableTd>
                </TableTr>
              );
            })}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};