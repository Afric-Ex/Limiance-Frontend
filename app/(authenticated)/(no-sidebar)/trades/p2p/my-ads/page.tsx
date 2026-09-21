"use client";

import React, { useState } from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { Button } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useUserAds, useDeactivateSingleOrder } from "@/src/hooks/p2p/use-p2p";
import { UserAds } from "@/src/types/p2p";
import { SegmentedControl } from "@/src/components/ui/segmented-control";
import { Skeleton } from "@/src/components/shared/skeleton";
import { getCryptoIcon } from "@/src/utils/crypto-icons";
import { MdOutlineStorefront, MdEdit, MdPauseCircle, MdPlayCircle } from "react-icons/md";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PMyAdsSkeleton } from "@/src/components/skeletons/p2p";

type AdStatus = "ACTIVE" | "INACTIVE" | "ALL";

const CARD_CLASS =
  "rounded-2xl border border-white/[0.06] bg-[#181a20] p-5 transition-colors hover:border-white/[0.12]";

function MyAdsPageInner() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdStatus>("ALL");

  const { data, isLoading, refetch } = useUserAds({});
  const { mutate: deactivate, isPending: deactivating } = useDeactivateSingleOrder();

  const ads: UserAds["data"] = data?.data?.data ?? [];

  const displayAds = ads.filter((ad) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "ACTIVE") return ad.active === true;
    if (activeTab === "INACTIVE") return ad.active === false;
    return true;
  });

  const activeCount = ads.filter((a) => a.active).length;
  const inactiveCount = ads.filter((a) => !a.active).length;

  const handleToggle = (ad: UserAds["data"][0]) => {
    deactivate(ad.id, { onSuccess: () => refetch() });
  };

  return (
    <P2PLayout>
      <div className="w-full max-w-7xl mx-auto py-6 page-enter">
        {/* Page header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <MdOutlineStorefront size={22} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] leading-tight">
                My Ads
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {ads.length} total ads · {activeCount} active · {inactiveCount} paused
              </p>
            </div>
          </div>

          <Button
            className="!h-10 !px-4 !rounded-xl !font-semibold !bg-primary hover:!bg-primary/90 !text-white !transition-all shrink-0"
            onClick={() => router.push("/trades/p2p/ads/create")}
          >
            + Post New Ad
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-5">
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
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : displayAds.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-[#181a20] flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-2xl mb-4">
              📭
            </div>
            <div className="text-white/70 font-semibold">No ads in this category</div>
            <p className="text-white/40 text-sm mt-1 mb-5">
              {activeTab === "ALL" ? "You haven't posted any ads yet" : "No ads match this category"}
            </p>
            <Button
              className="!h-10 !px-4 !rounded-xl !font-semibold !bg-[#FBA42A] hover:!bg-[#FBA42A]/90 !text-black !transition-all"
              onClick={() => router.push("/trades/p2p/ads/create")}
            >
              Post Your First Ad
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {displayAds.map((ad) => {
              const paymentMethods = ad.paymentMethod ?? [];
              const isActive = ad.active;
              const isBuy = ad.type === "Buy";
              const coinIcon = getCryptoIcon(String(ad.asset ?? ""));

              return (
                <div key={ad.id} className={`${CARD_CLASS} flex flex-col md:flex-row gap-5 justify-between`}>
                  {/* Left Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      {coinIcon ? (
                        <img src={coinIcon} alt={String(ad.asset)} width={26} height={26} className="shrink-0" />
                      ) : (
                        <span className="w-[26px] h-[26px] shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-bold text-primary">
                          {String(ad.asset).charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isBuy ? "bg-[#25AB42]/15 text-[#25AB42]" : "bg-[#F6465D]/15 text-[#F6465D]"}`}>
                        {String(ad.type).toUpperCase()}
                      </span>
                      <span className="text-white font-semibold">{ad.asset}</span>
                      <span className="text-white/40 text-sm">/ {ad.fiat}</span>
                      <span className={`ml-auto shrink-0 text-xs px-2.5 py-1 rounded-full border ${
                        isActive
                          ? "text-[#25AB42] bg-[#25AB42]/10 border-[#25AB42]/20"
                          : "text-white/40 bg-white/5 border-white/10"
                      }`}>
                        {isActive ? "Active" : "Paused"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-white/40 text-xs mb-0.5 uppercase tracking-wider">Price</div>
                        <div className="text-white font-mono font-semibold">
                          {parseFloat(String(ad.price ?? 0)).toLocaleString()} {ad.fiat}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs mb-0.5 uppercase tracking-wider">Available</div>
                        <div className="text-white font-mono">
                          {parseFloat(String(ad.availableQuantity ?? 0)).toLocaleString()} {ad.asset}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs mb-0.5 uppercase tracking-wider">Limit</div>
                        <div className="text-white font-mono">
                          {(ad.minQuantity ?? 0).toLocaleString()} – {(ad.maxQuantity ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs mb-0.5 uppercase tracking-wider">Orders Matched</div>
                        <div className="text-white">{ad.orderMatchCount ?? 0}</div>
                      </div>
                    </div>

                    {paymentMethods.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {paymentMethods.map((pm) => (
                          <span key={pm.id} className="text-xs bg-white/[0.06] border border-white/[0.06] text-white/60 px-2.5 py-1 rounded-full">
                            {pm.method}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col gap-2 items-start md:items-end justify-start md:justify-center shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="!border-white/20 !text-white hover:!bg-white/10 !rounded-lg"
                      leftSection={<MdEdit size={14} />}
                      onClick={() => router.push(`/trades/p2p/ads/edit/${ad.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={deactivating}
                      className={
                        isActive
                          ? "!border-[#FBA42A]/40 !text-[#FBA42A] hover:!bg-[#FBA42A]/10 !rounded-lg"
                          : "!border-[#25AB42]/40 !text-[#25AB42] hover:!bg-[#25AB42]/10 !rounded-lg"
                      }
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