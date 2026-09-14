"use client";

import { Select, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TextInput, Skeleton } from "@mantine/core";
import { EmptyTable } from "../icons/empty-table";
import { Search } from "../icons/search";
import { useQuery } from "@tanstack/react-query";
import { MOCK_MODE } from "@/src/mocks";
import { mockTrading } from "@/src/mocks/mock-trading";
import { tradingKeys, tradingService } from "@/src/services/trading";

const selectStyles = {
  input: "!h-11 !rounded-xl !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !bg-[#181a20] !text-sm !font-medium !transition-all !duration-200",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  dropdown: "!bg-[#181a20] !border-white/[0.08]",
  option: "hover:!bg-white/[0.04] !text-sm data-[checked]:!bg-primary/20 data-[checked]:!text-primary"
};

export const ConvertTable = () => {
  const { data: history, isLoading } = useQuery({
    queryKey: tradingKeys.convertHistory,
    queryFn: () =>
      MOCK_MODE.convertHistory
        ? mockTrading.convertHistory()
        : tradingService.convertHistory(),
    select: (res) => res.data,
  });

  const hasHistory = history && history.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end p-4 rounded-2xl bg-[#181a20] border border-white/[0.06] gap-6">
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="Coin"
            data={["All", "BTC", "USDT"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[120px]"
          />
          <Select
            label="Time"
            data={["Last 7 Days", "Last 30 Days"]}
            defaultValue="Last 7 Days"
            classNames={selectStyles}
            className="w-[140px]"
          />
          <Select
            label="Wallet"
            data={["All", "Spot", "Funding"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[140px]"
          />
        </div>

        <div className="flex items-center gap-4">
          <TextInput
            classNames={{
              input: "!h-11 !bg-white/[0.04] hover:!bg-white/[0.06] focus:!bg-white/[0.08] !border !border-white/[0.08] focus:!border-primary/50 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !w-full sm:!w-[280px] !rounded-xl !transition-all placeholder:!text-white/20",
            }}
            placeholder="Search order no."
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
          />
          <button className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2">Reset</button>
        </div>
      </div>

      {/* Table Section */}
      <div className="min-h-[400px] rounded-2xl bg-[#181a20] border border-white/[0.06] overflow-hidden">
        {isLoading ? (
          <div className="p-6 flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={50} radius="md" className="!bg-white/[0.02] before:!bg-white/[0.02]" />
            ))}
          </div>
        ) : hasHistory ? (
          <div className="overflow-x-auto custom-scrollbar">
             <Table classNames={{ 
               table: "min-w-[900px]",
               th: "!text-white/40 !uppercase !tracking-wider !text-xs !font-bold !border-b !border-white/[0.06] !py-4 !bg-[#181a20]", 
               td: "!text-sm !py-4 !border-b !border-white/[0.04] !text-white/80 !font-medium",
               tr: "hover:!bg-white/[0.02] !transition-colors"
             }}>
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
                {history.map((item: any) => (
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
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center flex-col gap-4 opacity-70">
            <EmptyTable />
            <span className="text-sm font-semibold text-white/40">No conversion records found.</span>
          </div>
        )}
      </div>
    </div>
  );
};
