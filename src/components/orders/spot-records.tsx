"use client";

import { Select, Table, TableTh, TableTr, TableTd, TableTbody, Skeleton } from "@mantine/core";
import { useState } from "react";
import { DateInput } from "@mantine/dates";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { OrdersEmptyState, parseDate, ResponsiveFilters } from "./orders-shared";
import { TransactionDetailsModal } from "@/src/components/transactions/transaction-details-modal";

const selectStyles = {
  input: "!h-10 !rounded-lg !border !border-white/[0.09] hover:!border-white/[0.16] focus:!border-primary/50 !text-white !bg-elevated !text-sm !font-medium !transition-colors",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  dropdown: "!bg-elevated !border-white/[0.08]",
  option: "hover:!bg-white/[0.04] !text-sm data-[checked]:!bg-primary/20 data-[checked]:!text-primary"
};

const dateStyles = {
  input: "!h-10 !rounded-lg !border !border-white/[0.09] hover:!border-white/[0.16] focus:!border-primary/50 !text-white !bg-elevated !text-sm !font-medium !transition-colors",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  calendarHeader: "!text-white",
  day: "data-[selected]:!bg-primary hover:!bg-white/[0.04]",
};

export const SpotRecords = () => {
  const t = useTranslations("Orders");
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const { data: records, isLoading } = useQuery({
    queryKey: tradingKeys.orderHistory(),
    queryFn: () => tradingService.spotOrderHistory(),
    select: (res) => res?.data ?? [],
  });

  return (
    <div className="flex flex-col gap-6">
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] px-5 py-3">
        <ResponsiveFilters>
          <DateInput label={t("date")} classNames={dateStyles} className="w-[160px]" />
          <Select
            label={t("time")}
            data={[{ value: "Last 7 Days", label: t("last7Days") }, { value: "Last 30 Days", label: t("last30Days") }]}
            classNames={selectStyles}
            className="w-[140px]"
          />
          <Select
            label={t("coin")}
            data={[{ value: "All", label: t("all") }, { value: "BTC", label: "BTC" }, { value: "ETH", label: "ETH" }]}
            classNames={selectStyles}
            className="w-[120px]"
          />
          <Select
            label={t("side")}
            data={[{ value: "All", label: t("all") }, { value: "Buy", label: t("buy") }, { value: "Sell", label: t("sell") }]}
            classNames={selectStyles}
            className="w-[140px]"
          />
        </ResponsiveFilters>
      </div>
      <div className="min-h-[260px] overflow-hidden border-y border-white/[0.08] flex flex-col">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <Table classNames={{ 
            table: "min-w-[900px]",
            th: "!text-white/40 !uppercase !tracking-wider !text-xs !font-bold !border-b !border-white/[0.06] !py-4 !bg-surface",
          }}>
            <TableTr>
              <TableTh className="pl-6">{t("pair")}</TableTh>
              <TableTh>{t("side")}</TableTh>
              <TableTh>{t("time")}</TableTh>
              <TableTh>{t("price")}</TableTh>
              <TableTh>{t("quantity")}</TableTh>
              <TableTh>{t("status")}</TableTh>
            </TableTr>
          </Table>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <Table classNames={{ table: "min-w-[900px]", td: "!border-b !border-white/[0.03] !py-4 !text-sm !text-white/80" }}>
              <TableTbody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableTr key={i}>
                      <TableTd colSpan={6}><Skeleton height={30} radius="md" className="!bg-white/[0.02]" /></TableTd>
                    </TableTr>
                  ))
                ) : records && records.length > 0 ? (
                  records.map((rec: any, idx: number) => {
                    const isBuy = rec.side?.toLowerCase() === 'buy';
                    return (
                      <TableTr
                        key={rec.id || idx}
                        onClick={() => setSelectedTransaction(rec)}
                        className="cursor-pointer hover:!bg-white/[0.03]"
                      >
                        <TableTd className="pl-6 font-bold text-white">{rec.pair || `${rec.base || ''}/${rec.quote || ''}`}</TableTd>
                        <TableTd>
                          <span className={isBuy ? "text-emerald-400" : "text-red-400"}>{rec.side}</span>
                        </TableTd>
                        <TableTd>{parseDate(rec.createdAt)?.toLocaleString() ?? '—'}</TableTd>
                        <TableTd className="font-mono">{Number(rec.price || 0).toLocaleString()}</TableTd>
                        <TableTd className="font-mono">{Number(rec.quantity || rec.amount || 0).toLocaleString()}</TableTd>
                        <TableTd className="capitalize">{rec.status || t("closed")}</TableTd>
                      </TableTr>
                    );
                  })
                ) : null}
              </TableTbody>
            </Table>
            {!isLoading && (!records || records.length === 0) && (
              <OrdersEmptyState
                title={t("emptySpotRecords")}
                description={t("emptySpotRecordsDescription")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
