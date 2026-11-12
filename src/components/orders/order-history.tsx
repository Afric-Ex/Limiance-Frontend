"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { Search } from "../icons/search";
import {
  fmtDate,
  fmtNum,
  getAmount,
  getPair,
  getTotal,
  OrdersEmptyState,
  selectStyles,
  searchInputClass,
  sideTone,
  StatusPill,
  TableCard,
  tableClassNames,
  ResponsiveFilters,
} from "./orders-shared";

export const OrderHistory = () => {
  const t = useTranslations("Orders");
  const [query, setQuery] = useState("");
  const [side, setSide] = useState("All");
  const [status, setStatus] = useState("All");

  const { data: response, isLoading } = useQuery({
    queryKey: tradingKeys.orderHistory(),
    queryFn: () => tradingService.spotOrderHistory(),
    select: (res) => res?.data ?? [],
  });

  const orders: any[] = useMemo(() => (Array.isArray(response) ? response : []), [response]);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase();
    return orders.filter((order) => {
      const pairMatch = !normalizedQuery || String(getPair(order)).toUpperCase().includes(normalizedQuery);
      const sideMatch = side === "All" || String(order.side ?? "").toLowerCase() === side.toLowerCase();
      const normalizedStatus = String(order.status ?? "").toLowerCase();
      const statusMatch =
        status === "All" ||
        normalizedStatus === status.toLowerCase() ||
        (status === "Cancelled" && normalizedStatus === "canceled") ||
        (status === "Filled" && ["completed", "fulfilled", "success"].includes(normalizedStatus));
      return pairMatch && sideMatch && statusMatch;
    });
  }, [orders, query, side, status]);

  const resetFilters = () => {
    setQuery("");
    setSide("All");
    setStatus("All");
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">{t("orderHistory")}</h2>
          <p className="mt-1 text-xs text-white/40">{t("orderHistoryDescription")}</p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium tabular-nums text-white/55">
          {isLoading ? t("loadingOrders") : t("ordersCount", { count: filtered.length })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] px-5 py-3">
        <ResponsiveFilters>
          <Select
            aria-label={t("filterBySide")}
            data={[{ value: "All", label: t("all") }, { value: "Buy", label: t("buy") }, { value: "Sell", label: t("sell") }]}
            value={side}
            onChange={(value) => setSide(value ?? "All")}
            classNames={selectStyles}
            className="w-[116px] shrink-0"
          />
          <Select
            aria-label={t("filterByStatus")}
            data={[{ value: "All", label: t("all") }, { value: "Filled", label: t("filled") }, { value: "Cancelled", label: t("cancelled") }, { value: "Expired", label: t("expired") }, { value: "Rejected", label: t("rejected") }]}
            value={status}
            onChange={(value) => setStatus(value ?? "All")}
            classNames={selectStyles}
            className="w-[132px] shrink-0"
          />
        </ResponsiveFilters>
        <TextInput
          aria-label={t("searchByPair")}
          classNames={searchInputClass}
          placeholder={t("searchPair")}
          value={query}
          leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          onChange={(event) => setQuery(event.currentTarget.value)}
          className="min-w-[180px] flex-1"
        />
        {(query || side !== "All" || status !== "All") && (
          <button
            type="button"
            onClick={resetFilters}
            className="h-9 shrink-0 rounded-lg px-2 text-xs font-semibold text-white/45 transition-colors hover:text-white"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      {isLoading || filtered.length > 0 ? (
        <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="" minHeight={340}>
          <Table classNames={tableClassNames}>
            <TableThead>
              <TableTr>
                <TableTh className="pl-5">{t("time")}</TableTh>
                <TableTh>{t("pair")}</TableTh>
                <TableTh>{t("side")}</TableTh>
                <TableTh>{t("type")}</TableTh>
                <TableTh>{t("price")}</TableTh>
                <TableTh>{t("amount")}</TableTh>
                <TableTh>{t("filledAmount")}</TableTh>
                <TableTh>{t("total")}</TableTh>
                <TableTh>{t("status")}</TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {filtered.map((order: any, index) => (
                <TableTr key={order.id ?? order.orderId ?? `${getPair(order)}-${index}`}>
                  <TableTd className="pl-5 text-white/50">{fmtDate(order.createdAt ?? order.time)}</TableTd>
                  <TableTd className="!font-bold !text-white">{getPair(order)}</TableTd>
                  <TableTd className={sideTone(order.side)}>{String(order.side ?? "—").toUpperCase()}</TableTd>
                  <TableTd className="text-white/65">{order.type ?? "—"}</TableTd>
                  <TableTd className="font-mono tabular-nums">{fmtNum(order.price)}</TableTd>
                  <TableTd className="font-mono tabular-nums">{fmtNum(getAmount(order))}</TableTd>
                  <TableTd className="font-mono tabular-nums">{fmtNum(order.filled ?? order.filledQuantity ?? 0)}</TableTd>
                  <TableTd className="font-mono tabular-nums !text-white">{fmtNum(getTotal(order))}</TableTd>
                  <TableTd><StatusPill status={order.status} /></TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </TableCard>
      ) : (
        <OrdersEmptyState
          title={orders.length === 0 ? t("emptySpotOrders") : t("noOrdersMatchFilters")}
          description={
            orders.length === 0
              ? t("emptySpotOrdersDescription")
              : t("noOrdersMatchFiltersDescription")
          }
          actionLabel={orders.length === 0 ? t("placeSpotTrade") : t("clearFilters")}
          actionHref={orders.length === 0 ? "/trades/spot" : undefined}
          onAction={orders.length > 0 ? resetFilters : undefined}
        />
      )}
    </section>
  );
};
