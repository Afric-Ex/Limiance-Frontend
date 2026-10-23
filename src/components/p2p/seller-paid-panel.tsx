"use client";

import React from "react";
import { Button } from "@mantine/core";
import { MdWarning, MdSecurity } from "react-icons/md";

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
      <div className="bg-[#FBA42A]/10 border border-[#FBA42A]/20 p-4 rounded-xl mt-4">
        <div className="text-[#FBA42A] font-semibold text-sm mb-1.5 flex items-center gap-2">
          <MdWarning size={16} className="shrink-0" />
          <span>Buyer Has Confirmed Payment</span>
        </div>
        <p className="text-white/75 text-xs leading-relaxed">
          <span className="text-white font-medium">{counterpartyName || "Buyer"}</span> marked that they sent{" "}
          <span className="font-bold text-white font-mono">
            {fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}
          </span>{" "}
          via {paymentMethod?.method || "bank transfer"} at{" "}
          <span className="text-white/90">{new Date(updatedAt).toLocaleTimeString()}</span>.
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 mt-4 text-xs space-y-2.5">
        <div className="flex items-start gap-2.5 text-white/80 leading-relaxed">
          <MdSecurity size={15} className="text-primary shrink-0 mt-0.5" />
          <span>
            Check your actual {paymentMethod?.data?.bankName || "bank"} account or payment app to confirm you have
            received{" "}
            <strong className="text-white font-mono">
              {fiatAmount.toLocaleString()} {fiat}
            </strong>{" "}
            before releasing crypto.
          </span>
        </div>
        <div className="p-3 bg-[#F6465D]/10 border border-[#F6465D]/20 rounded-lg text-[#F6465D] font-medium leading-relaxed">
          Releasing crypto is irreversible. Never release funds based on payment screenshots alone.
        </div>
      </div>

      <div className="flex flex-col gap-2.5 mt-6">
        <Button
          className="w-full !bg-buy hover:!bg-buy/90 !text-white !font-semibold !h-11 !text-sm !rounded-lg"
          onClick={() => setReleaseModalOpen(true)}
        >
          Release Crypto
        </Button>
        <Button
          variant="outline"
          className="w-full !border-[#FBA42A]/30 !text-[#FBA42A] hover:!bg-[#FBA42A]/[0.08] !h-10 !rounded-lg !text-xs !font-medium"
          onClick={onDisputeOpen}
        >
          File Dispute
        </Button>
      </div>
    </>
  );
}
