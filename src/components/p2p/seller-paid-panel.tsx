import React from "react";
import { Button } from "@mantine/core";

interface SellerPaidPanelProps {
  counterpartyName: string;
  fiatAmount: number;
  fiat: string;
  paymentMethod: any;
  updatedAt: string;
  setReleaseModalOpen: (val: boolean) => void;
  onDisputeOpen: () => void;
}

export function SellerPaidPanel({
  counterpartyName,
  fiatAmount,
  fiat,
  paymentMethod,
  updatedAt,
  setReleaseModalOpen,
  onDisputeOpen,
}: SellerPaidPanelProps) {
  return (
    <>
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/5 backdrop-blur-md border-l-4 border-yellow-400 p-5 mb-6 rounded-r-2xl mt-6 shadow-[0_4px_24px_rgba(250,204,21,0.15)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="text-yellow-400 font-bold text-lg mb-2 flex items-center gap-2">
            <span className="text-2xl drop-shadow-md">⚠️</span> Buyer Has Confirmed Payment
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            <span className="text-white font-medium">{counterpartyName || "Buyer"}</span> confirmed they sent <span className="font-bold text-yellow-400 bg-yellow-400/10 px-1 rounded">{fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}</span> via {paymentMethod?.method || "transfer"} at <span className="text-white/90">{new Date(updatedAt).toLocaleTimeString()}</span>.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/5 backdrop-blur-md border border-orange-500/30 rounded-2xl p-6 mb-8 text-sm shadow-lg">
        <div className="flex flex-col gap-4 text-orange-400/90 leading-relaxed">
          <p className="font-bold text-orange-400 flex items-start gap-2">
            <span className="text-lg">🏦</span>
            <span>Check your {paymentMethod?.data?.bankName || "bank"} account NOW to confirm you received <strong className="text-white underline decoration-orange-500">{fiatAmount.toLocaleString()} {fiat}</strong> before releasing.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-lg">🚫</span>
            <span>Do NOT release based on screenshots or chat messages alone.</span>
          </p>
          <p className="font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
            Releasing crypto is IRREVERSIBLE. Once released, it cannot be undone.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Button 
          className="w-full bg-gradient-to-r from-[#0ECB81] to-emerald-600 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold h-14 text-lg rounded-xl shadow-[0_4px_15px_rgba(14,203,129,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(14,203,129,0.5)]" 
          onClick={() => setReleaseModalOpen(true)}
        >
          Release Crypto
        </Button>
        <Button 
          variant="outline" 
          className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 h-12 rounded-xl transition-all hover:border-orange-500/50" 
          onClick={onDisputeOpen}
        >
          File Dispute
        </Button>
      </div>
    </>
  );
}
