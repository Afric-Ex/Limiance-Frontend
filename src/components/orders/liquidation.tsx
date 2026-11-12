"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { tradingKeys, tradingService } from "@/src/services/trading";
import {
  fmtDate,
  fmtNum,
  getPair,
  searchInputClass,
  selectStyles,
  sideTone,
  TableCard,
  tableClassNames,
  ChipToggle,
  ResponsiveFilters,
} from "./orders-shared";

export const Liquidation = () => {
  const t = useTranslations("Orders");
  const [filter, setFilter] = useState("Liquidation Orders");

  const { data: records, isLoading } = useQuery({
    queryKey: tradingKeys.marginLiquidationHistory,
    queryFn: () => tradingService.marginLiquidationHistory(),
    select: (res) => res?.data ?? [],
  });

  const allRecords: any[] = Array.isArray(records) ? records : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] px-5 py-3">
        <ResponsiveFilters>
          <ChipToggle value={filter} options={["Liquidation Orders", "Liquidation History"]} onChange={setFilter} labels={{ "Liquidation Orders": t("liquidationOrders"), "Liquidation History": t("liquidationHistory") }} />
          <Select
            label={t("tradingPair")}
            data={[{ value: "All", label: t("all") }]}
            classNames={selectStyles}
            className="w-[140px]"
          />
        </ResponsiveFilters>
        <div className="flex items-center gap-4">
          <TextInput
            classNames={searchInputClass}
            placeholder={t("searchPair")}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setFilter("Liquidation Orders")}
          >
            {t("reset")}
          </button>
        </div>
      </div>

      <TableCard loading={isLoading} hasData={allRecords.length > 0} emptyTitle={t("emptyLiquidationRecords")}>
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">{t("coin")}</TableTh>
              <TableTh>{t("tradingPair")}</TableTh>
              <TableTh>{t("type")}</TableTh>
              <TableTh>{t("date")}</TableTh>
              <TableTh>{t("price")}</TableTh>
              <TableTh>{t("executed")}</TableTh>
              <TableTh>{t("amount")}</TableTh>
              <TableTh>{t("total")}</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {allRecords.map((r: any, idx: number) => {
              const price = Number(r.price ?? r.liquidationPrice ?? 0) || 0;
              const qty = Number(r.quantity ?? r.executed ?? r.filled ?? 0) || 0;
              return (
                <TableTr key={r.id ?? idx}>
                  <TableTd className="pl-5 !text-white !font-bold">{r.coin ?? r.asset ?? getPair(r)}</TableTd>
                  <TableTd>{getPair(r)}</TableTd>
                  <TableTd className={sideTone(r.side)}>{r.side ? String(r.side).toUpperCase() : t("liquidated")}</TableTd>
                  <TableTd className="text-white/50">{fmtDate(r.createdAt ?? r.time)}</TableTd>
                  <TableTd className="tabular-nums">{fmtNum(price)}</TableTd>
                  <TableTd className="tabular-nums">{fmtNum(qty)}</TableTd>
                  <TableTd className="tabular-nums">{fmtNum(r.amount ?? qty)}</TableTd>
                  <TableTd className="tabular-nums">{fmtNum(price * qty)}</TableTd>
                </TableTr>
              );
            })}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
  );
};