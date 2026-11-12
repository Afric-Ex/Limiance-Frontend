"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { tradingKeys, tradingService } from "@/src/services/trading";
import {
  fmtDateTime,
  fmtNum,
  searchInputClass,
  selectStyles,
  sideTone,
  StatusPill,
  TableCard,
  tableClassNames,
  ResponsiveFilters,
} from "./orders-shared";

export const FiatBuySell = () => {
  const t = useTranslations("Orders");
  const [query, setQuery] = useState("");

  const { data: history, isLoading } = useQuery({
    queryKey: tradingKeys.fiatOrderHistory,
    queryFn: () => tradingService.fiatOrderHistory(),
    select: (res) => res?.data ?? [],
  });

  const allHistory: any[] = Array.isArray(history) ? history : [];
  const filtered = query
    ? allHistory.filter((i) => String(i.id ?? "").includes(query))
    : allHistory;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3 border-y border-white/[0.08] px-5 py-3">
        <ResponsiveFilters>
          <Select
            label={t("coin")}
            data={[{ value: "All", label: t("all") }]}
            classNames={selectStyles}
            className="w-[120px]"
          />
          <Select
            label={t("category")}
            data={[{ value: "All", label: t("all") }, { value: "Buy", label: t("buy") }, { value: "Sell", label: t("sell") }]}
            classNames={selectStyles}
            className="w-[130px]"
          />
          <Select
            label={t("time")}
            data={[{ value: "All", label: t("all") }, { value: "Last 7 Days", label: t("last7Days") }, { value: "Last 30 Days", label: t("last30Days") }]}
            classNames={selectStyles}
            className="w-[130px]"
          />
          <Select
            label={t("currency")}
            data={["USD", "NGN", "EUR", "GBP"]}
            classNames={selectStyles}
            className="w-[110px]"
          />
        </ResponsiveFilters>
        <div className="flex min-w-0 flex-1 items-end gap-3">
          <TextInput
            classNames={searchInputClass}
            placeholder={t("searchOrderNo")}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            onChange={(e) => setQuery(e.currentTarget.value)}
            className="min-w-[220px] flex-1"
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setQuery("")}
          >
            {t("reset")}
          </button>
        </div>
      </div>

      <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle={t("emptyFiatOrders")}>
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">{t("orderId")}</TableTh>
              <TableTh>{t("time")}</TableTh>
              <TableTh>{t("category")}</TableTh>
              <TableTh>{t("price")}</TableTh>
              <TableTh>{t("fiatCryptoAmount")}</TableTh>
              <TableTh>{t("received")}</TableTh>
              <TableTh>{t("status")}</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {filtered.map((item: any) => (
              <TableTr key={item.id}>
                <TableTd className="pl-5 font-mono text-xs !text-white/70">{item.id}</TableTd>
                <TableTd className="text-white/50">{fmtDateTime(item.createdAt)}</TableTd>
                <TableTd className={sideTone(item.type)}>{String(item.type ?? "—").toUpperCase()}</TableTd>
                <TableTd className="tabular-nums">{item.rate ? fmtNum(item.rate) : "—"}</TableTd>
                <TableTd className="tabular-nums">
                  {item.fiatAmount ? `${fmtNum(item.fiatAmount)} ${item.currency ?? ""}`.trim() : "—"}
                </TableTd>
                <TableTd className="tabular-nums">
                  {item.assetAmount ? `${fmtNum(item.assetAmount)} ${item.asset ?? ""}`.trim() : "—"}
                </TableTd>
                <TableTd><StatusPill status={item.status} /></TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};