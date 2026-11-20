"use client";

import { useMemo, useState } from "react";
import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { readList } from "@/src/lib/api-response";
import { fmtDate, OrdersEmptyState, parseDate, ResponsiveFilters, TableCard, tableClassNames } from "./orders-shared";
import { ConvertHistoryShare } from "@/src/components/snapshot/convert-history-share";

function parseMeta(raw: unknown): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Record<string, any>;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

function formatWalletLabel(balance: string): string {
  const b = balance.toLowerCase();
  if (b.includes("funding")) return "Funding";
  if (b.includes("margin")) return "Margin";
  if (b.includes("futures")) return "Futures";
  return "Spot";
}

export const ConvertTable = () => {
  const t = useTranslations("Orders");
  const [coinFilter, setCoinFilter] = useState<string>("All");
  const [timeFilter, setTimeFilter] = useState<string>("Last 30 Days");
  const [walletFilter, setWalletFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: history, isLoading } = useQuery({
    queryKey: tradingKeys.convertHistory,
    queryFn: () =>
      tradingService.convertHistory(),
    select: (res) => readList<any>(res),
    refetchOnMount: "always",
  });

  const normalizedRows = useMemo(() => {
    const rawList = Array.isArray(history) ? history : [];
    return rawList.map((item: any) => {
      const meta = parseMeta(item.metadata);
      const from = String(item.fromAsset ?? item.from_asset ?? meta.from_asset ?? item.from ?? item.asset ?? "").toUpperCase();
      const to = String(item.toAsset ?? item.to_asset ?? meta.to_asset ?? item.to ?? "").toUpperCase();
      const fromAmount = item.fromAmount ?? item.from_amount ?? meta.from_amount ?? item.amount ?? "0";
      const toAmount = item.toAmount ?? item.to_amount ?? meta.to_amount ?? "0";
      const numericRate = Number(
        item.rate ??
          meta.rate ??
          (Number(fromAmount) > 0 && Number(toAmount) > 0 ? Number(toAmount) / Number(fromAmount) : 0)
      );
      const wallet = formatWalletLabel(
        String(item.fromBalance ?? item.from_balance ?? item.toBalance ?? item.to_balance ?? "spot")
      );
      const createdRaw = item.createdAt ?? item.created_at ?? item.completedAt ?? item.completed_at;
      const createdDate = parseDate(createdRaw);
      return {
        ...item,
        from,
        to,
        fromAmount,
        toAmount,
        rate: Number.isFinite(numericRate) ? numericRate : 0,
        wallet,
        createdRaw,
        createdMs: createdDate ? createdDate.getTime() : 0,
      };
    });
  }, [history]);

  const coinOptions = useMemo(() => {
    const coins = new Set<string>();
    for (const row of normalizedRows) {
      if (row.from) coins.add(row.from);
      if (row.to) coins.add(row.to);
    }
    return [
      { value: "All", label: t("all") },
      ...[...coins].sort().map((c) => ({ value: c, label: c })),
    ];
  }, [normalizedRows, t]);

  const filteredHistory = useMemo(() => {
    const now = Date.now();
    const cutoffMs =
      timeFilter === "Last 7 Days"
        ? now - 7 * 24 * 60 * 60 * 1000
        : timeFilter === "Last 30 Days"
          ? now - 30 * 24 * 60 * 60 * 1000
          : 0;
    const q = searchQuery.trim().toLowerCase();

    return normalizedRows.filter((row) => {
      if (coinFilter !== "All" && row.from !== coinFilter && row.to !== coinFilter) return false;
      if (walletFilter !== "All" && row.wallet !== walletFilter) return false;
      if (cutoffMs > 0 && row.createdMs > 0 && row.createdMs < cutoffMs) return false;
      if (q) {
        const matchesId = String(row.id ?? "").toLowerCase().includes(q);
        const matchesPair = `${row.from}/${row.to}`.toLowerCase().includes(q);
        if (!matchesId && !matchesPair) return false;
      }
      return true;
    });
  }, [normalizedRows, coinFilter, walletFilter, timeFilter, searchQuery]);

  const hasHistory = filteredHistory.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] px-5 py-3">
        <ResponsiveFilters>
          <Select
            label={t("coin")}
            value={coinFilter}
            onChange={(val) => setCoinFilter(val || "All")}
            data={coinOptions}
            classNames={{ input: "!h-10 !rounded-lg !border-white/[0.09] !bg-elevated !text-white", label: "!text-xs !font-semibold !text-white/45", dropdown: "!bg-elevated !border-white/[0.08]" }}
            className="w-[120px]"
          />
          <Select
            label={t("time")}
            value={timeFilter}
            onChange={(val) => setTimeFilter(val || "Last 30 Days")}
            data={[{ value: "Last 7 Days", label: t("last7Days") }, { value: "Last 30 Days", label: t("last30Days") }]}
            classNames={{ input: "!h-10 !rounded-lg !border-white/[0.09] !bg-elevated !text-white", label: "!text-xs !font-semibold !text-white/45", dropdown: "!bg-elevated !border-white/[0.08]" }}
            className="w-[140px]"
          />
          <Select
            label={t("wallet")}
            value={walletFilter}
            onChange={(val) => setWalletFilter(val || "All")}
            data={[
              { value: "All", label: t("all") },
              { value: "Spot", label: "Spot" },
              { value: "Funding", label: "Funding" },
              { value: "Margin", label: "Margin" },
              { value: "Futures", label: "Futures" },
            ]}
            classNames={{ input: "!h-10 !rounded-lg !border-white/[0.09] !bg-elevated !text-white", label: "!text-xs !font-semibold !text-white/45", dropdown: "!bg-elevated !border-white/[0.08]" }}
            className="w-[140px]"
          />
        </ResponsiveFilters>

        <div className="flex items-center gap-4">
          <TextInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            classNames={{
              input: "!h-10 !bg-white/[0.035] hover:!bg-white/[0.05] focus:!bg-white/[0.05] !border !border-white/[0.08] focus:!border-primary/50 !w-full sm:!w-[280px] !rounded-lg !transition-colors placeholder:!text-white/30",
            }}
            placeholder={t("searchOrderNo")}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          />
          <button
            type="button"
            onClick={() => {
              setCoinFilter("All");
              setTimeFilter("Last 30 Days");
              setWalletFilter("All");
              setSearchQuery("");
            }}
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
          >
            {t("reset")}
          </button>
          <ConvertHistoryShare rows={filteredHistory} />
        </div>
      </div>

      {isLoading || hasHistory ? (
        <TableCard loading={isLoading} hasData={!!hasHistory} emptyTitle="">
          <Table classNames={{ ...tableClassNames, table: "min-w-[900px]" }}>
              <TableThead>
                <TableTr>
                  <TableTh className="pl-6">{t("conversionTime")}</TableTh>
                  <TableTh>{t("wallet")}</TableTh>
                  <TableTh>{t("tradingPair")}</TableTh>
                  <TableTh>{t("type")}</TableTh>
                  <TableTh>{t("from")}</TableTh>
                  <TableTh>{t("to")}</TableTh>
                  <TableTh>{t("price")}</TableTh>
                  <TableTh className="pr-6">{t("status")}</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {filteredHistory.map((item: any) => (
                  <TableTr key={item.id}>
                    <TableTd className="pl-6 text-white/50">{fmtDate(item.createdRaw)}</TableTd>
                    <TableTd>{item.wallet}</TableTd>
                    <TableTd className="!text-white !font-bold">{item.from}/{item.to}</TableTd>
                    <TableTd>{t("convert")}</TableTd>
                    <TableTd className="!text-error-1">- {item.fromAmount} {item.from}</TableTd>
                    <TableTd className="!text-success-6">+ {item.toAmount} {item.to}</TableTd>
                    <TableTd>{item.rate > 0 ? item.rate.toLocaleString(undefined, { maximumFractionDigits: 8 }) : "—"}</TableTd>
                    <TableTd className="pr-6">
                      <span className="text-success-6 bg-success-6/10 px-2 py-1 flex items-center justify-center w-fit text-xs font-bold rounded-md uppercase tracking-wider">
                        {item.status}
                      </span>
                    </TableTd>
                  </TableTr>
                ))}
              </TableTbody>
          </Table>
        </TableCard>
      ) : (
        <OrdersEmptyState
          title={t("emptyConversions")}
          description={t("emptyConversionsDescription")}
          actionLabel={t("startTrading")}
          actionHref="/trades/spot"
        />
      )}
    </div>
  );
};
