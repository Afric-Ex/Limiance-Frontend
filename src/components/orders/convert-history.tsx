"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput } from "@mantine/core";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { readList } from "@/src/lib/api-response";
import { OrdersEmptyState, TableCard, tableClassNames } from "./orders-shared";

export const ConvertTable = () => {
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
      <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] py-3">
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="Coin"
            data={["All", "BTC", "USDT"]}
            classNames={{ input: "!h-10 !rounded-lg !border-white/[0.09] !bg-elevated !text-white", label: "!text-xs !font-semibold !text-white/45", dropdown: "!bg-elevated !border-white/[0.08]" }}
            className="w-[120px]"
          />
          <Select
            label="Time"
            data={["Last 7 Days", "Last 30 Days"]}
            classNames={{ input: "!h-10 !rounded-lg !border-white/[0.09] !bg-elevated !text-white", label: "!text-xs !font-semibold !text-white/45", dropdown: "!bg-elevated !border-white/[0.08]" }}
            className="w-[140px]"
          />
          <Select
            label="Wallet"
            data={["All", "Spot", "Funding"]}
            classNames={{ input: "!h-10 !rounded-lg !border-white/[0.09] !bg-elevated !text-white", label: "!text-xs !font-semibold !text-white/45", dropdown: "!bg-elevated !border-white/[0.08]" }}
            className="w-[140px]"
          />
        </div>

        <div className="flex items-center gap-4">
          <TextInput
            classNames={{
              input: "!h-10 !bg-white/[0.035] hover:!bg-white/[0.05] focus:!bg-white/[0.05] !border !border-white/[0.08] focus:!border-primary/50 !w-full sm:!w-[280px] !rounded-lg !transition-colors placeholder:!text-white/30",
            }}
            placeholder="Search order no."
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          />
          <button className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2">Reset</button>
        </div>
      </div>

      {isLoading || hasHistory ? (
        <TableCard loading={isLoading} hasData={!!hasHistory} emptyTitle="">
          <Table classNames={{ ...tableClassNames, table: "min-w-[900px]" }}>
              <TableThead>
                <TableTr>
                  <TableTh className="pl-6">Conversion Time</TableTh>
                  <TableTh>Wallet</TableTh>
                  <TableTh>Trading Pair</TableTh>
                  <TableTh>Type</TableTh>
                  <TableTh>From</TableTh>
                  <TableTh>To</TableTh>
                  <TableTh>Price</TableTh>
                  <TableTh className="pr-6">Status</TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {allHistory.map((item: any) => (
                  <TableTr key={item.id}>
                    <TableTd className="pl-6 text-white/50">{new Date(item.createdAt).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}</TableTd>
                    <TableTd>Spot</TableTd>
                    <TableTd className="!text-white !font-bold">{item.from}/{item.to}</TableTd>
                    <TableTd>Convert</TableTd>
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
          title="No conversions yet"
          description="Completed conversions will appear here with their exchange rate and settlement details."
          actionLabel="Start trading"
          actionHref="/trades/spot"
        />
      )}
    </div>
  );
};
