"use client";

import React from "react";
import { Button } from "@mantine/core";
import { MdHourglassEmpty, MdContentCopy } from "react-icons/md";

interface SellerPendingPanelProps {
  setCancelModalOpen: (val: boolean) => void;
}

export function SellerPendingPanel({
  setCancelModalOpen,
}: SellerPendingPanelProps) {
  return (
    <>
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 text-center mt-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/35 mx-auto mb-3">
          <MdHourglassEmpty size={20} />
        </div>
        <div className="text-white text-sm font-semibold mb-1">Waiting for Buyer Payment</div>
        <p className="text-white/45 text-xs max-w-sm mx-auto leading-relaxed">
          The counterparty has been notified to send payment. Your crypto is safely locked in escrow until you confirm
          receipt.
        </p>
      </div>

      {paymentMethod && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mt-4">
          <div className="text-white/60 text-xs font-semibold tracking-wider uppercase mb-3.5">
            Your Receiving Account Details
          </div>
          <div className="flex flex-col divide-y divide-white/[0.05] text-xs">
            <div className="flex justify-between items-center py-2.5">
              <span className="text-white/40">Bank / Provider</span>
              <span className="text-white font-medium">{paymentMethod?.data?.bankName ?? paymentMethod?.method ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-white/40">Account Name</span>
              <span className="text-white font-medium">{paymentMethod?.data?.accountName ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-white/40">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono font-medium">{paymentMethod?.data?.accountNumber ?? "—"}</span>
                {paymentMethod?.data?.accountNumber && (
                  <button
                    onClick={() => copyToClipboard(paymentMethod.data.accountNumber)}
                    className="text-primary hover:text-primary/80 transition-colors p-1"
                    title="Copy Account Number"
                  >
                    <MdContentCopy size={13} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-white/40">Expected Amount</span>
              <span className="text-white font-bold font-mono text-sm">
                {fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Button
          variant="subtle"
          className="w-full !bg-white/[0.04] hover:!bg-white/[0.08] !border !border-white/[0.06] !text-white/50 hover:!text-[#F6465D] !h-10 !rounded-lg !text-xs !font-medium"
          onClick={() => setCancelModalOpen(true)}
        >
          Cancel Order
        </Button>
      </div>
    </>
  );
}
