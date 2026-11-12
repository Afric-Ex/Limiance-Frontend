"use client";

import { Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { tradingKeys, tradingService } from "@/src/services/trading";
import {
  fmtDateTime,
  fmtNum,
  getPair,
  OrdersEmptyState,
  searchInputClass,
  sideTone,
  TableCard,
  tableClassNames,
} from "./orders-shared";

export const normalizeSymbol = (value: string) =>
  String(value ?? "")
    .replace(/[-/_\\\s]+/g, "")
    .toUpperCase();

export const OrderDetails = () => {
  const t = useTranslations("Orders");
  const [symbol, setSymbol] = useState("BTCUSDT");

  const { data: trades, isLoading } = useQuery({
    queryKey: tradingKeys.spotRecentTrades(symbol),
    queryFn: () => tradingService.spotRecentTrades({ symbol }),
    select: (res) => res?.data ?? [],
  });

  const allTrades: any[] = Array.isArray(trades) ? trades : [];
  const filtered = allTrades;
  const resetPair = () => setSymbol("BTCUSDT");

  const fee = (t2: any) =>
    t2.fee ?? t2.commission ?? (t2.feeAmount !== undefined ? t2.feeAmount : null);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">{t("tradeFills")}</h2>
          <p className="mt-1 text-xs text-white/40">{t("tradeFillsDescription")}</p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium tabular-nums text-white/55">
          {isLoading ? t("loadingFills") : t("fillsCount", { count: filtered.length })}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] px-5 py-3">
        <div className="min-w-[180px] flex-1">
          <TextInput
            classNames={searchInputClass}
            aria-label={t("searchTradeFillsByPair")}
            placeholder={t("searchPairExample")}
            value={symbol}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            onChange={(e) => setSymbol(normalizeSymbol(e.currentTarget.value))}
          />
        </div>
        {symbol !== "BTCUSDT" && (
          <button
            type="button"
            className="h-9 rounded-lg px-2 text-xs font-semibold text-white/45 transition-colors hover:text-white"
            onClick={resetPair}
          >
            {t("resetPair")}
          </button>
        )}
      </div>

      {isLoading || filtered.length > 0 ? (
        <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="" minHeight={340}>
          <Table classNames={tableClassNames}>
            <TableThead>
              <TableTr>
                <TableTh className="pl-5">{t("time")}</TableTh>
                <TableTh>{t("tradingPair")}</TableTh>
                <TableTh>{t("side")}</TableTh>
                <TableTh>{t("price")}</TableTh>
                <TableTh>{t("filledAmount")}</TableTh>
                <TableTh>{t("fee")}</TableTh>
                <TableTh>{t("total")}</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {filtered.map((t2: any, idx: number) => (
                <TableTr key={t2.id ?? t2.tradeId ?? idx}>
                  <TableTd className="pl-5 text-white/50">{fmtDateTime(t2.createdAt ?? t2.time ?? t2.ts)}</TableTd>
                  <TableTd className="!text-white !font-bold">{getPair(t2) !== "—" ? getPair(t2) : t2.symbol ?? "—"}</TableTd>
                  <TableTd className={sideTone(t2.side)}>{String(t2.side ?? "—").toUpperCase()}</TableTd>
                  <TableTd>{fmtNum(t2.price)}</TableTd>
                  <TableTd>{fmtNum(t2.quantity ?? t2.qty ?? t2.filled)}</TableTd>
                  <TableTd>{fmtNum(fee(t2))}</TableTd>
                  <TableTd>{fmtNum(t2.total ?? (t2.price && t2.quantity ? t2.price * t2.quantity : null))}</TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </TableCard>
      ) : (
        <OrdersEmptyState
          title={t("emptyTradeFills")}
          description={t("emptyTradeFillsDescription", { symbol })}
          actionLabel={t("browseSpotMarkets")}
          actionHref="/trades/spot"
        />
      )}
    </section>
  );
};
