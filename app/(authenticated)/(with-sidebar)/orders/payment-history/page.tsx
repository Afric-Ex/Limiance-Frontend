"use client";

import {
  Select,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  TextInput,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { tradingKeys, tradingService } from "@/src/services/trading";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { PaymentHistorySkeleton } from "@/src/components/skeletons/orders";
import { Search } from "@/src/components/icons/search";
import { OrdersPageHeader } from "@/src/components/orders/orders-page-header";
import { MdOutlinePayments } from "react-icons/md";
import { useState } from "react";
import {
  fmtNum,
  searchInputClass,
  selectStyles,
  StatusPill,
  TableCard,
  tableClassNames,
} from "@/src/components/orders/orders-shared";

function PaymentHistoryInner() {
  const [query, setQuery] = useState("");

  const { data: history, isLoading } = useQuery({
    queryKey: tradingKeys.paymentHistory,
    queryFn: () => tradingService.paymentHistory(),
  });

  const allHistory: any[] = Array.isArray(history) ? history : [];
  const filtered = query
    ? allHistory.filter((i) => String(i.id ?? i.orderNo ?? "").includes(query))
    : allHistory;

  return (
    <main className="flex flex-col gap-8 px-5 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-6 mt-2">
      <OrdersPageHeader
        icon={<MdOutlinePayments size={24} />}
        title="Payment History"
        description="Every deposit, withdrawal and transfer on your account"
      />

      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 p-4 rounded-2xl bg-[#181a20] border border-white/[0.06]">
        <div className="flex flex-wrap gap-4 items-end">
          <Select
            label="Type"
            data={["All", "Deposit", "Withdrawal", "Transfer"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[140px]"
          />
          <Select
            label="Time"
            data={["All", "Last 7 Days", "Last 30 Days"]}
            defaultValue="All"
            classNames={selectStyles}
            className="w-[140px]"
          />
        </div>
        <div className="flex items-center gap-4">
          <TextInput
            classNames={searchInputClass}
            placeholder="Search order no."
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
          <button
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors cursor-pointer px-2"
            onClick={() => setQuery("")}
          >
            Reset
          </button>
        </div>
      </div>

      <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="No payment history found.">
        <Table classNames={tableClassNames}>
          <TableThead>
            <TableTr>
              <TableTh className="pl-5">Date</TableTh>
              <TableTh>Time</TableTh>
              <TableTh>To/From</TableTh>
              <TableTh>Amount</TableTh>
              <TableTh>Currency</TableTh>
              <TableTh>Status</TableTh>
            </TableTr>
          </TableThead>
          <TableTbody>
            {filtered.map((item: any) => {
              const date = new Date(item.createdAt);
              return (
                <TableTr key={item.id}>
                  <TableTd className="pl-5 text-white/80">
                    {Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString()}
                  </TableTd>
                  <TableTd className="text-white/50">
                    {Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString()}
                  </TableTd>
                  <TableTd>{item.method ?? item.from ?? item.to ?? "—"}</TableTd>
                  <TableTd className="tabular-nums !text-white">{fmtNum(item.amount)}</TableTd>
                  <TableTd>{item.currency ?? "—"}</TableTd>
                  <TableTd><StatusPill status={item.status} /></TableTd>
                </TableTr>
              );
            })}
          </TableTbody>
        </Table>
      </TableCard>
    </main>
  );
}

export default function PaymentHistory() {
  return (
    <PageSuspense fallback={<PaymentHistorySkeleton />}>
      <PaymentHistoryInner />
    </PageSuspense>
  );
}