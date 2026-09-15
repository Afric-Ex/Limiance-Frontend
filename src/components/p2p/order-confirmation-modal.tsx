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
  const accentColor = isBuy ? "#0ECB81" : "#F6465D";
  const accentBg = isBuy ? "rgba(14,203,129,0.12)" : "rgba(246,70,93,0.12)";
  const accentBorder = isBuy ? "rgba(14,203,129,0.25)" : "rgba(246,70,93,0.25)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-elevated border border-white/10 rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Top gradient bar */}
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <span className="text-white font-bold text-base tracking-tight">Confirm Order</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all text-lg"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Summary hero */}
          <div className="text-center py-2">
            <div className="text-white/50 text-sm mb-2">
              You are about to{" "}
              <span
                className="font-bold"
                style={{ color: accentColor }}
              >
                {type.toLowerCase()}
              </span>
            </div>
            <div className="text-4xl font-bold text-white tracking-tight mb-1">
              {cryptoAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
              <span className="text-white/60 text-3xl">{asset}</span>
            </div>
            <div className="text-sm text-white/50">
              for{" "}
              <span className="font-bold text-white text-base">
                {fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}
              </span>
            </div>
          </div>

          {/* Detail rows */}
          <div
            className="rounded-xl p-4 flex flex-col gap-3 text-sm"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex justify-between items-center">
              <span className="text-white/40 font-medium">Price</span>
              <span className="text-white font-semibold">
                {price.toLocaleString()} {fiat}
              </span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-between items-center">
              <span className="text-white/40 font-medium">Action</span>
              <span
                className="font-bold text-sm px-3 py-1 rounded-lg"
                style={{ color: accentColor, background: accentBg, border: `1px solid ${accentBorder}` }}
              >
                {type}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 h-11 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
              style={{ background: accentColor }}
            >
              {isLoading ? "Processing..." : `Confirm ${type}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
