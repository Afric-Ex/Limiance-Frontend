"use client";

import React, { useState } from "react";
import { Loader } from "@mantine/core";
import { modals } from "@mantine/modals";
import { tradingService } from "@/src/services/trading";
import toast from "react-hot-toast";
import { useUserStore } from "@/src/stores/user-store";
import { MdClose, MdShield, MdTrendingUp, MdWarning } from "react-icons/md";
import clsx from "clsx";

interface OpenFuturesModalProps {
  onConfirm: () => void;
  onExit: () => void;
}

export const OpenFuturesModal = ({ onConfirm, onExit }: OpenFuturesModalProps) => {
  const { fetchUser } = useUserStore();
  const [checked, setChecked] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const canCreate = checked && checked2 && !isLoading;

  const handleCreate = async () => {
    if (!canCreate) return;
    setIsLoading(true);
    try {
      await tradingService.acceptFutures();
      toast.success("Futures Account activated successfully!");
      // Refetch user data from backend to ensure isFuturesAccepted is updated
      await fetchUser();
      onConfirm();
      modals.closeAll();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to activate Futures Account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] max-h-[85dvh] flex flex-col bg-[#13151c] border border-white/[0.07] rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          {/* Icon */}
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <MdTrendingUp size={18} className="text-primary" />
          </div>
          <span className="font-bold text-white text-base">Open Futures Account</span>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <MdClose size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-4 sm:gap-5 sm:p-5">

        {/* Description card */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-4 py-3.5">
          <p className="text-sm text-white/55 leading-relaxed">
            Futures trading lets you buy or sell contracts obligating delivery of an asset at a
            fixed price on a future date. Contracts are standardized and traded on futures exchanges.
          </p>
        </div>

        {/* Risk banner */}
        <div className="flex items-start gap-3 rounded-xl bg-[#F6465D]/[0.07] border border-[#F6465D]/20 px-4 py-3">
          <MdWarning size={17} className="text-[#F6465D] mt-0.5 shrink-0" />
          <p className="text-xs text-[#F6465D]/90 leading-relaxed">
            Futures trading carries significant risk and may result in losses exceeding your initial deposit. Only trade with funds you can afford to lose.
          </p>
        </div>

        {/* Regulations */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2">
            <MdShield size={14} className="text-white/40" />
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Regulations</span>
          </div>

          {/* Checkbox 1 */}
          <label
            className={clsx(
              "flex items-start gap-3 rounded-xl border px-4 py-3.5 cursor-pointer transition-all",
              checked
                ? "border-primary/40 bg-primary/[0.06]"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
            )}
          >
            <div className="mt-0.5 shrink-0">
              <div
                className={clsx(
                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                  checked ? "border-primary bg-primary" : "border-white/25 bg-transparent"
                )}
              >
                {checked && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span className="text-sm text-white/70 leading-snug">
              I have read and agree to{" "}
              <span
                className="text-primary underline underline-offset-2 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                Limiance Futures regulations
              </span>
            </span>
          </label>

          {/* Checkbox 2 */}
          <label
            className={clsx(
              "flex items-start gap-3 rounded-xl border px-4 py-3.5 cursor-pointer transition-all",
              checked2
                ? "border-primary/40 bg-primary/[0.06]"
                : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
            )}
          >
            <div className="mt-0.5 shrink-0">
              <div
                className={clsx(
                  "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                  checked2 ? "border-primary bg-primary" : "border-white/25 bg-transparent"
                )}
              >
                {checked2 && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={checked2}
              onChange={(e) => setChecked2(e.target.checked)}
            />
            <span className="text-sm text-white/70 leading-snug">
              I understand the rules and risks of futures trading, and agree that any loss is my own responsibility, regardless of the platform
            </span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#13151c] px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <button
          type="button"
          onClick={handleCreate}
          disabled={!canCreate}
          className={clsx(
            "w-full h-12 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
            canCreate
              ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-[0_0_20px_rgba(77,119,240,0.25)]"
              : "bg-white/[0.05] text-white/30 cursor-not-allowed"
          )}
        >
          {isLoading && <Loader size={14} color="white" />}
          {isLoading ? "Activating…" : "Create Futures Account"}
        </button>
        {!canCreate && (checked || checked2) && (
          <p className="text-center text-xs text-white/30 mt-2">
            Please agree to both regulations to continue
          </p>
        )}
      </div>
    </div>
  );
};