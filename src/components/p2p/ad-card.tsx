"use client";

import React from "react";
import { Ad } from "@/src/stores/p2p-store";
import { Button } from "@mantine/core";
import { PaymentMethodBadge } from "./payment-method-badge";
import { MerchantStats } from "./merchant-stats";

interface AdCardProps {
  ad: Ad;
  onActionClick: (ad: Ad) => void;
  isOwnAd?: boolean;
}

export const AdCard = ({ ad, onActionClick, isOwnAd = false }: AdCardProps) => {
  const isBuy = ad.type === "BUY";

  return (
    <div className={`p-5 rounded-2xl backdrop-blur-xl border shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all hover:bg-white/[0.04] ${isOwnAd ? 'border-primary/30 bg-primary/10' : 'border-white/[0.05] bg-white/[0.02]'} flex flex-col md:flex-row gap-5 justify-between items-start md:items-center`}>
      {/* Advertiser Info */}
      <div className="flex-1 min-w-[200px]">
        <MerchantStats 
          name={ad.advertiser.name || ad.advertiser.firstName || "Merchant"}
          verified={ad.advertiser.verified || false}
          trades={Math.floor(Number(ad.advertiser.totalOrdersCompleted || ad.advertiser.trades || 0))}
          completionRate={parseFloat(ad.advertiser.completionPercentage || String(ad.advertiser.completionRate) || "0").toFixed(1)}
          responseTime={ad.advertiser.responseTime || "15 mins"}
        />
      </div>

      {/* Price & Limits */}
      <div className="flex-1">
        <div className="text-xl font-bold text-white mb-1">
          {ad.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {ad.fiat.toUpperCase()}
        </div>
        <div className="text-sm text-white/50 flex flex-col gap-1">
          <div><span className="text-white/40">Available:</span> <span className="text-white/80">{ad.availableQuantity.toLocaleString()} {ad.asset.toUpperCase()}</span></div>
          <div><span className="text-white/40">Limit:</span> <span className="text-white/80">{ad.minQuantity.toLocaleString()} - {ad.maxQuantity.toLocaleString()} {ad.asset.toUpperCase()}</span></div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="flex-1 flex flex-wrap gap-2">
        {ad.paymentMethods.map(method => (
          <PaymentMethodBadge key={method} method={method} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end min-w-[120px]">
        {isOwnAd ? (
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">Your Ad</span>
            <Button variant="light" color="blue" onClick={() => onActionClick(ad)}>
              Edit Ad
            </Button>
          </div>
        ) : (
          <Button 
            color={isBuy ? "green" : "red"} 
            className={`w-full ${isBuy ? 'bg-buy hover:bg-buy/90' : 'bg-[#F6465D] hover:bg-[#F6465D]/90'}`}
            onClick={() => onActionClick(ad)}
          >
            {isBuy ? "Sell" : "Buy"} {ad.asset}
          </Button>
        )}
      </div>
    </div>
  );
};
