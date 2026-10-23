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
    <div
      className={`p-4 rounded-xl border transition-colors ${
        isOwnAd
          ? "border-primary/30 bg-primary/[0.04]"
          : "border-white/[0.07] bg-[#181a20] hover:bg-white/[0.02]"
      } flex flex-col md:flex-row gap-4 justify-between items-start md:items-center`}
    >
      {/* Advertiser Info */}
      <div className="flex-1 min-w-[200px]">
        <MerchantStats
          name={ad.advertiser.name || ad.advertiser.firstName || "Merchant"}
          verified={ad.advertiser.verified || false}
          trades={Math.floor(Number(ad.advertiser.totalOrdersCompleted || ad.advertiser.trades || 0))}
          completionRate={parseFloat(
            ad.advertiser.completionPercentage || String(ad.advertiser.completionRate) || "0"
          ).toFixed(1)}
          responseTime={ad.advertiser.responseTime || "15 mins"}
        />
      </div>

      {/* Price & Limits */}
      <div className="flex-1">
        <div className="text-base font-bold text-white font-mono tabular-nums mb-1">
          {ad.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
          <span className="text-xs font-normal text-white/50">{ad.fiat.toUpperCase()}</span>
        </div>
        <div className="text-xs text-white/50 flex flex-col gap-0.5">
          <div>
            <span className="text-white/35">Available:</span>{" "}
            <span className="text-white/80 font-mono">
              {ad.availableQuantity.toLocaleString()} {ad.asset.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-white/35">Limit:</span>{" "}
            <span className="text-white/80 font-mono">
              {ad.minQuantity.toLocaleString()} – {ad.maxQuantity.toLocaleString()} {ad.asset.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="flex-1 flex flex-wrap gap-1.5">
        {ad.paymentMethods.map((method) => (
          <PaymentMethodBadge key={method} method={method} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end min-w-[120px] max-md:w-full">
        {isOwnAd ? (
          <div className="flex items-center gap-2 max-md:w-full max-md:justify-between">
            <span className="text-[11px] font-semibold text-[#FBA42A] bg-[#FBA42A]/10 border border-[#FBA42A]/20 px-2 py-0.5 rounded-md">
              Your Ad
            </span>
            <Button
              variant="subtle"
              className="!bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-8 !rounded-lg !text-xs !font-semibold"
              onClick={() => onActionClick(ad)}
            >
              Edit Ad
            </Button>
          </div>
        ) : (
          <Button
            className={`w-full max-md:w-full !h-8 !text-xs !font-semibold !rounded-lg ${
              isBuy ? "!bg-buy hover:!bg-buy/90 !text-white" : "!bg-[#F6465D] hover:!bg-[#F6465D]/90 !text-white"
            }`}
            onClick={() => onActionClick(ad)}
          >
            {isBuy ? "Sell" : "Buy"} {ad.asset}
          </Button>
        )}
      </div>
    </div>
  );
};
