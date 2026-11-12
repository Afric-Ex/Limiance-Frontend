"use client";

import { Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useState } from "react";
import { Search } from "../icons/search";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { cancelSpotOrderWs } from "@/src/lib/order-ws";
import { successNotification } from "@/src/lib/notification-handler";
import { errorMessageHandler } from "@/src/lib/error-handler";
import clsx from "clsx";
import {
  fmtDate,
  fmtNum,
  getAmount,
  getPair,
  getTotal,
  OrdersEmptyState,
  searchInputClass,
  sideTone,
  TableCard,
  tableClassNames,
  ResponsiveFilters,
} from "./orders-shared";

export const OpenTab = () => {
  const t = useTranslations("Orders");
  const queryClient = useQueryClient();
  const [side, setSide] = useState("All");
  const [pair, setPair] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: tradingKeys.openOrders(),
    queryFn: () => tradingService.fetchOpenOrders(),
    select: (res) => res?.data ?? [],
  });

  const { mutate: cancelOrder } = useMutation({
    mutationFn: (orderId: string): Promise<any> => cancelSpotOrderWs(orderId),
    onSuccess: () => {
      successNotification(t("orderCancelled"));
      queryClient.invalidateQueries({ queryKey: tradingKeys.openOrders() });
      queryClient.invalidateQueries({ queryKey: ["order-history"] });
    },
    onError: (e: any) => errorMessageHandler(e),
  });

  const allOrders: any[] = Array.isArray(orders) ? orders : [];
  const hasActiveFilters = Boolean(pair) || side !== "All";
  const filtered = allOrders.filter((o) => {
    const pairMatch = !pair || String(getPair(o)).toUpperCase().includes(pair.toUpperCase());
    const sideMatch = side === "All" || String(o.side ?? "").toLowerCase() === side.toLowerCase();
    return pairMatch && sideMatch;
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">{t("openOrders")}</h2>
          <p className="mt-1 text-xs text-white/45">{t("openOrdersDescription")}</p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-medium tabular-nums text-white/55">
          {!isLoading && filtered.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-buy" />}
          {isLoading ? t("loading") : t("activeCount", { count: filtered.length })}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] px-5 py-3">
        <ResponsiveFilters>
          <div role="group" aria-label={t("filterBySide")} className="inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-white/[0.035] p-1">
            {[{ value: "All", label: t("all") }, { value: "Buy", label: t("buy") }, { value: "Sell", label: t("sell") }].map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={side === item.value}
                onClick={() => setSide(item.value)}
                className={clsx(
                  "h-8 rounded-md px-3 text-xs font-semibold transition-colors",
                  side === item.value
                    ? clsx(
                        "bg-white/[0.09]",
                        item.value === "Buy" ? "text-buy" : item.value === "Sell" ? "text-sell" : "text-white"
                      )
                    : "text-white/45 hover:text-white/80"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </ResponsiveFilters>
        <div className="min-w-[150px] flex-1">
          <TextInput
            classNames={searchInputClass}
            aria-label={t("searchByPair")}
            placeholder={t("searchPair")}
            value={pair}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            onChange={(e) => setPair(e.currentTarget.value)}
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            className="h-9 shrink-0 rounded-lg px-2 text-xs font-semibold text-white/45 transition-colors hover:text-white"
            onClick={() => { setPair(""); setSide("All"); }}
          >
            {t("reset")}
          </button>
        )}
      </div>

      {isLoading || filtered.length > 0 ? (
        <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="">
          <Table classNames={tableClassNames}>
            <TableThead>
              <TableTr>
                <TableTh className="pl-5">{t("pair")}</TableTh>
                <TableTh>{t("side")}</TableTh>
                <TableTh>{t("type")}</TableTh>
                <TableTh>{t("price")}</TableTh>
                <TableTh>{t("amount")}</TableTh>
                <TableTh>{t("filledAmount")}</TableTh>
                <TableTh>{t("total")}</TableTh>
                <TableTh>{t("time")}</TableTh>
                <TableTh className="pr-5 text-right">{t("action")}</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {filtered.map((order: any) => (
                <TableTr key={order.id}>
                  <TableTd className="pl-5 !text-white !font-bold">{getPair(order)}</TableTd>
                  <TableTd className={sideTone(order.side)}>
                    {String(order.side ?? "—").toUpperCase()}
                  </TableTd>
                  <TableTd>{order.type ?? "—"}</TableTd>
                  <TableTd>{fmtNum(order.price)}</TableTd>
                  <TableTd>{fmtNum(getAmount(order))}</TableTd>
                  <TableTd>{fmtNum(order.filled ?? order.filledQuantity ?? 0)}</TableTd>
                  <TableTd>{fmtNum(getTotal(order))}</TableTd>
                  <TableTd className="text-white/50">{fmtDate(order.createdAt)}</TableTd>
                  <TableTd className="pr-5 text-right">
                    <button
                      className="text-[#F6465D] hover:text-[#F6465D]/80 bg-[#F6465D]/10 hover:bg-[#F6465D]/20 transition-all font-semibold text-xs px-3 py-1.5 rounded-lg active:scale-95"
                      onClick={() => cancelOrder(order.id)}
                    >
                      {t("cancel")}
                    </button>
                  </TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </TableCard>
      ) : (
        <OrdersEmptyState
          title={allOrders.length === 0 ? t("caughtUpTitle") : t("noOrdersMatchFilters")}
          description={
            allOrders.length === 0
              ? t("caughtUpDescription")
              : t("noOrdersMatchFiltersDescription")
          }
          actionLabel={allOrders.length === 0 ? t("startTrading") : t("resetFilters")}
          actionHref={allOrders.length === 0 ? "/trades/spot" : undefined}
          onAction={allOrders.length > 0 ? () => { setPair(""); setSide("All"); } : undefined}
        />
      )}
    </section>
  );
};
