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
import { useUserStore } from "@/src/stores/user-store";
import { parseDate } from "@/src/lib/parse-date";
import { ResponsiveFilters } from "@/src/components/shared/responsive-filters";

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

const fieldLabel = "text-2xs font-medium uppercase tracking-wider text-white/35";

type OrderTab = "PROCESSING" | "DISPUTED" | "EXPIRED" | "CANCELLED" | "ALL";

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
  !FINAL_STATUSES.has(getOrderStatus(order)) && getOrderStatus(order) !== "DISPUTED";

const isDisputedOrder = (order: any) => getOrderStatus(order) === "DISPUTED";

const isExpiredOrder = (order: any) => getOrderStatus(order) === "EXPIRED";

const isCancelledOrder = (order: any) =>
  ["CANCELLED", "CANCELED"].includes(getOrderStatus(order));

/**
 * The side shown on this screen is the signed-in user's side, not the ad's
 * side. A taker matching a SELL ad is buying, so the order must read BUY.
 */
const idOf = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return String(value.id ?? value.userId ?? value.user_id ?? value._id ?? "");
};

const nameOf = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  return (
    [value.firstName, value.lastName].filter(Boolean).join(" ").trim() ||
    value.fullName ||
    value.name ||
    value.username ||
    ""
  );
};

const resolveUserSide = (order: any, userId: string): "BUY" | "SELL" => {
  const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();
  const uId = norm(userId);
  const adType = String(
    order?.type ?? order?.order?.type ?? order?.orderType ?? order?.order_type ?? ""
  ).toUpperCase();
  const matchedAs = String(
    order?.matchedAs ?? order?.matched_as ?? ""
  ).toUpperCase();

  if (matchedAs === "BUY" || matchedAs === "SELL") return matchedAs;

  const buyerId = norm(idOf(order?.buyerId ?? order?.buyer_id ?? order?.buyer));
  const sellerId = norm(idOf(order?.sellerId ?? order?.seller_id ?? order?.seller));
  const matcherId = norm(idOf(order?.matcherId ?? order?.matcher_id ?? order?.matcher));
  const advertiserId = norm(idOf(
    order?.advertiserId ?? order?.advertiser_id ?? order?.advertiser
  ));

  if (uId && buyerId && buyerId === uId) return "BUY";
  if (uId && sellerId && sellerId === uId) return "SELL";

  if (uId && matcherId && matcherId === uId) {
    if (adType === "BUY") return "SELL";
    if (adType === "SELL") return "BUY";
  }
  if (uId && advertiserId && advertiserId === uId) {
    if (adType === "BUY" || adType === "SELL") return adType as "BUY" | "SELL";
  }

  return adType === "BUY" ? "BUY" : "SELL";
};

const EMPTY_STATE: Record<OrderTab, { title: string; body: string }> = {
  PROCESSING: {
    title: "No orders in progress",
    body: "Orders awaiting payment or escrow release will appear here.",
  },
  DISPUTED: {
    title: "No disputed orders",
    body: "Orders under dispute review will appear here.",
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

  const currentUserId = useUserStore((state) =>
    state.user?.id != null ? String(state.user.id) : ""
  );
  const { data, isLoading, refetch, isRefetching } = useAllMatchedOrders();

  const rawList = (data as any)?.data?.data ?? (data as any)?.data?.orders ?? (data as any)?.data ?? [];
  const fetchedOrders: any[] = Array.isArray(rawList) ? rawList : [];
  const allOrders =
    filterType === "ALL"
      ? fetchedOrders
      : fetchedOrders.filter(
          (o) => resolveUserSide(o, currentUserId) === filterType
        );

  const displayOrders = allOrders.filter((o) => {
    if (activeTab === "PROCESSING") return isProcessingOrder(o);
    if (activeTab === "DISPUTED") return isDisputedOrder(o);
    if (activeTab === "EXPIRED") return isExpiredOrder(o);
    if (activeTab === "CANCELLED") return isCancelledOrder(o);
    return true;
  });

  const processingCount = allOrders.filter(isProcessingOrder).length;
  const disputedCount = allOrders.filter(isDisputedOrder).length;
  const expiredCount = allOrders.filter(isExpiredOrder).length;
  const cancelledCount = allOrders.filter(isCancelledOrder).length;

  const formatDate = (value: unknown) => {
    const d = parseDate(value);
    if (!d) return "—";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <P2PLayout>
      <div className="w-full max-w-7xl mx-auto py-6 max-[1150px]:py-4 page-enter">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
                { value: "DISPUTED", label: `Disputes (${disputedCount})` },
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

          <ResponsiveFilters>
            <div className="flex max-w-full gap-1 rounded-lg border border-white/[0.07] bg-white/[0.03] p-0.5 scroll-x-hidden">
              {["ALL", "Buy", "Sell"].map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={filterType === t}
                  onClick={() => setFilterType(t)}
                  className={`shrink-0 whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    filterType === t
                      ? "bg-primary text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {t === "ALL" ? "All Types" : `${t} Orders`}
                </button>
              ))}
            </div>
          </ResponsiveFilters>
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
              const userSide = resolveUserSide(order, currentUserId);
              const status = (order.status ?? "PENDING").toUpperCase();
              const statusStyle = STATUS_STYLES[status] ?? "text-white/40 bg-white/[0.05] border-white/[0.07]";
              const advertiserName =
                order.advertiserName || nameOf(order.advertiser) || "—";
              const matcherName = order.matcherName || nameOf(order.matcher) || "—";
              const sellerName =
                order.sellerName ||
                nameOf(order.seller) ||
                advertiserName ||
                matcherName;
              const buyerName =
                order.buyerName ||
                nameOf(order.buyer) ||
                advertiserName ||
                matcherName;
              // Counterparty is the other side of the trade from the user's side.
              const matcherId = idOf(order?.matcherId ?? order?.matcher_id ?? order?.matcher);
              const matchedAs = String(order?.matchedAs ?? order?.matched_as ?? "").toUpperCase();
              const isCurrentUserMatcher = Boolean(
                currentUserId && matcherId && matcherId.toLowerCase() === currentUserId.toLowerCase()
              );
              // A matcher is the taker: when they matched a SELL ad, show the
              // buyer; when they matched a BUY ad, show the seller.
              const counterparty = isCurrentUserMatcher
                ? matchedAs === "SELL"
                  ? buyerName
                  : matchedAs === "BUY"
                    ? sellerName
                    : userSide === "BUY"
                      ? sellerName
                      : buyerName
                : userSide === "BUY"
                  ? sellerName
                  : buyerName;
              const isBuy = userSide === "BUY";
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
                        <span className="w-5 h-5 shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-2xs font-bold text-primary">
                          {String(asset).charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className={`text-sm font-bold ${isBuy ? "text-buy" : "text-[#F6465D]"}`}>
                          {userSide} {String(asset).toUpperCase()}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-micro text-white/35" title={orderRef}>
                          Ref: {orderRef.slice(-10).toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 text-micro font-semibold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${statusStyle}`}>
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
                      <div className="mt-0.5 text-xs text-white/50">
                        {formatDate(
                          order.createdAt ||
                            order.created_at ||
                            order.matchedAt ||
                            order.matched_at ||
                            order.updatedAt ||
                            order.updated_at
                        )}
                      </div>
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
