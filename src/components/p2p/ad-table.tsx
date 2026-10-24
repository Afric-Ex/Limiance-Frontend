"use client";

import React from "react";
import { Ad } from "@/src/stores/p2p-store";
import { AdCard } from "./ad-card";
import { useRouter } from "next/navigation";
import { MdOutlineStorefront } from "react-icons/md";

interface AdTableProps {
  ads: Ad[];
  currentUserId?: string;
  onAvatarClick?: (userId: string) => void;
}

export const AdTable = ({ ads, currentUserId }: AdTableProps) => {
  const router = useRouter();

  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/50 bg-[#181a20] border border-white/[0.07] rounded-xl text-center gap-2">
        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/30 mb-1">
          <MdOutlineStorefront size={24} />
        </div>
        <div className="text-sm font-semibold text-white">No advertisements found</div>
        <div className="text-xs text-white/40">Try adjusting your filters or currency selection</div>
      </div>
    );
  }

  const handleAction = (ad: Ad) => {
    if (ad.advertiser.id === currentUserId) {
      router.push(`/trades/p2p/ads/edit/${ad.id}`);
    } else {
      router.push(`/trades/p2p/order/create?adId=${ad.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {ads.map((ad) => (
        <AdCard
          key={ad.id}
          ad={ad}
          isOwnAd={ad.advertiser.id === currentUserId}
          onActionClick={handleAction}
        />
      ))}
    </div>
  );
};