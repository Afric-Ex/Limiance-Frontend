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
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PMarketplaceSkeleton } from "@/src/components/skeletons";

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

  const { data: listingsData, isLoading, refetch } = useOrderListings(queryParams);
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
      <div className="w-full max-w-7xl mx-auto py-6 max-[1150px]:px-4 max-[1150px]:pb-[90px] max-[1150px]:py-4 page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">P2P Trading</h1>
            <p className="text-white/50 text-sm mt-1">Buy and sell crypto peer-to-peer</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10"
            >
              <span>⟳</span> Refresh
            </button>
            <Button
              onClick={handlePostAd}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
            >
              + Post Ad
            </Button>
          </div>
        </div>

        <FilterBar />

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {/* Table Header Skeleton */}
            <div className="max-[1150px]:hidden grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] gap-4 px-4 py-2 mb-1">
              <Skeleton height={14} width={80} />
              <Skeleton height={14} width={60} />
              <Skeleton height={14} width={100} />
              <Skeleton height={14} width={70} />
              <Skeleton height={14} width={40} />
            </div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col min-[1150px]:grid min-[1150px]:grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] gap-4 max-[1150px]:gap-3 items-start min-[1150px]:items-center">
                <div className="flex gap-3 items-center">
                  <Skeleton height={40} circle />
                  <div className="flex flex-col gap-2">
                    <Skeleton height={14} width={120} />
                    <Skeleton height={10} width={80} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton height={20} width={90} />
                  <Skeleton height={12} width={50} />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton height={14} width={140} />
                  <Skeleton height={14} width={110} />
                </div>
                <div className="flex gap-2">
                  <Skeleton height={24} width={50} radius="xl" />
                  <Skeleton height={24} width={50} radius="xl" />
                </div>
                <div className="flex justify-end w-full md:w-auto">
                  <Skeleton height={36} width={100} radius="md" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-lg font-semibold text-white/70">No ads found</div>
            <div className="text-sm mt-1">Try adjusting your filters or check back later</div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="max-[1150px]:hidden grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] gap-4 px-4 py-2 text-xs text-white/40 uppercase tracking-wider mb-1">
              <span>Advertiser</span>
              <span>Price</span>
              <span>Quantity / Limits</span>
              <span>Payment</span>
              <span></span>
            </div>

            <div className="flex flex-col gap-2">
              {listings.map((ad) => {
                const isOwn = ad.advertiser?.id === advertiserData?.data?.data?.id;
                const advertiserName = [ad.advertiser?.firstName, ad.advertiser?.lastName].filter(Boolean).join(" ") || "Unknown";
                const completionRate = parseFloat(ad.advertiser?.completionPercentage ?? "0");
                const completionColor = completionRate >= 95 ? "text-green-400" : completionRate >= 90 ? "text-yellow-400" : "text-red-400";
                const paymentMethods = ad.paymentMethod ?? [];

                return (
                  <div
                    key={ad.id}
                    className={`p-4 rounded-xl border transition-colors ${isOwn ? "border-yellow-500/40 bg-yellow-500/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"} flex flex-col min-[1150px]:grid min-[1150px]:grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] gap-4 max-[1150px]:gap-3 items-start min-[1150px]:items-center`}
                  >
                    {/* Advertiser */}
                    <div
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setSelectedAdvertiser(ad.advertiser)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${ad.advertiser?.verified ? "ring-2 ring-primary bg-gradient-to-br from-primary to-blue-600" : "bg-gradient-to-br from-gray-700 to-gray-600"}`}>
                        {advertiserName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          {isOwn && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded mr-1">You</span>}
                          <span className="text-white font-medium text-sm group-hover:text-primary transition-colors">{advertiserName}</span>
                          {ad.advertiser?.verified && <span className="text-primary text-xs">✓</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-white/40">{Math.floor(Number(ad.advertiser?.totalOrdersCompleted ?? 0))} Orders</span>
                          <span className="text-xs text-white/40">|</span>
                          <span className={`text-xs font-medium ${completionColor}`}>{completionRate.toFixed(0)} %</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <div className="text-xl font-bold text-white font-mono">
                        <span className="mr-1">{ad.fiat === "NGN" ? "₦" : ad.fiat === "USD" ? "$" : ad.fiat?.toUpperCase()}</span>
                        {parseFloat(String(ad.price ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </div>
                    </div>

                    {/* Limits */}
                    <div className="text-sm text-white/60">
                      <div>
                        <span className="text-white/40">Quantity </span>
                        {parseFloat(String(ad.availableQuantity ?? 0)).toLocaleString()} {ad.asset?.toUpperCase()}
                      </div>
                      <div className="mt-0.5">
                        <span className="text-white/40">Limits </span>
                        {(ad.minQuantity ?? 0).toLocaleString()} – {(ad.maxQuantity ?? 0).toLocaleString()} {ad.asset?.toUpperCase()}
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-white/20 text-xs">|</span>
                      {paymentMethods.slice(0, 3).map((pm) => (
                        <span key={pm.id} className="text-xs text-white/70">
                          {pm.method}
                        </span>
                      ))}
                      {paymentMethods.length > 3 && (
                        <span className="text-xs text-white/40">
                          +{paymentMethods.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-end min-w-[100px] max-[1150px]:w-full max-[1150px]:mt-2">
                      {isOwn ? (
                        <div className="flex min-[1150px]:flex-col items-center min-[1150px]:items-end justify-between w-full gap-1">
                          <span className="text-xs font-semibold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded">Your Ad</span>
                          <button
                            onClick={() => handleAdAction(ad, true)}
                            className="text-xs text-white/50 hover:text-white transition-colors"
                          >
                            Edit →
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className={`max-[1150px]:w-full ${adFilters.type === "BUY" ? "bg-buy hover:bg-buy/90 text-white font-semibold" : "bg-[#F6465D] hover:bg-[#F6465D]/90 text-white font-semibold"}`}
                          onClick={() => handleAdAction(ad, false)}
                        >
                          {adFilters.type === "BUY" ? "Buy" : "Sell"} {ad.asset?.toUpperCase()}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <AdvertiserProfilePanel
        advertiser={selectedAdvertiser}
        onClose={() => setSelectedAdvertiser(null)}
        onRelationshipChange={() =>
          setRelationshipRefreshKey((value) => value + 1)
        }
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
