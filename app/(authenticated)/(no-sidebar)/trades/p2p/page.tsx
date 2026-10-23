"use client";

import React, { useState } from "react";
import { FilterBar } from "@/src/components/p2p/filter-bar";
import { AdvertiserProfilePanel } from "@/src/components/p2p/advertiser-profile-panel";
import { NonAdvertiserModal } from "@/src/components/p2p/non-advertiser-modal";
import { useP2PStore } from "@/src/stores/p2p-store";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { Button, Skeleton } from "@mantine/core";
import { useOrderListings, useAdvertiserInfo } from "@/src/hooks/p2p/use-p2p";
import { useRouter } from "next/navigation";
import { P2POrderListings } from "@/src/types/p2p";
import { isAdvertiserBlocked } from "@/src/lib/p2p-user-actions";
import { MdOutlineStorefront, MdVerified, MdRefresh } from "react-icons/md";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PMarketplaceSkeleton } from "@/src/components/skeletons/p2p";

function P2PMarketplacePageInner() {
  const { adFilters } = useP2PStore();
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<any | null>(null);
  const [showNonAdvertiserModal, setShowNonAdvertiserModal] = useState(false);
  const [, setRelationshipRefreshKey] = useState(0);
  const router = useRouter();

  // Map our UI filters to backend params.
  // If the user wants to BUY, we need to fetch ads where the advertiser is SELLING.
  // If the user wants to SELL, we need to fetch ads where the advertiser is BUYING.
  const queryParams = {
    type: adFilters.type === "BUY" ? "Sell" : "Buy",
    currency: adFilters.fiat,
    asset: adFilters.asset,
    ...(adFilters.amount ? { minimum_quantity: adFilters.amount } : {}),
    ...(adFilters.paymentMethod && adFilters.paymentMethod !== "All"
      ? { payment_method: adFilters.paymentMethod }
      : {}),
  };

  const { data: listingsData, isLoading, refetch, isRefetching } = useOrderListings(queryParams);
  const { data: advertiserData, isLoading: isAdvertiserLoading } = useAdvertiserInfo();

  const listings: P2POrderListings["data"] =
    (listingsData?.data?.data ?? []).filter(
      (ad) => !isAdvertiserBlocked(ad.advertiser?.id)
    );
  const isAdvertiser = !!advertiserData?.data?.data?.id;

  const handlePostAd = () => {
    if (isAdvertiserLoading) return; // Prevent action while loading
    if (!isAdvertiser) {
      setShowNonAdvertiserModal(true);
    } else {
      router.push("/trades/p2p/ads/create");
    }
  };

  const handleAdAction = (ad: P2POrderListings["data"][0], isOwn: boolean) => {
    if (isOwn) {
      router.push(`/trades/p2p/ads/edit/${ad.id}`);
    } else {
      router.push(`/trades/p2p/order/create?adId=${ad.id}`);
    }
  };

  return (
    <P2PLayout>
      <div className="w-full max-w-7xl mx-auto py-6 max-[1150px]:pb-[90px] max-[1150px]:py-4 page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">P2P Trading</h1>
            <p className="text-white/45 text-xs mt-1">Buy and sell crypto directly with verified counterparties</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.07] disabled:opacity-50"
            >
              <MdRefresh size={16} className={isRefetching ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <Button
              onClick={handlePostAd}
              className="!bg-primary hover:!bg-primary/90 !text-white !font-semibold !rounded-lg !text-xs !h-8 !px-3.5"
            >
              + Post Ad
            </Button>
          </div>
        </div>

        <FilterBar />

        {isLoading ? (
          <div className="bg-[#181a20] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="hidden min-[1150px]:grid grid-cols-[minmax(180px,2fr)_1.5fr_1.5fr_1.5fr_minmax(120px,auto)] gap-4 px-5 py-3 border-b border-white/[0.06]">
              <Skeleton height={10} width={80} />
              <Skeleton height={10} width={60} />
              <Skeleton height={10} width={90} />
              <Skeleton height={10} width={70} />
              <Skeleton height={10} width={40} className="ml-auto" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="grid grid-cols-1 min-[1150px]:grid-cols-[minmax(180px,2fr)_1.5fr_1.5fr_1.5fr_minmax(120px,auto)] gap-4 px-5 py-4 border-b border-white/[0.06] last:border-0 items-center"
              >
                <div className="flex items-center gap-3">
                  <Skeleton height={36} width={36} radius="md" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton height={13} width={110} />
                    <Skeleton height={10} width={80} />
                  </div>
                </div>
                <div>
                  <Skeleton height={18} width={100} />
                  <Skeleton height={10} width={40} className="mt-1" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Skeleton height={12} width={120} />
                  <Skeleton height={12} width={110} />
                </div>
                <div className="flex gap-1.5">
                  <Skeleton height={22} width={60} radius="sm" />
                  <Skeleton height={22} width={60} radius="sm" />
                </div>
                <div className="flex justify-end">
                  <Skeleton height={34} width={90} radius="md" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-[#181a20] border border-white/[0.07] rounded-xl px-6 py-16 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-3 text-white/30">
              <MdOutlineStorefront size={22} />
            </div>
            <div className="text-white/70 font-medium text-sm mb-1">No advertisements found</div>
            <div className="text-white/40 text-xs max-w-sm leading-relaxed">
              No active listings match your current filters. Try adjusting amount or payment method, or post an ad yourself.
            </div>
          </div>
        ) : (
          <div className="bg-[#181a20] border border-white/[0.07] rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="hidden min-[1150px]:grid grid-cols-[minmax(180px,2fr)_1.5fr_1.5fr_1.5fr_minmax(120px,auto)] gap-4 px-5 py-3 border-b border-white/[0.06] text-[11px] font-medium uppercase tracking-wider text-white/40">
              <span>Advertiser</span>
              <span>Price</span>
              <span>Quantity / Limits</span>
              <span>Payment</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {listings.map((ad) => {
                const isOwn = ad.advertiser?.id === advertiserData?.data?.data?.id;
                const advertiserName =
                  [ad.advertiser?.firstName, ad.advertiser?.lastName].filter(Boolean).join(" ") || "Merchant";
                const completionRate = parseFloat(ad.advertiser?.completionPercentage ?? "0");
                const completionColor =
                  completionRate >= 95 ? "text-buy" : completionRate >= 80 ? "text-[#FBA42A]" : "text-white/60";
                const paymentMethods = ad.paymentMethod ?? [];
                const fiatSymbol = ad.fiat === "NGN" ? "₦" : ad.fiat === "USD" ? "$" : "";

                return (
                  <div
                    key={ad.id}
                    className={`grid grid-cols-1 min-[1150px]:grid-cols-[minmax(180px,2fr)_1.5fr_1.5fr_1.5fr_minmax(120px,auto)] gap-4 px-5 py-4 transition-colors ${
                      isOwn ? "bg-primary/[0.04] hover:bg-primary/[0.07]" : "hover:bg-white/[0.02]"
                    } items-start min-[1150px]:items-center`}
                  >
                    {/* Advertiser */}
                    <div
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setSelectedAdvertiser(ad.advertiser)}
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {advertiserName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isOwn && (
                            <span className="text-[10px] font-semibold bg-primary/15 text-primary px-1.5 py-0.5 rounded mr-0.5">
                              You
                            </span>
                          )}
                          <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors truncate">
                            {advertiserName}
                          </span>
                          {ad.advertiser?.verified && <MdVerified className="text-buy text-sm shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-white/40">
                          <span>{Math.floor(Number(ad.advertiser?.totalOrdersCompleted ?? 0))} Orders</span>
                          <span className="text-white/20">·</span>
                          <span className={`font-medium ${completionColor}`}>{completionRate.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <div className="text-base font-bold text-white font-mono tabular-nums">
                        {fiatSymbol}
                        {parseFloat(String(ad.price ?? 0)).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })}
                      </div>
                      <div className="text-xs text-white/40 mt-0.5">{ad.fiat?.toUpperCase()}</div>
                    </div>

                    {/* Limits */}
                    <div className="text-xs text-white/60 space-y-1">
                      <div>
                        <span className="text-white/35">Avail </span>
                        <span className="text-white/80 font-medium font-mono tabular-nums">
                          {parseFloat(String(ad.availableQuantity ?? 0)).toLocaleString()} {ad.asset?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/35">Limit </span>
                        <span className="text-white/70 font-mono tabular-nums">
                          {(ad.minQuantity ?? 0).toLocaleString()} – {(ad.maxQuantity ?? 0).toLocaleString()}{" "}
                          {ad.asset?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {paymentMethods.slice(0, 3).map((pm) => (
                        <span
                          key={pm.id}
                          className="text-xs bg-white/[0.05] border border-white/[0.07] text-white/65 px-2 py-0.5 rounded font-medium"
                        >
                          {pm.method}
                        </span>
                      ))}
                      {paymentMethods.length > 3 && (
                        <span className="text-xs text-white/35">+{paymentMethods.length - 3}</span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-start min-[1150px]:justify-end min-w-[110px] max-[1150px]:w-full max-[1150px]:mt-1">
                      {isOwn ? (
                        <div className="flex min-[1150px]:flex-col items-center min-[1150px]:items-end justify-between w-full gap-1.5">
                          <span className="text-[11px] font-semibold text-[#FBA42A] bg-[#FBA42A]/10 border border-[#FBA42A]/20 px-2 py-0.5 rounded-md">
                            Your Ad
                          </span>
                          <button
                            onClick={() => handleAdAction(ad, true)}
                            className="text-xs text-white/50 hover:text-white transition-colors"
                          >
                            Edit →
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAdAction(ad, false)}
                          className={`w-full min-[1150px]:w-auto px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
                            adFilters.type === "BUY"
                              ? "bg-buy hover:bg-buy/90"
                              : "bg-[#F6465D] hover:bg-[#F6465D]/90"
                          }`}
                        >
                          {adFilters.type === "BUY" ? "Buy" : "Sell"} {ad.asset?.toUpperCase()}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AdvertiserProfilePanel
        advertiser={selectedAdvertiser}
        onClose={() => setSelectedAdvertiser(null)}
        onRelationshipChange={() => setRelationshipRefreshKey((value) => value + 1)}
      />

      <NonAdvertiserModal
        isOpen={showNonAdvertiserModal}
        onClose={() => setShowNonAdvertiserModal(false)}
      />
    </P2PLayout>
  );
}

export default function P2PMarketplacePage() {
  return (
    <PageSuspense fallback={<P2PMarketplaceSkeleton />}>
      <P2PMarketplacePageInner />
    </PageSuspense>
  );
}
