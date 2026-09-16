"use client";

import React, { useState } from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { Select, Skeleton } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useAllMatchedOrders } from "@/src/hooks/p2p/use-p2p";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2POrdersSkeleton } from "@/src/components/skeletons";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  PAID: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  FULFILLED: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  RELEASED: "text-green-400 bg-green-400/10 border-green-400/20",
  COMPLETED: "text-green-400 bg-green-400/10 border-green-400/20",
  CANCELLED: "text-red-400 bg-red-400/10 border-red-400/20",
  EXPIRED: "text-red-400 bg-red-400/10 border-red-400/20",
  DISPUTED: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

function OrderHistoryPageInner() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"PROCESSING" | "ALL">("PROCESSING");
  const [filterType, setFilterType] = useState<string>("ALL");

  const { data, isLoading, refetch } = useAllMatchedOrders({
    ...(filterType !== "ALL" ? { type: filterType } : {}),
  });

  const allOrders: any[] = (data as any)?.data?.data ?? [];

  const displayOrders = allOrders.filter((o) => {
    const isTerminal = ["COMPLETED", "CANCELLED", "RELEASED"].includes(o.status?.toUpperCase());
    if (activeTab === "PROCESSING" && isTerminal) return false;
    return true;
  });

  const processingCount = allOrders.filter((o) =>
    !["COMPLETED", "CANCELLED", "RELEASED"].includes(o.status?.toUpperCase())
  ).length;

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString();
  };

  return (
    <P2PLayout>
      <div className="w-full max-w-5xl mx-auto py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">P2P Orders</h1>
            <p className="text-white/40 text-sm mt-1">{allOrders.length} total orders</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10"
          >
            ⟳ Refresh
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-white/10 pb-4">
          <div className="flex gap-1 p-1 bg-black/40 rounded-lg">
            <button
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === "PROCESSING" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}
              onClick={() => setActiveTab("PROCESSING")}
            >
              Processing {processingCount > 0 && <span className="ml-1.5 bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full">{processingCount}</span>}
            </button>
            <button
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === "ALL" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"}`}
              onClick={() => setActiveTab("ALL")}
            >
              All Orders
            </button>
          </div>

          <Select
            value={filterType}
            onChange={(val) => setFilterType(val ?? "ALL")}
            data={[
              { value: "ALL", label: "All Types" },
              { value: "Buy", label: "Buy Orders" },
              { value: "Sell", label: "Sell Orders" },
            ]}
            classNames={{
              input: "bg-black/40 border-white/10 text-white focus:border-primary w-40",
              dropdown: "bg-gray-900 border-white/10 text-white",
              option: "hover:bg-white/10 data-[combobox-selected]:bg-primary/20",
            }}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <Skeleton height={20} width={60} radius="xl" />
                      <Skeleton height={20} width={80} radius="xl" />
                    </div>
                    <Skeleton height={14} width={200} />
                    <Skeleton height={12} width={150} />
                  </div>
                  <div className="flex gap-6 items-center md:text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Skeleton height={12} width={40} />
                      <Skeleton height={20} width={100} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Skeleton height={12} width={40} />
                      <Skeleton height={20} width={100} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-xl border border-white/10">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-white/70 font-semibold">No orders found</div>
            <p className="text-white/40 text-sm mt-1">
              {activeTab === "PROCESSING" ? "No active orders right now" : "You haven't made any P2P trades yet"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayOrders.map((order: any) => {
              const asset = order.asset ?? order.order?.asset ?? "?";
              const fiat = (order.fiatCurrency ?? order.fiat ?? order.order?.fiat ?? "").toUpperCase();
              const qty = parseFloat(String(order.quantity ?? 0));
              const fiatAmt = parseFloat(String(order.fiatAmount ?? order.amount ?? 0));
              const orderType = order.type ?? order.order?.type ?? "?";
              const status = (order.status ?? "PENDING").toUpperCase();
              const statusStyle = STATUS_COLORS[status] ?? "text-white/50 bg-white/5 border-white/10";
              const sellerName = order.sellerName || [order.seller?.firstName, order.seller?.lastName].filter(Boolean).join(" ") || "—";
              const buyerName = order.buyerName || [order.buyer?.firstName, order.buyer?.lastName].filter(Boolean).join(" ") || "—";

              return (
                <div
                  key={order.id}
                  className="bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:bg-white/[0.05] transition-colors cursor-pointer"
                  onClick={() => router.push(`/trades/p2p/order/${order.id}`)}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`text-sm font-bold ${orderType === "Buy" ? "text-green-400" : "text-red-400"}`}>
                          {orderType.toUpperCase()} {asset?.toUpperCase()}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusStyle}`}>
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-white/50">
                        <span>Order: <span className="font-mono text-white/70">{order.id.slice(0, 12)}...</span></span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>

                      <div className="flex gap-3 text-xs text-white/40">
                        <span>Buyer: <span className="text-white/60">{buyerName}</span></span>
                        <span>·</span>
                        <span>Seller: <span className="text-white/60">{sellerName}</span></span>
                      </div>
                    </div>

                    <div className="flex gap-6 items-center md:text-right">
                      <div>
                        <div className="text-white/40 text-xs mb-0.5">Crypto</div>
                        <div className="text-white font-semibold">{qty.toLocaleString()} {asset?.toUpperCase()}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs mb-0.5">Fiat</div>
                        <div className="text-white font-semibold">
                          {fiatAmt > 0
                            ? `${fiatAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${fiat || ""}`
                            : `— ${fiat || ""}`}
                        </div>
                      </div>
                      <div className="text-white/30 text-lg">→</div>
                    </div>
                  </div>
                </div>
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
