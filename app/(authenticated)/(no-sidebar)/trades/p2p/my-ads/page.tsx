"use client";

import React, { useState } from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { Button } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useUserAds, useDeactivateSingleOrder, useReactivateSingleOrder, useBulkToggleAds } from "@/src/hooks/p2p/use-p2p";
import { UserAds } from "@/src/types/p2p";
import { SegmentedControl } from "@/src/components/ui/segmented-control";
import { Skeleton } from "@/src/components/shared/skeleton";
import { getCryptoIcon } from "@/src/utils/crypto-icons";
import { MdOutlineStorefront, MdEdit, MdPauseCircle, MdPlayCircle } from "react-icons/md";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PMyAdsSkeleton } from "@/src/components/skeletons/p2p";

type AdStatus = "ACTIVE" | "INACTIVE" | "ALL";

// `p-4.5` is not part of Tailwind's default spacing scale, so it generated
// no padding. Use supported spacing utilities to keep the card content inset.
const CARD_CLASS =
  "rounded-xl border border-white/[0.07] bg-[#181a20] p-4 sm:p-5 transition-colors hover:border-white/[0.12]";

function MyAdsPageInner() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdStatus>("ALL");

  const { data, isLoading, refetch } = useUserAds({ page: 1, limit: 20 });
  const { mutate: deactivate, isPending: deactivating } = useDeactivateSingleOrder();
  const { mutate: reactivate, isPending: reactivating } = useReactivateSingleOrder();
  const {
    mutate: bulkToggle,
    isPending: isBulkToggling,
    variables: bulkAction,
  } = useBulkToggleAds();

  const ads: UserAds["data"] = data?.data?.data ?? [];

  const displayAds = ads.filter((ad) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "ACTIVE") return ad.active === true;
    if (activeTab === "INACTIVE") return ad.active === false;
    return true;
  });

  const activeCount = ads.filter((a) => a.active).length;
  const inactiveCount = ads.filter((a) => !a.active).length;

  const [togglingAdId, setTogglingAdId] = useState<string | null>(null);

  const handleToggle = (ad: UserAds["data"][0]) => {
    setTogglingAdId(ad.id);
    if (ad.active) {
      deactivate(ad.id, {
        onSuccess: () => refetch(),
        onSettled: () => setTogglingAdId(null),
      });
    } else {
      reactivate(ad.id, {
        onSuccess: () => refetch(),
        onSettled: () => setTogglingAdId(null),
      });
    }
  };

  return (
    <P2PLayout>
      <div className="w-full max-w-7xl min-w-0 mx-auto py-5 sm:py-6 page-enter">
        {/* Page header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <MdOutlineStorefront size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">My Advertisements</h1>
              <p className="text-xs text-white/45">
                {ads.length} total ads · {activeCount} active · {inactiveCount} paused
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              size="xs"
              variant="subtle"
              className="!h-8 !rounded-lg !border !border-white/[0.08] !bg-white/[0.04] hover:!bg-white/[0.08] !text-white/70 !text-xs !font-medium"
              loading={isBulkToggling && bulkAction === "deactivate"}
              disabled={activeCount === 0 || isBulkToggling}
              leftSection={<MdPauseCircle size={14} />}
              onClick={() => bulkToggle("deactivate")}
            >
              Pause All
            </Button>
            <Button
              size="xs"
              variant="subtle"
              className="!h-8 !rounded-lg !border !border-white/[0.08] !bg-white/[0.04] hover:!bg-white/[0.08] !text-white/70 !text-xs !font-medium"
              loading={isBulkToggling && bulkAction === "reactivate"}
              disabled={inactiveCount === 0 || isBulkToggling}
              leftSection={<MdPlayCircle size={14} />}
              onClick={() => bulkToggle("reactivate")}
            >
              Resume All
            </Button>
            <Button
              className="!h-8 !px-3.5 !rounded-lg !font-semibold !bg-primary hover:!bg-primary/90 !text-white !text-xs shrink-0"
              onClick={() => router.push("/trades/p2p/ads/create")}
            >
              + Post New Ad
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 sm:mb-6 overflow-x-auto">
          <SegmentedControl
            value={activeTab}
            onChange={(v) => setActiveTab(v as AdStatus)}
            options={[
              { value: "ALL", label: `All (${ads.length})` },
              { value: "ACTIVE", label: `Active (${activeCount})` },
              { value: "INACTIVE", label: `Paused (${inactiveCount})` },
            ]}
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full !rounded-xl" />
            ))}
          </div>
        ) : displayAds.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#181a20] flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/30 mb-3">
              <MdOutlineStorefront size={22} />
            </div>
            <div className="text-white/70 font-medium text-sm mb-1">No advertisements in this category</div>
            <p className="text-white/40 text-xs max-w-sm mb-4 leading-relaxed">
              {activeTab === "ALL"
                ? "You haven't posted any P2P ads yet. Create your first offer to start trading as a maker."
                : "No advertisements match this active status filter."}
            </p>
            <Button
              className="!h-8 !px-3.5 !rounded-lg !font-semibold !bg-primary hover:!bg-primary/90 !text-white !text-xs"
              onClick={() => router.push("/trades/p2p/ads/create")}
            >
              Post New Ad
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4">
            {displayAds.map((ad) => {
              const paymentMethods = ad.paymentMethod ?? [];
              const isActive = ad.active;
              const isBuy = String(ad.type).toUpperCase() === "BUY";
              const coinIcon = getCryptoIcon(String(ad.asset ?? ""));

              return (
                <div key={ad.id} className={`${CARD_CLASS} flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
                  {/* Left Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2.5 mb-4">
                      {coinIcon ? (
                        <img src={coinIcon} alt={String(ad.asset)} width={22} height={22} className="shrink-0" />
                      ) : (
                        <span className="w-5 h-5 shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-2xs font-bold text-primary">
                          {String(ad.asset).charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span
                        className={`text-micro font-bold px-2 py-0.5 rounded border ${
                          isBuy ? "bg-buy/10 border-buy/20 text-buy" : "bg-[#F6465D]/10 border-[#F6465D]/20 text-[#F6465D]"
                        }`}
                      >
                        {String(ad.type).toUpperCase()}
                      </span>
                      <span className="text-white font-semibold text-sm">{ad.asset}</span>
                      <span className="text-white/40 text-xs">/ {ad.fiat}</span>
                      <span
                        className={`ml-auto shrink-0 text-micro px-2 py-0.5 rounded-md border font-semibold ${
                          isActive
                            ? "text-buy bg-buy/10 border-buy/20"
                            : "text-white/40 bg-white/[0.05] border-white/[0.07]"
                        }`}
                      >
                        {isActive ? "Active" : "Paused"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs sm:grid-cols-4 sm:gap-4">
                      <div>
                        <div className="text-white/35 text-2xs mb-0.5 uppercase tracking-wider">Price</div>
                        <div className="text-white font-mono font-semibold break-words">
                          {parseFloat(String(ad.price ?? 0)).toLocaleString()} {ad.fiat}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/35 text-2xs mb-0.5 uppercase tracking-wider">Available</div>
                        <div className="text-white font-mono break-words">
                          {parseFloat(String(ad.availableQuantity ?? 0)).toLocaleString()} {ad.asset}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/35 text-2xs mb-0.5 uppercase tracking-wider">Limit</div>
                        <div className="text-white font-mono break-words">
                          {(ad.minQuantity ?? 0).toLocaleString()} – {(ad.maxQuantity ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/35 text-2xs mb-0.5 uppercase tracking-wider">Matched Orders</div>
                        <div className="text-white font-medium">{ad.orderMatchCount ?? 0}</div>
                      </div>
                    </div>

                    {paymentMethods.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {paymentMethods.map((pm) => (
                          <span
                            key={pm.id}
                            className="text-xs bg-white/[0.05] border border-white/[0.07] text-white/60 px-2 py-0.5 rounded font-medium"
                          >
                            {pm.method}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex w-full flex-row gap-2 border-t border-white/[0.06] pt-3 md:w-auto md:min-w-[88px] md:flex-col md:items-end md:justify-center md:border-l md:border-t-0 md:pl-4 md:pt-0">
                    <Button
                      size="xs"
                      variant="subtle"
                      className="!h-9 !flex-1 !rounded-lg !border !border-white/[0.08] !bg-white/[0.05] !text-xs !font-medium !text-white/80 hover:!bg-white/[0.08] md:!w-full md:!flex-none"
                      leftSection={<MdEdit size={13} />}
                      onClick={() => router.push(`/trades/p2p/ads/edit/${ad.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      loading={(deactivating || reactivating) && togglingAdId === ad.id}
                      className={`!h-9 !flex-1 !rounded-lg !text-xs !font-medium border md:!w-full md:!flex-none ${
                        isActive
                          ? "!border-[#FBA42A]/30 !text-[#FBA42A] hover:!bg-[#FBA42A]/10"
                          : "!border-buy/30 !text-buy hover:!bg-buy/10"
                      }`}
                      leftSection={isActive ? <MdPauseCircle size={14} /> : <MdPlayCircle size={14} />}
                      onClick={() => handleToggle(ad)}
                    >
                      {isActive ? "Pause" : "Resume"}
                    </Button>
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

export default function MyAdsPage() {
  return (
    <PageSuspense fallback={<P2PMyAdsSkeleton />}>
      <MyAdsPageInner />
    </PageSuspense>
  );
}
