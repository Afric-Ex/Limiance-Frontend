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
import { useState } from "react";
import {
  OrdersPageFrame,
  fmtNum,
  searchInputClass,
  selectStyles,
  StatusPill,
  TableCard,
  tableClassNames,
} from "@/src/components/orders/orders-shared";

function PaymentHistoryInner() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [timeRange, setTimeRange] = useState("All");

  const { data: history, isLoading } = useQuery({
    queryKey: tradingKeys.paymentHistory,
    queryFn: () => tradingService.paymentHistory(),
    select: (res) => res?.data ?? [],
  });

  const allHistory: any[] = Array.isArray(history) ? history : [];
  const filtered = allHistory.filter((item) => {
    const matchesQuery = !query || String(item.id ?? item.orderNo ?? "").toLowerCase().includes(query.toLowerCase());
    const itemType = String(item.type ?? item.transactionType ?? item.transaction_type ?? "").toLowerCase();
    const matchesType = type === "All" || itemType.includes(type.toLowerCase());
    const days = timeRange === "Last 7 Days" ? 7 : timeRange === "Last 30 Days" ? 30 : null;
    const createdAt = new Date(item.createdAt);
    const matchesTime =
      days === null ||
      (!Number.isNaN(createdAt.getTime()) &&
        createdAt.getTime() >= Date.now() - days * 24 * 60 * 60 * 1000);
    return matchesQuery && matchesType && matchesTime;
  });
  const resetFilters = () => {
    setQuery("");
    setType("All");
    setTimeRange("All");
  };

  return (
    <OrdersPageFrame title="Payment history" description="A clear record of account deposits, withdrawals and transfers." actionLabel={null}>
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 border-y border-white/[0.08] py-3">
          <Select
            data={["All", "Deposit", "Withdrawal", "Transfer"]}
            value={type}
            onChange={(value) => setType(value ?? "All")}
            classNames={selectStyles}
            aria-label="Filter payments by type"
            className="w-[130px] shrink-0"
          />
          <Select
            aria-label="Filter payments by date"
            data={["All", "Last 7 Days", "Last 30 Days"]}
            value={timeRange}
            onChange={(value) => setTimeRange(value ?? "All")}
            classNames={selectStyles}
            className="w-[150px] shrink-0"
          />
          <TextInput
            classNames={searchInputClass}
            placeholder="Search order no."
            value={query}
            leftSection={<Search width={16} height={16} fill="white" className="opacity-40" />}
            onChange={(e) => setQuery(e.currentTarget.value)}
            className="min-w-[180px] flex-1"
          />
          {(query || type !== "All" || timeRange !== "All") && (
            <button
              type="button"
              className="h-9 shrink-0 rounded-lg px-2 text-xs font-semibold text-white/45 transition-colors hover:text-white"
              onClick={resetFilters}
            >
              Reset
            </button>
          )}
        </div>

        {isLoading || filtered.length > 0 ? (
          <TableCard loading={isLoading} hasData={filtered.length > 0} emptyTitle="">
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
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 border-y border-white/[0.08] py-10 text-center">
            <p className="text-base font-semibold text-white">{allHistory.length ? "No payments match these filters" : "No payment activity yet"}</p>
            <p className="max-w-sm text-sm leading-6 text-white/45">
              {allHistory.length
                ? "Adjust your search or filters to find the payment you're looking for."
                : "Deposits, withdrawals and transfers will appear here when completed."}
            </p>
          </div>
        )}
      </section>
    </OrdersPageFrame>
  );
}

export default function PaymentHistory() {
  return (
    <PageSuspense fallback={<PaymentHistorySkeleton />}>
      <PaymentHistoryInner />
    </PageSuspense>
  );
}