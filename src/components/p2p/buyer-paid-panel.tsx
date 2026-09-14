import React, { useState, useEffect } from "react";
import { Button } from "@mantine/core";

interface BuyerPaidPanelProps {
  counterpartyName: string;
  quantity: number;
  asset: string;
  updatedAt: string; // Time payment was confirmed
  onDisputeOpen: () => void;
}

export function BuyerPaidPanel({
  counterpartyName,
  quantity,
  asset,
  updatedAt,
  onDisputeOpen,
}: BuyerPaidPanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Assuming seller has 15 minutes to release after buyer paid
  const deadlineStr = updatedAt
    ? new Date(new Date(updatedAt).getTime() + 15 * 60000).toISOString()
    : new Date(Date.now() + 900000).toISOString();

  useEffect(() => {
    const end = new Date(deadlineStr).getTime();
    const tick = () => {
      const diff = Math.floor((end - Date.now()) / 1000);
      setSecondsLeft(diff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadlineStr]);

  const canDispute = secondsLeft <= 0;
  const mins = Math.max(0, Math.floor(secondsLeft / 60));
  const secs = Math.max(0, secondsLeft % 60);

  return (
    <>
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 backdrop-blur-md border border-green-500/30 rounded-2xl p-5 text-center mt-6 shadow-[0_4px_24px_rgba(16,185,129,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="text-[#0ECB81] font-bold text-lg mb-1 flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#0ECB81]/20 flex items-center justify-center">✓</div>
            Payment Confirmed
          </div>
          <p className="text-white/60 text-sm mt-2">
            You confirmed payment at {new Date(updatedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center my-8">
        <div className="text-white/40 text-sm mb-3 uppercase tracking-widest font-semibold">Seller must release within</div>
        <div className="text-5xl font-mono font-bold text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center shadow-lg">
        <div className="text-white text-lg font-medium mb-3 flex items-center justify-center gap-2">
          <span className="text-2xl animate-spin-slow">⏳</span> Waiting for {counterpartyName || "seller"}
        </div>
        <p className="text-white/50 text-sm">
          Waiting for them to release <span className="text-white font-bold">{quantity.toLocaleString()} {asset}</span> to your account.
        </p>
      </div>

      <div className="mt-6 text-xs text-white/50 bg-black/40 border border-white/5 p-4 rounded-xl text-center leading-relaxed backdrop-blur-sm">
        Do not attempt to cancel. Your payment has already been sent. If you filed a false payment confirmation, your account may be restricted.
      </div>

      <div className="mt-8 flex justify-center">
          <Button 
            variant="outline" 
            className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 h-12 rounded-xl transition-all hover:border-orange-500/50"
            onClick={onDisputeOpen}
          >
            File a Dispute
          </Button>
        </div>
    </>
  );
}
