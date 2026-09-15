"use client";

import React, { useState } from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { Button, Loader, Skeleton } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useUserAds, useDeactivateSingleOrder } from "@/src/hooks/p2p/use-p2p";
import { UserAds } from "@/src/types/p2p";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PMyAdsSkeleton } from "@/src/components/skeletons";

type AdStatus = "ACTIVE" | "INACTIVE" | "ALL";

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
    // deactivate (pause) is the only available action from the API
    deactivate(ad.id, { onSuccess: () => refetch() });
  };

  return (
    <P2PLayout>
      <div className="w-full max-w-5xl mx-auto py-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Ads</h1>
            <p className="text-white/40 text-sm mt-1">{ads.length} total ads</p>
          </div>
          <Button
            className="bg-buy hover:bg-buy/90 text-white font-bold"
            onClick={() => router.push("/trades/p2p/ads/create")}
          >
            + Post New Ad
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
          {[
            { key: "ALL", label: `All (${ads.length})` },
            { key: "ACTIVE", label: `Active (${activeCount})` },
            { key: "INACTIVE", label: `Paused (${inactiveCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`px-6 py-3 font-medium transition-colors whitespace-nowrap border-b-2 ${
                activeTab === tab.key
                  ? "text-white border-primary"
                  : "text-white/50 border-transparent hover:text-white"
              }`}
              onClick={() => setActiveTab(tab.key as AdStatus)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-5 flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton height={24} width={40} radius="sm" />
                    <Skeleton height={20} width={60} />
                    <Skeleton height={14} width={40} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Skeleton height={30} width="80%" />
                    <Skeleton height={30} width="80%" />
                    <Skeleton height={30} width="80%" />
                    <Skeleton height={30} width="80%" />
                  </div>
                </div>
                <div className="flex flex-row md:flex-col gap-2 items-start md:items-end justify-start md:justify-center shrink-0">
                  <Skeleton height={36} width={80} radius="sm" />
                  <Skeleton height={36} width={80} radius="sm" />
                </div>
              </div>
            ))}
          </div>
        ) : displayAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-xl border border-white/10">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-white/70 font-semibold">No ads in this category</div>
            <Button
              className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
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

              return (
                <div
                  key={ad.id}
                  className="bg-white/[0.02] border border-white/5 rounded-xl p-5 flex flex-col md:flex-row gap-4 justify-between"
                >
                  {/* Left Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded ${ad.type === "Buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {ad.type.toUpperCase()}
                      </span>
                      <span className="text-white font-semibold">{ad.asset}</span>
                      <span className="text-white/40 text-sm">/ {ad.fiat}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-white/5 text-white/40 border border-white/10"}`}>
                        {isActive ? "Active" : "Paused"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-white/40 text-xs mb-0.5">Price</div>
                        <div className="text-white font-mono font-semibold">
                          {parseFloat(String(ad.price ?? 0)).toLocaleString()} {ad.fiat}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs mb-0.5">Available</div>
                        <div className="text-white font-mono">{parseFloat(String(ad.availableQuantity ?? 0)).toLocaleString()} {ad.asset}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs mb-0.5">Limit</div>
                        <div className="text-white font-mono">{(ad.minQuantity ?? 0).toLocaleString()} – {(ad.maxQuantity ?? 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs mb-0.5">Orders Matched</div>
                        <div className="text-white">{ad.orderMatchCount ?? 0}</div>
                      </div>
                    </div>

                    {paymentMethods.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {paymentMethods.map((pm) => (
                          <span key={pm.id} className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
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
                      className="border-white/20 text-white hover:bg-white/10"
                      onClick={() => router.push(`/trades/p2p/ads/edit/${ad.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={deactivating}
                      className={isActive ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}
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
