"use client";

import { Select, Table, TableTh, TableTr, TableTd, TableTbody, Skeleton } from "@mantine/core";
import { EmptyTable } from "../icons/empty-table";
import { DateInput } from "@mantine/dates";
import { useQuery } from "@tanstack/react-query";
import { tradingService, tradingKeys } from "@/src/services/trading";
import { parseDate } from "./orders-shared";

const selectStyles = {
  input: "!h-11 !rounded-xl !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !bg-[#181a20] !text-sm !font-medium !transition-all !duration-200",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  dropdown: "!bg-[#181a20] !border-white/[0.08]",
  option: "hover:!bg-white/[0.04] !text-sm data-[checked]:!bg-primary/20 data-[checked]:!text-primary"
};

const dateStyles = {
  input: "!h-11 !rounded-xl !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !bg-[#181a20] !text-sm !font-medium !transition-all !duration-200",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  calendarHeader: "!text-white",
  day: "data-[selected]:!bg-primary hover:!bg-white/[0.04]",
};

export const SpotRecords = () => {
  const { data: records, isLoading } = useQuery({
    queryKey: tradingKeys.orderHistory(),
    queryFn: () => tradingService.spotOrderHistory(),
    select: (res) => res?.data ?? [],
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4 bg-[#181a20] p-4 rounded-2xl border border-white/[0.06]">
        <DateInput label="Date" classNames={dateStyles} className="w-[160px]" />
        <Select
          label="Time"
          data={["Last 7 Days", "Last 30 Days"]}
          defaultValue="Last 7 Days"
          classNames={selectStyles}
          className="w-[140px]"
        />
        <Select
          label="Coin"
          data={["All", "BTC", "ETH"]}
          defaultValue="All"
          classNames={selectStyles}
          className="w-[120px]"
        />
        <Select
          label="Side"
          data={["All", "Buy", "Sell"]}
          defaultValue="All"
          classNames={selectStyles}
          className="w-[140px]"
        />
      </div>
      <div className="min-h-[400px] rounded-2xl bg-[#181a20] border border-white/[0.06] overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <Table classNames={{ 
            table: "min-w-[900px]",
            th: "!text-white/40 !uppercase !tracking-wider !text-xs !font-bold !border-b !border-white/[0.06] !py-4 !bg-[#181a20]", 
          }}>
            <TableTr>
              <TableTh className="pl-6">Pair</TableTh>
              <TableTh>Side</TableTh>
              <TableTh>Time</TableTh>
              <TableTh>Price</TableTh>
              <TableTh>Quantity</TableTh>
              <TableTh>Status</TableTh>
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
                      <TableTr key={rec.id || idx}>
                        <TableTd className="pl-6 font-bold text-white">{rec.pair || `${rec.base || ''}/${rec.quote || ''}`}</TableTd>
                        <TableTd>
                          <span className={isBuy ? "text-emerald-400" : "text-red-400"}>{rec.side}</span>
                        </TableTd>
                        <TableTd>{parseDate(rec.createdAt)?.toLocaleString() ?? '—'}</TableTd>
                        <TableTd className="font-mono">{Number(rec.price || 0).toLocaleString()}</TableTd>
                        <TableTd className="font-mono">{Number(rec.quantity || rec.amount || 0).toLocaleString()}</TableTd>
                        <TableTd className="capitalize">{rec.status || 'Closed'}</TableTd>
                      </TableTr>
                    );
                  })
                ) : null}
              </TableTbody>
            </Table>
            {!isLoading && (!records || records.length === 0) && (
              <div className="h-[300px] flex items-center justify-center flex-col gap-4 opacity-70">
                <EmptyTable />
                <span className="text-sm font-semibold text-white/40">No Spot records found.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
