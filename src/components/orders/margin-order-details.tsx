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
  getAmount,
  getPair,
  selectStyles,
  searchInputClass,
  sideTone,
  StatusPill,
  TableCard,
  tableClassNames,
  ChipToggle,
  ResponsiveFilters,
} from "./orders-shared";
import { TransactionDetailsModal } from "@/src/components/transactions/transaction-details-modal";

export const MarginOrderDetails = () => {
  const t = useTranslations("Orders");
  const [filter, setFilter] = useState("Cross");
  const [pair, setPair] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const { data: records, isLoading } = useQuery({
    queryKey: tradingKeys.marginOrderHistory,
    queryFn: () => tradingService.marginOrderHistory(),
    select: (res) => res?.data ?? [],
  });

  const allRecords: any[] = Array.isArray(records) ? records : [];
  const filtered = pair
    ? allRecords.filter((r) => String(getPair(r)).toUpperCase().includes(pair.toUpperCase()))
    : allRecords;

  const fee = (r: any) =>
    [r.cumExecFee, r.fillFee, r.fee, r.commission, r.feeAmount].find(
      (value) => value !== null && value !== undefined && value !== ""
    );
  const filled = (r: any) =>
    [r.cumExecQty, r.filled, r.filledQuantity].find(
      (value) => value !== null && value !== undefined && value !== ""
    );
  const total = (r: any) =>
    [r.cumExecValue, r.total].find(
      (value) => value !== null && value !== undefined && value !== ""
    ) ?? (r.price && r.quantity ? r.price * r.quantity : null);

  return (
    <>
    <TransactionDetailsModal
      transaction={selectedRecord}
      onClose={() => setSelectedRecord(null)}
    />
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] px-5 py-3">
        <ResponsiveFilters>
          <Select
            label={t("orderType")}
            data={[{ value: "Limit / Market", label: t("limitMarket") }]}
            classNames={selectStyles}
            className="w-[150px]"
          />
          <ChipToggle value={filter} options={["Cross", "Isolated"]} onChange={setFilter} labels={{ Cross: t("cross"), Isolated: t("isolated") }} />
        </ResponsiveFilters>
        <div className="flex items-center gap-4">
          <TextInput
            classNames={searchInputClass}
            placeholder={t("searchPair")}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            onChange={(e) => setPair(e.currentTarget.value)}
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setPair("")}
          >
            {t("reset")}
          </button>
        </div>
      </div>

      <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle={t("emptyMarginTradeRecords")}>
        <Table classNames={{ ...tableClassNames, table: "!min-w-[1120px] !table-fixed" }}>
          <TableThead>
            <TableTr>
              <TableTh className="w-[18%] pl-5">{t("date")}</TableTh>
              <TableTh className="w-[14%]">{t("tradingPair")}</TableTh>
              <TableTh className="w-[9%]">{t("side")}</TableTh>
              <TableTh className="w-[13%] text-right">{t("price")}</TableTh>
              <TableTh className="w-[12%] text-right">{t("filledAmount")}</TableTh>
              <TableTh className="w-[12%] text-right">{t("fee")}</TableTh>
              <TableTh className="w-[13%] text-right">{t("total")}</TableTh>
              <TableTh className="w-[9%]">{t("status")}</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {filtered.map((r: any) => (
              <TableTr
                key={r.id}
                onClick={() => setSelectedRecord(r)}
                className="cursor-pointer"
              >
                <TableTd className="pl-5 text-white/50">{fmtDate(r.createdAt)}</TableTd>
                <TableTd className="!text-white !font-bold">{getPair(r)}</TableTd>
                <TableTd className={sideTone(r.side)}>{String(r.side ?? "—").toUpperCase()}</TableTd>
                <TableTd className="whitespace-nowrap text-right font-mono tabular-nums">{fmtNum(r.price)}</TableTd>
                <TableTd className="whitespace-nowrap text-right font-mono tabular-nums">{fmtNum(filled(r) ?? getAmount(r))}</TableTd>
                <TableTd className="whitespace-nowrap text-right font-mono tabular-nums">
                  {fmtNum(fee(r))} <span className="text-white/40">{r.feeCurrency || r.quote || ""}</span>
                </TableTd>
                <TableTd className="whitespace-nowrap text-right font-mono tabular-nums">{fmtNum(total(r))}</TableTd>
                <TableTd><StatusPill status={r.orderStatus ?? r.status} /></TableTd>
              </TableTr>
            ))}
          </TableTbody>
        </Table>
      </TableCard>
    </div>
    </>
  );
};
