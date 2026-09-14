"use client";

import React from "react";
import { Button } from "@mantine/core";
import { useRouter } from "next/navigation";

interface OrderCancelledOverlayProps {
  orderId: string;
  cryptoAmount: number;
  asset: string;
  isBuyer: boolean;
  reason?: string;
}

export const OrderCancelledOverlay = ({
  orderId,
  cryptoAmount,
  asset,
  isBuyer,
  reason = "payment was not confirmed within the time limit."
}: OrderCancelledOverlayProps) => {
  const router = useRouter();

  return (
    <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-50 flex flex-col items-center justify-start p-8 overflow-y-auto">
      <div className="max-w-xl w-full flex flex-col gap-6 mt-10">
        
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-500/20 text-gray-400 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            ✕
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Order Cancelled</h2>
          <p className="text-white/70 text-lg mb-8">
            This order was automatically cancelled because {reason}
          </p>
        </div>

        <div className="bg-black/20 p-6 rounded-xl border border-white/5">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-white/40 text-sm mb-1">Order ID</div>
              <div className="text-white font-mono">{orderId}</div>
            </div>
            <div>
              <div className="text-white/40 text-sm mb-1">Crypto Amount</div>
              <div className="text-white font-bold">{cryptoAmount.toLocaleString()} {asset}</div>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-white/80">
            {isBuyer ? (
              <p>No funds were deducted. You may return to the marketplace to try again with another advertiser.</p>
            ) : (
              <p>Your crypto has been unlocked and safely returned to your Funding Account.</p>
            )}
          </div>
        </div>

        <Button 
          size="lg" 
          variant="light" 
          className="w-full bg-white/5 hover:bg-white/10 text-white border-white/10"
          onClick={() => router.push("/trades/p2p")}
        >
          Back to P2P Marketplace
        </Button>

      </div>
    </div>
  );
};
