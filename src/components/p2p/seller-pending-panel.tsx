import React from "react";
import { Button } from "@mantine/core";

interface SellerPendingPanelProps {
  setCancelModalOpen: (val: boolean) => void;
}

export function SellerPendingPanel({
  setCancelModalOpen,
}: SellerPendingPanelProps) {
  return (
    <>
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-2xl p-8 text-center mt-6 relative overflow-hidden group">
        {/* Radar sweeping animation effect for "waiting" */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_90deg_at_50%_50%,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_80%,rgba(255,255,255,0.05)_100%)] animate-[spin_3s_linear_infinite] pointer-events-none opacity-50"></div>
        <div className="relative z-10">
          <div className="text-4xl mb-4 animate-bounce opacity-80 drop-shadow-md">⏳</div>
          <div className="text-white text-xl font-bold tracking-tight mb-2 drop-shadow-sm">Waiting for Buyer</div>
          <p className="text-white/50 text-sm max-w-sm mx-auto leading-relaxed">
            The buyer is currently making payment. Your crypto will be locked in escrow once the buyer confirms payment.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-8">
        <Button 
          variant="subtle" 
          className="w-full text-white/50 hover:text-red-400 hover:bg-red-500/10 h-12 rounded-xl transition-all" 
          onClick={() => setCancelModalOpen(true)}
        >
          Cancel Order
        </Button>
      </div>
    </>
  );
}
