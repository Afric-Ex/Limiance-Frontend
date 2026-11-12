"use client";

import { Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { tradingKeys, tradingService } from "@/src/services/trading";
import {
  fmtDate,
  fmtNum,
  searchInputClass,
  StatusPill,
  TableCard,
  tableClassNames,
  ChipToggle,
  ResponsiveFilters,
} from "./orders-shared";

export const CapitalFlow = () => {
  const t = useTranslations("Orders");
  const [filter, setFilter] = useState("Capital Flow");

  const { data: records, isLoading } = useQuery({
    queryKey: tradingKeys.marginBorrowHistory,
    queryFn: () => tradingService.marginBorrowHistory(),
    select: (res) => res?.data ?? [],
  });

  const allRecords: any[] = Array.isArray(records) ? records : [];

  const coin = (r: any) => r.base ?? r.coin ?? r.asset ?? r.symbol ?? "—";
  const amount = (r: any) => r.borrowAmount ?? r.amount ?? r.quantity ?? r.borrowed ?? 0;
  const typeName = (r: any) => (r.type && String(r.type).trim() !== "" ? r.type : (r.transactionType && String(r.transactionType).trim() !== "" ? r.transactionType : (r.isRepay ? "Repayment" : "Borrow")));
  const typeLabel = (raw: string) =>
    raw === "Repayment" ? t("repayment") : raw === "Borrow" ? t("borrow") : raw;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] px-5 py-3">
        <ResponsiveFilters>
          <ChipToggle
            value={filter}
            options={["Capital Flow", "Transfer"]}
            onChange={setFilter}
            labels={{ "Capital Flow": t("capitalFlow"), Transfer: t("transfer") }}
          />
        </ResponsiveFilters>
        <div className="flex items-center gap-4">
          <TextInput
            classNames={searchInputClass}
            placeholder={t("searchCoin")}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setFilter("Capital Flow")}
          >
            {t("reset")}
          </button>
        </div>
      </div>

      <TableCard loading={isLoading} hasData={allRecords.length > 0} emptyTitle={t("emptyCapitalFlow")}>
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">{t("date")}</TableTh>
              <TableTh>{t("coin")}</TableTh>
              <TableTh>{t("amount")}</TableTh>
              <TableTh>{t("type")}</TableTh>
              <TableTh>{t("status")}</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {allRecords.map((r: any, idx: number) => (
              <TableTr key={r.id ?? idx}>
                <TableTd className="pl-5 text-white/50">{fmtDate(r.createdAt)}</TableTd>
                <TableTd className="!text-white !font-bold">{coin(r)}</TableTd>
                <TableTd className="!text-white tabular-nums">{fmtNum(amount(r))}</TableTd>
                <TableTd className="capitalize">{typeLabel(typeName(r))}</TableTd>
                <TableTd><StatusPill status={r.status} /></TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};