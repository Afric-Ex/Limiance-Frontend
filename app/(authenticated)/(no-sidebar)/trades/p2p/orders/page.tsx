"use client";

import React, { useState } from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
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
  FULFILLED: "text-[#4d77f0] bg-[#4d77f0]/10 border-[#4d77f0]/20",
  RELEASED: "text-buy bg-buy/10 border-buy/20",
  COMPLETED: "text-buy bg-buy/10 border-buy/20",
  CANCELLED: "text-white/40 bg-white/[0.05] border-white/[0.07]",
  CANCELED: "text-white/40 bg-white/[0.05] border-white/[0.07]",
  EXPIRED: "text-white/40 bg-white/[0.05] border-white/[0.07]",
  DISPUTED: "text-[#F6465D] bg-[#F6465D]/10 border-[#F6465D]/20",
};

const fieldLabel = "text-[10px] font-medium uppercase tracking-wider text-white/35";

type OrderTab = "PROCESSING" | "EXPIRED" | "CANCELLED" | "ALL";

const FINAL_STATUSES = new Set([
  "COMPLETED",
  "RELEASED",
  "CANCELLED",
  "CANCELED",
  "EXPIRED",
]);

const getOrderStatus = (order: any) =>
  String(order?.status ?? "").toUpperCase();

const isProcessingOrder = (order: any) =>
  !FINAL_STATUSES.has(getOrderStatus(order));

const isExpiredOrder = (order: any) => getOrderStatus(order) === "EXPIRED";

const isCancelledOrder = (order: any) =>
  ["CANCELLED", "CANCELED"].includes(getOrderStatus(order));

const EMPTY_STATE: Record<OrderTab, { title: string; body: string }> = {
  PROCESSING: {
    title: "No orders in progress",
    body: "Orders awaiting payment, escrow release, or dispute resolution will appear here.",
  },
  EXPIRED: {
    title: "No expired orders",
    body: "Orders that exceeded their payment time window will appear here.",
  },
  CANCELLED: {
    title: "No cancelled orders",
    body: "Orders cancelled by you or your counterparty will appear here.",
  },
  ALL: {
    title: "No orders found",
    body: "Your P2P order transaction history will appear here once you trade.",
  },
};

function OrderHistoryPageInner() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<OrderTab>("PROCESSING");
  const [filterType, setFilterType] = useState<string>("ALL");

  const { data, isLoading, refetch, isRefetching } = useAllMatchedOrders(
    filterType !== "ALL" ? { type: filterType } : undefined
  );

  const fetchedOrders: any[] = (data as any)?.data?.data ?? [];
  const allOrders =
    filterType === "ALL"
      ? fetchedOrders
      : fetchedOrders.filter(
          (o) =>
            String(o.type ?? o.order?.type ?? "").toLowerCase() ===
            filterType.toLowerCase()
        );

  const displayOrders = allOrders.filter((o) => {
    if (activeTab === "PROCESSING") return isProcessingOrder(o);
    if (activeTab === "EXPIRED") return isExpiredOrder(o);
    if (activeTab === "CANCELLED") return isCancelledOrder(o);
    return true;
  });

  const processingCount = allOrders.filter(isProcessingOrder).length;
  const expiredCount = allOrders.filter(isExpiredOrder).length;
  const cancelledCount = allOrders.filter(isCancelledOrder).length;

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  };

  return (
    <P2PLayout>
      <div className="w-full max-w-7xl mx-auto py-6 max-[1150px]:py-4 page-enter">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <MdOutlineReceiptLong size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">P2P Orders</h1>
              <p className="text-xs text-white/45">
                {allOrders.length} total orders · {processingCount} in progress
              </p>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.07] disabled:opacity-50"
          >
            <MdRefresh size={16} className={isRefetching ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div className="w-full sm:w-auto max-w-full scroll-x-hidden">
            <SegmentedControl
              value={activeTab}
              onChange={(v) => setActiveTab(v as OrderTab)}
              className="w-max whitespace-nowrap"
              options={[
                { value: "PROCESSING", label: `In Progress (${processingCount})` },
                { value: "EXPIRED", label: `Expired (${expiredCount})` },
                { value: "CANCELLED", label: `Cancelled (${cancelledCount})` },
                {
                  value: "ALL",
                  label: (
                    <>
                      <span className="sm:hidden">All</span>
                      <span className="hidden sm:inline">All Orders</span> ({allOrders.length})
                    </>
                  ),
                },
              ]}
            />
          </div>

          <div className="flex gap-1 p-0.5 bg-white/[0.03] border border-white/[0.07] rounded-lg max-w-full scroll-x-hidden">
            {["ALL", "Buy", "Sell"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  filterType === t
                    ? "bg-primary text-white"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {t === "ALL" ? "All Types" : `${t} Orders`}
              </button>
            ))}
          </div>
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[105px] w-full !rounded-xl" />
            ))}
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#181a20] flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/30 mb-3">
              <MdOutlineReceiptLong size={22} />
            </div>
            <div className="text-white/70 font-medium text-sm mb-1">{EMPTY_STATE[activeTab].title}</div>
            <p className="text-white/40 text-xs max-w-sm leading-relaxed">{EMPTY_STATE[activeTab].body}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {displayOrders.map((order: any) => {
              const asset = order.asset ?? order.order?.asset ?? "?";
              const fiat = (order.fiatCurrency ?? order.fiat ?? order.order?.fiat ?? "").toUpperCase();
              const qty = parseFloat(String(order.quantity ?? 0));
              const fiatAmt = parseFloat(String(order.fiatAmount ?? order.amount ?? 0));
              const orderType = order.type ?? order.order?.type ?? "?";
              const status = (order.status ?? "PENDING").toUpperCase();
              const statusStyle = STATUS_STYLES[status] ?? "text-white/40 bg-white/[0.05] border-white/[0.07]";
              const sellerName =
                order.sellerName || [order.seller?.firstName, order.seller?.lastName].filter(Boolean).join(" ") || "—";
              const buyerName =
                order.buyerName || [order.buyer?.firstName, order.buyer?.lastName].filter(Boolean).join(" ") || "—";
              const counterparty = orderType?.toUpperCase() === "BUY" ? buyerName : sellerName;
              const isBuy = orderType?.toUpperCase() === "BUY";
              const coinIcon = getCryptoIcon(String(asset ?? ""));
              const orderRef = String(order.orderId ?? order.id ?? "—");

              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => router.push(`/trades/p2p/order/${order.id}`)}
                  className="w-full text-left rounded-xl border border-white/[0.07] bg-[#181a20] p-4 transition-colors hover:border-white/[0.12] hover:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {coinIcon ? (
                        <img src={coinIcon} alt={asset} width={20} height={20} className="shrink-0" />
                      ) : (
                        <span className="w-5 h-5 shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                          {String(asset).charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className={`text-sm font-bold ${isBuy ? "text-buy" : "text-[#F6465D]"}`}>
                          {String(orderType).toUpperCase()} {String(asset).toUpperCase()}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[11px] text-white/35" title={orderRef}>
                          Ref: {orderRef.slice(-10).toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${statusStyle}`}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-white/[0.06] pt-3 sm:grid-cols-4">
                    <div className="min-w-0">
                      <div className={fieldLabel}>Counterparty</div>
                      <div className="mt-0.5 truncate text-xs text-white/80 font-medium">{counterparty}</div>
                    </div>
                    <div className="min-w-0">
                      <div className={fieldLabel}>Crypto Quantity</div>
                      <div className="mt-0.5 text-xs font-semibold text-white font-mono tabular-nums">
                        {qty.toLocaleString(undefined, { maximumFractionDigits: 6 })} {String(asset).toUpperCase()}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className={fieldLabel}>Fiat Total</div>
                      <div className="mt-0.5 text-xs text-white/80 font-mono tabular-nums font-medium">
                        {fiatAmt > 0
                          ? `${fiatAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${fiat}`
                          : `— ${fiat}`}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className={fieldLabel}>Created Date</div>
                      <div className="mt-0.5 text-xs text-white/50">{formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
