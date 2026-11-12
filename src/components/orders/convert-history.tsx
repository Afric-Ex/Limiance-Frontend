"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { readList } from "@/src/lib/api-response";
import { OrdersEmptyState, ResponsiveFilters, TableCard, tableClassNames } from "./orders-shared";

export const ConvertTable = () => {
  const t = useTranslations("Orders");
  const { data: history, isLoading } = useQuery({
    queryKey: tradingKeys.convertHistory,
    queryFn: () =>
      tradingService.convertHistory(),
    select: (res) => readList<any>(res),
  });

  const allHistory = Array.isArray(history) ? history : [];
  const hasHistory = allHistory.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] px-5 py-3">
        <ResponsiveFilters>
          <Select
            label={t("coin")}
            data={[{ value: "All", label: t("all") }, { value: "BTC", label: "BTC" }, { value: "USDT", label: "USDT" }]}
            classNames={{ input: "!h-10 !rounded-lg !border-white/[0.09] !bg-elevated !text-white", label: "!text-xs !font-semibold !text-white/45", dropdown: "!bg-elevated !border-white/[0.08]" }}
            className="w-[120px]"
          />
          <Select
            label={t("time")}
            data={[{ value: "Last 7 Days", label: t("last7Days") }, { value: "Last 30 Days", label: t("last30Days") }]}
            classNames={{ input: "!h-10 !rounded-lg !border-white/[0.09] !bg-elevated !text-white", label: "!text-xs !font-semibold !text-white/45", dropdown: "!bg-elevated !border-white/[0.08]" }}
            className="w-[140px]"
          />
          <Select
            label={t("wallet")}
            data={[{ value: "All", label: t("all") }, { value: "Spot", label: "Spot" }, { value: "Funding", label: "Funding" }]}
            classNames={{ input: "!h-10 !rounded-lg !border-white/[0.09] !bg-elevated !text-white", label: "!text-xs !font-semibold !text-white/45", dropdown: "!bg-elevated !border-white/[0.08]" }}
            className="w-[140px]"
          />
        </ResponsiveFilters>

        <div className="flex items-center gap-4">
          <TextInput
            classNames={{
              input: "!h-10 !bg-white/[0.035] hover:!bg-white/[0.05] focus:!bg-white/[0.05] !border !border-white/[0.08] focus:!border-primary/50 !w-full sm:!w-[280px] !rounded-lg !transition-colors placeholder:!text-white/30",
            }}
            placeholder={t("searchOrderNo")}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          />
          <button className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2">{t("reset")}</button>
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
                {allHistory.map((item: any) => (
                  <TableTr key={item.id}>
                    <TableTd className="pl-6 text-white/50">{new Date(item.createdAt).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</TableTd>
                    <TableTd>{t("marketTypeSpot")}</TableTd>
                    <TableTd className="!text-white !font-bold">{item.from}/{item.to}</TableTd>
                    <TableTd>{t("convert")}</TableTd>
                    <TableTd className="!text-error-1">- {item.fromAmount} {item.from}</TableTd>
                    <TableTd className="!text-success-6">+ {item.toAmount} {item.to}</TableTd>
                    <TableTd>{parseFloat(item.rate).toLocaleString()}</TableTd>
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
