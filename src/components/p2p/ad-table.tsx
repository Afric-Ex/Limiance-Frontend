"use client";

import React from "react";
import { Ad } from "@/src/stores/p2p-store";
import { AdCard } from "./ad-card";
import { useRouter } from "next/navigation";

interface AdTableProps {
  ads: Ad[];
  currentUserId?: string;
  onAvatarClick?: (userId: string) => void;
}

export const AdTable = ({ ads, currentUserId }: AdTableProps) => {
  const router = useRouter();

  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/50 bg-white/[0.02] border border-white/5 rounded-xl">
        <div className="text-4xl mb-4">📭</div>
        <div className="text-lg">No ads found</div>
        <div className="text-sm">Try adjusting your filters</div>
      </div>
    );
  }

  const handleAction = (ad: Ad) => {
    if (ad.advertiser.id === currentUserId) {
      router.push(`/p2p/ads/edit/${ad.id}`);
    } else {
      router.push(`/p2p/order/create?adId=${ad.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-3">
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
