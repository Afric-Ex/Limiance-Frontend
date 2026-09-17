"use client";

import { Select, Table, TableTh, TableTr, TableTd, TableTbody, Skeleton } from "@mantine/core";
import { EmptyTable } from "../icons/empty-table";
import { useQuery } from "@tanstack/react-query";
import { asset } from "@/src/services/asset";

const selectStyles = {
  input: "!h-11 !rounded-xl !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 !text-white !bg-[#181a20] !text-sm !font-medium !transition-all !duration-200",
  label: "!text-xs !font-semibold !text-white/40 !mb-1.5",
  dropdown: "!bg-[#181a20] !border-white/[0.08]",
  option: "hover:!bg-white/[0.04] !text-sm data-[checked]:!bg-primary/20 data-[checked]:!text-primary"
};

export const FundingWallet = () => {
  const { data: records, isLoading } = useQuery({
    queryKey: ['funding-history'],
    queryFn: () => asset.allTransactionHistory(),
    select: (res) => (res as any)?.data ?? [],
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4 bg-[#181a20] p-4 rounded-2xl border border-white/[0.06]">
        <Select
          label="Time"
          data={["Last 7 Days", "Last 30 Days", "Last 3 Months"]}
          defaultValue="Last 7 Days"
          classNames={selectStyles}
          className="w-[160px]"
        />
        <Select
          label="Coin"
          data={["All", "USDT", "BTC", "ETH"]}
          defaultValue="All"
          classNames={selectStyles}
          className="w-[140px]"
        />
        <Select
          label="Transaction Type"
          data={["All", "Deposit", "Withdrawal", "P2P Buy", "P2P Sell"]}
          defaultValue="All"
          classNames={selectStyles}
          className="w-[160px]"
        />
      </div>

      <div className="min-h-[400px] rounded-2xl bg-[#181a20] border border-white/[0.06] overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <Table classNames={{ 
            table: "min-w-[900px]",
            th: "!text-white/40 !uppercase !tracking-wider !text-xs !font-bold !border-b !border-white/[0.06] !py-4 !bg-[#181a20]", 
          }}>
          <TableTr>
            <TableTh className="pl-6">Coin</TableTh>
            <TableTh>Time</TableTh>
            <TableTh>Transaction Type</TableTh>
            <TableTh>Change</TableTh>
            <TableTh className="pr-6 text-right">Status</TableTh>
          </TableTr>
          <TableTbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableTr key={i}>
                  <TableTd colSpan={5}><Skeleton height={30} radius="md" className="!bg-white/[0.02]" /></TableTd>
                </TableTr>
              ))
            ) : records && records.length > 0 ? (
              records.map((rec: any, idx: number) => {
                const amount = Number(rec.amount || rec.quantity || 0);
                return (
                  <TableTr key={rec.id || idx}>
                    <TableTd className="pl-6 font-bold text-white">{rec.coin || rec.asset || '—'}</TableTd>
                    <TableTd>{rec.createdAt ? new Date(rec.createdAt).toLocaleString() : '—'}</TableTd>
                    <TableTd className="capitalize">{rec.type || rec.transactionType || '—'}</TableTd>
                    <TableTd className="font-mono">{amount > 0 ? `+${amount}` : amount}</TableTd>
                    <TableTd className="pr-6 text-right capitalize">{rec.status || 'Completed'}</TableTd>
                  </TableTr>
                );
              })
            ) : null}
          </TableTbody>
        </Table>
        {!isLoading && (!records || records.length === 0) && (
          <div className="h-[300px] flex items-center justify-center flex-col gap-4 opacity-70">
            <EmptyTable />
            <span className="text-sm font-semibold text-white/40">No Funding transactions found.</span>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
