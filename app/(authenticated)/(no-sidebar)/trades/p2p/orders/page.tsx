"use client";

import React, { useState } from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { Table, TableTh, TableTr, TableTd } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useAllMatchedOrders } from "@/src/hooks/p2p/use-p2p";
import { SegmentedControl } from "@/src/components/ui/segmented-control";
import { Skeleton } from "@/src/components/shared/skeleton";
import { getCryptoIcon } from "@/src/utils/crypto-icons";
import { MdOutlineReceiptLong, MdRefresh } from "react-icons/md";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2POrdersSkeleton } from "@/src/components/skeletons/p2p";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "text-[#FBA42A] bg-[#FBA42A]/10 border-[#FBA42A]/20",
  PAID: "text-[#4d77f0] bg-[#4d77f0]/10 border-[#4d77f0]/20",
  FULFILLED: "text-[#25AB42] bg-[#25AB42]/10 border-[#25AB42]/20",
  RELEASED: "text-[#25AB42] bg-[#25AB42]/10 border-[#25AB42]/20",
  COMPLETED: "text-[#25AB42] bg-[#25AB42]/10 border-[#25AB42]/20",
  CANCELLED: "text-[#F6465D] bg-[#F6465D]/10 border-[#F6465D]/20",
  EXPIRED: "text-[#F6465D] bg-[#F6465D]/10 border-[#F6465D]/20",
  DISPUTED: "text-[#FBA42A] bg-[#FBA42A]/10 border-[#FBA42A]/20",
};

const tableClassNames = {
  th: "!py-3 !px-3 first:!pl-5 !text-[11px] !font-medium !uppercase !tracking-wider !text-white/40 !border-b !border-white/[0.06] !bg-transparent !whitespace-nowrap",
  tr: "!border-b !border-white/[0.06] last:!border-0 hover:!bg-white/[0.02] !transition-colors !cursor-pointer",
  td: "!py-4 !px-3 first:!pl-5 !text-sm !whitespace-nowrap",
};

function OrderHistoryPageInner() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"PROCESSING" | "ALL">("PROCESSING");
  const [filterType, setFilterType] = useState<string>("ALL");

  const { data, isLoading, refetch, isRefetching } = useAllMatchedOrders({
    ...(filterType !== "ALL" ? { type: filterType } : {}),
  });

  const allOrders: any[] = (data as any)?.data?.data ?? [];

  const isTerminal = (o: any) =>
    ["COMPLETED", "CANCELLED", "RELEASED"].includes(o.status?.toUpperCase());

  const displayOrders = allOrders.filter((o) => {
    if (activeTab === "PROCESSING" && isTerminal(o)) return false;
    return true;
  });

  const processingCount = allOrders.filter((o) => !isTerminal(o)).length;

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  };

  return (
    <P2PLayout>
      <div className="w-full max-w-7xl mx-auto py-6 page-enter">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <MdOutlineReceiptLong size={22} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] leading-tight">
                P2P Orders
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {allOrders.length} total orders · {processingCount} processing
              </p>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-60"
          >
            <MdRefresh size={16} className={isRefetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <SegmentedControl
            value={activeTab}
            onChange={(v) => setActiveTab(v as "PROCESSING" | "ALL")}
            options={[
              { value: "PROCESSING", label: `Processing (${processingCount})` },
              { value: "ALL", label: `All Orders (${allOrders.length})` },
            ]}
          />

          <div className="flex gap-2 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl">
            {["ALL", "Buy", "Sell"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterType === t
                    ? "bg-primary text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {t === "ALL" ? "All Types" : `${t} Orders`}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col gap-4 p-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : displayOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-2xl mb-4">
                📭
              </div>
              <div className="text-white/70 font-semibold">No orders found</div>
              <p className="text-white/40 text-sm mt-1 max-w-sm text-center">
                {activeTab === "PROCESSING"
                  ? "No active orders right now"
                  : "You haven't made any P2P trades yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table classNames={tableClassNames}>
                <thead>
                  <TableTr>
                    <TableTh>Order / Time</TableTh>
                    <TableTh>Type / Asset</TableTh>
                    <TableTh>Counterparty</TableTh>
                    <TableTh>Amount</TableTh>
                    <TableTh>Total</TableTh>
                    <TableTh className="!text-right">Status</TableTh>
                  </TableTr>
                </thead>
                <tbody>
                  {displayOrders.map((order: any) => {
                    const asset = order.asset ?? order.order?.asset ?? "?";
                    const fiat = (order.fiatCurrency ?? order.fiat ?? order.order?.fiat ?? "").toUpperCase();
                    const qty = parseFloat(String(order.quantity ?? 0));
                    const fiatAmt = parseFloat(String(order.fiatAmount ?? order.amount ?? 0));
                    const orderType = order.type ?? order.order?.type ?? "?";
                    const status = (order.status ?? "PENDING").toUpperCase();
                    const statusStyle = STATUS_STYLES[status] ?? "text-white/50 bg-white/5 border-white/10";
                    const sellerName = order.sellerName || [order.seller?.firstName, order.seller?.lastName].filter(Boolean).join(" ") || "—";
                    const buyerName = order.buyerName || [order.buyer?.firstName, order.buyer?.lastName].filter(Boolean).join(" ") || "—";
                    const counterparty = orderType?.toUpperCase() === "BUY" ? buyerName : sellerName;
                    const isBuy = orderType?.toUpperCase() === "BUY";
                    const coinIcon = getCryptoIcon(String(asset ?? ""));

                    return (
                      <TableTr key={order.id} onClick={() => router.push(`/trades/p2p/order/${order.id}`)}>
                        <TableTd>
                          <div className="font-mono text-xs text-white/70">
                            {String(order.id).slice(0, 12)}…
                          </div>
                          <div className="text-xs text-white/40">{formatDate(order.createdAt)}</div>
                        </TableTd>
                        <TableTd>
                          <div className="flex items-center gap-2">
                            {coinIcon ? (
                              <img src={coinIcon} alt={asset} width={22} height={22} className="shrink-0" />
                            ) : (
                              <span className="w-[22px] h-[22px] shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                {String(asset).charAt(0).toUpperCase()}
                              </span>
                            )}
                            <div>
                              <div className={`text-sm font-bold ${isBuy ? "text-[#25AB42]" : "text-[#F6465D]"}`}>
                                {String(orderType).toUpperCase()} {String(asset).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </TableTd>
                        <TableTd>
                          <span className="text-white/70">{counterparty}</span>
                        </TableTd>
                        <TableTd>
                          <span className="text-white font-semibold tabular-nums">
                            {qty.toLocaleString(undefined, { maximumFractionDigits: 6 })} {String(asset).toUpperCase()}
                          </span>
                        </TableTd>
                        <TableTd>
                          <span className="text-white/80 tabular-nums">
                            {fiatAmt > 0
                              ? `${fiatAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${fiat}`
                              : `— ${fiat}`}
                          </span>
                        </TableTd>
                        <TableTd className="!text-right">
                          <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border uppercase ${statusStyle}`}>
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </span>
                        </TableTd>
                      </TableTr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </P2PLayout>
  );
}

export default function OrderHistoryPage() {
  return (
    <PageSuspense fallback={<P2POrdersSkeleton />}>
      <OrderHistoryPageInner />
    </PageSuspense>
  );
}