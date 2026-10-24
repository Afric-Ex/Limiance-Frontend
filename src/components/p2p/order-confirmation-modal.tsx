"use client";

import React from "react";

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: "BUY" | "SELL";
  asset: string;
  fiat: string;
  cryptoAmount: number;
  fiatAmount: number;
  price: number;
  isLoading?: boolean;
}

export const OrderConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  asset,
  fiat,
  cryptoAmount,
  fiatAmount,
  price,
  isLoading,
}: OrderConfirmationModalProps) => {
  if (!isOpen) return null;

  const isBuy = type === "BUY";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-[#181a20] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <span className="text-white font-semibold text-sm">Confirm Order</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors text-base"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Summary hero */}
          <div className="text-center py-1">
            <div className="text-white/40 text-xs mb-1">
              You are about to <span className={isBuy ? "text-buy font-semibold" : "text-[#F6465D] font-semibold"}>{type.toLowerCase()}</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono tracking-tight mb-1">
              {cryptoAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
              <span className="text-white/60 text-lg font-sans">{asset}</span>
            </div>
            <div className="text-xs text-white/50">
              for{" "}
              <span className="font-semibold text-white font-mono text-sm">
                {fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}
              </span>
            </div>
          </div>

          {/* Detail rows */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3.5 flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-white/40">Unit Price</span>
              <span className="text-white font-medium font-mono">
                {price.toLocaleString()} {fiat}
              </span>
            </div>
            <div className="h-px bg-white/[0.05]" />
            <div className="flex justify-between items-center">
              <span className="text-white/40">Order Type</span>
              <span
                className={`font-semibold text-[11px] px-2 py-0.5 rounded border ${
                  isBuy ? "text-buy bg-buy/10 border-buy/20" : "text-[#F6465D] bg-[#F6465D]/10 border-[#F6465D]/20"
                }`}
              >
                {type}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.07] transition-colors text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 h-10 rounded-lg font-semibold text-white text-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                isBuy ? "bg-buy hover:bg-buy/90" : "bg-[#F6465D] hover:bg-[#F6465D]/90"
              }`}
            >
              {isLoading ? "Processing..." : `Confirm ${type}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
