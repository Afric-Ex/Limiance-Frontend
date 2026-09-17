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
import { P2PMarketplaceSkeleton } from "@/src/components/skeletons/p2p";
import { FiBookOpen, FiClock, FiFileText, FiMessageCircle, FiShield, FiUser, FiRefreshCw } from "react-icons/fi";

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
    <P2PLayout light>
      <div className="w-full max-w-[1373px] mx-auto py-2 max-[1150px]:pb-[90px] page-enter">
        <div className="flex items-center justify-between border-b border-[#e4e8ef] pb-4 mb-7 max-[700px]:items-start max-[700px]:gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#161a1e] text-white font-bold">L</div>
            <h1 className="text-[28px] leading-none font-semibold tracking-[-0.02em] text-[#161a1e]">Limiance P2P</h1>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-[#727679] max-[700px]:hidden">
            <a href="#p2p-guide" className="flex items-center gap-2 hover:text-[#161a1e]"><FiBookOpen size={16} /> User Guide</a>
            <a href="/trades/p2p/orders" className="flex items-center gap-2 hover:text-[#161a1e]"><FiFileText size={16} /> Orders</a>
            <a href="/trades/p2p/profile" className="flex items-center gap-2 hover:text-[#161a1e]"><FiUser size={16} /> P2P User Centre</a>
          </div>
        </div>

        <section id="p2p-guide" className="mb-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#25ab42] font-semibold mb-2">Peer-to-peer, made simple</p>
              <h2 className="text-2xl font-semibold text-[#161a1e]">Why use Limiance P2P</h2>
            </div>
            <button type="button" onClick={() => refetch()} className="flex items-center gap-2 text-sm font-semibold text-[#727679] hover:text-[#161a1e]">
              <FiRefreshCw size={15} /> Refresh
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
            {[
              [FiShield, "Transparent transactions", "Trade directly with other users, with both parties in control of the terms and rates."],
              [FiMessageCircle, "Competitive rates", "Compare offers from real advertisers and choose the rate that works for you."],
              [FiFileText, "Flexible payment options", "Choose from a variety of supported payment methods for every trade."],
              [FiClock, "Escrow protection", "Funds stay protected until both parties have fulfilled their obligations."],
            ].map(([Icon, title, copy]) => {
              const BenefitIcon = Icon as typeof FiShield;
              return <div key={title as string} className="min-h-[150px] border border-[#e4e8ef] bg-white p-5 shadow-[0_4px_14px_rgba(31,45,61,0.04)]">
                <BenefitIcon size={22} className="text-[#25ab42] mb-5" />
                <h3 className="text-sm font-semibold capitalize text-[#161a1e] mb-2">{title as string}</h3>
                <p className="text-xs leading-5 text-[#727679]">{copy as string}</p>
              </div>;
            })}
          </div>
        </section>

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
          <div className="flex flex-col items-center justify-center py-20 text-[#727679] bg-white border border-[#e4e8ef]">
            <div className="text-4xl mb-4">-</div>
            <div className="text-lg font-semibold text-[#161a1e]">No ads found</div>
            <div className="text-sm mt-1">Try adjusting your filters or check back later</div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="max-[1150px]:hidden grid grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] gap-4 px-4 py-2 text-xs text-[#727679] uppercase tracking-wider mb-1">
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
                    className={`p-4 border transition-colors ${isOwn ? "border-[#f0c36a] bg-[#fffaf0]" : "border-[#e4e8ef] bg-white hover:border-[#bfd8c4]"} flex flex-col min-[1150px]:grid min-[1150px]:grid-cols-[2fr_1.5fr_1.5fr_1.5fr_auto] gap-4 max-[1150px]:gap-3 items-start min-[1150px]:items-center`}
                  >
                    {/* Advertiser */}
                    <div
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setSelectedAdvertiser(ad.advertiser)}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold text-white shrink-0 ${ad.advertiser?.verified ? "bg-[#25ab42]" : "bg-[#727679]"}`}>
                        {advertiserName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          {isOwn && <span className="text-xs bg-[#fff1d6] text-[#a56100] px-1.5 py-0.5 rounded mr-1">You</span>}
                          <span className="text-[#161a1e] font-semibold text-sm group-hover:text-[#168331] transition-colors">{advertiserName}</span>
                          {ad.advertiser?.verified && <span className="text-[#25ab42] text-xs">✓</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[#727679]">{Math.floor(Number(ad.advertiser?.totalOrdersCompleted ?? 0))} Orders</span>
                          <span className="text-xs text-[#c7ccd3]">|</span>
                          <span className={`text-xs font-medium ${completionColor}`}>{completionRate.toFixed(0)} %</span>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <div className="text-xl font-bold text-[#161a1e] font-mono">
                        <span className="mr-1">{ad.fiat === "NGN" ? "₦" : ad.fiat === "USD" ? "$" : ad.fiat?.toUpperCase()}</span>
                        {parseFloat(String(ad.price ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </div>
                    </div>

                    {/* Limits */}
                    <div className="text-sm text-[#727679]">
                      <div>
                        <span className="text-[#a1a1aa]">Quantity </span>
                        {parseFloat(String(ad.availableQuantity ?? 0)).toLocaleString()} {ad.asset?.toUpperCase()}
                      </div>
                      <div className="mt-0.5">
                        <span className="text-[#a1a1aa]">Limits </span>
                        {(ad.minQuantity ?? 0).toLocaleString()} – {(ad.maxQuantity ?? 0).toLocaleString()} {ad.asset?.toUpperCase()}
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[#c7ccd3] text-xs">|</span>
                      {paymentMethods.slice(0, 3).map((pm) => (
                        <span key={pm.id} className="text-xs text-[#161a1e] bg-[#f0f3f7] px-2 py-1 rounded-[2px]">
                          {pm.method}
                        </span>
                      ))}
                      {paymentMethods.length > 3 && (
                          <span className="text-xs text-[#727679]">
                          +{paymentMethods.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-end min-w-[100px] max-[1150px]:w-full max-[1150px]:mt-2">
                      {isOwn ? (
                        <div className="flex min-[1150px]:flex-col items-center min-[1150px]:items-end justify-between w-full gap-1">
                          <span className="text-xs font-semibold text-[#a56100] bg-[#fff1d6] border border-[#f0c36a] px-2 py-1 rounded">Your Ad</span>
                          <button
                            onClick={() => handleAdAction(ad, true)}
                            className="text-xs text-[#727679] hover:text-[#161a1e] transition-colors"
                          >
                            Edit →
                          </button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className={`max-[1150px]:w-full ${adFilters.type === "BUY" ? "bg-[#25ab42] hover:bg-[#168331] text-white font-semibold" : "bg-[#F6465D] hover:bg-[#d9364d] text-white font-semibold"}`}
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
