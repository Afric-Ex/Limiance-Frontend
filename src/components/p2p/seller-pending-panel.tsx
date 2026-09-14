import React from "react";
import { Button } from "@mantine/core";

interface SellerPendingPanelProps {
  fiatAmount: number;
  fiat: string;
  paymentMethod: any;
  setCancelModalOpen: (val: boolean) => void;
  copyToClipboard: (text: string) => void;
}

export function SellerPendingPanel({
  fiatAmount,
  fiat,
  paymentMethod,
  setCancelModalOpen,
  copyToClipboard,
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

      {paymentMethod && (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-6 mt-6">
          <div className="text-white/60 text-xs font-bold tracking-wider uppercase mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span> Your Payment Details
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
              <span className="text-white/40 font-medium">Bank</span>
              <span className="text-white/90 font-medium">{paymentMethod?.data?.bankName ?? paymentMethod?.method ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
              <span className="text-white/40 font-medium">Account Name</span>
              <span className="text-white/90 font-medium">{paymentMethod?.data?.accountName ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
              <span className="text-white/40 font-medium">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono tracking-wide">{paymentMethod?.data?.accountNumber ?? "—"}</span>
                {paymentMethod?.data?.accountNumber && (
                  <button onClick={() => copyToClipboard(paymentMethod.data.accountNumber)} className="text-[#0ECB81] hover:text-emerald-400 text-xs font-semibold uppercase">Copy</button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
              <span className="text-white/40 font-medium">Expected Amount</span>
              <span className="text-white font-bold text-base drop-shadow-sm">{fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}</span>
            </div>
          </div>
        </div>
      )}

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
