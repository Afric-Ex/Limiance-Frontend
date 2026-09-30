"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { modals } from "@mantine/modals";
import { MdOutlineClose } from "react-icons/md";
import { FaArrowRightLong, FaCircleCheck } from "react-icons/fa6";

interface DepositSuccessModalProps {
  symbol: string;
  amount: number;
  newBalance: number;
  balanceType?: string;
}

const formatAmount = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 8 });

const BALANCE_TYPE_LABELS: Record<string, string> = {
  funding_balance: "Funding Account",
  spot_balance: "Spot Account",
  futures_balance: "Futures Account",
  margin_balance: "Margin Account",
};

export const DepositSuccessModal = ({
  symbol,
  amount,
  newBalance,
  balanceType,
}: DepositSuccessModalProps) => {
  const router = useRouter();
  const accountLabel =
    BALANCE_TYPE_LABELS[balanceType ?? ""] ?? "Your Account";

  const goToAssets = () => {
    modals.closeAll();
    router.push("/assets/overview");
  };

  return (
    <div className="w-full max-w-[420px] bg-[#181a20] border border-white/[0.06] rounded-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/[0.06]">
        <div className="flex flex-col gap-0.5">
          <h4 className="text-lg font-bold text-white tracking-tight">Deposit Confirmed</h4>
          <p className="text-xs text-white/40">Your funds have landed</p>
        </div>
        <button
          onClick={modals.closeAll}
          aria-label="Close"
          className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-all active:scale-95 text-white/60 hover:text-white"
        >
          <MdOutlineClose size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col items-center gap-5 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-success-5/10 text-success-5 border border-success-5/20 flex items-center justify-center">
          <FaCircleCheck size={30} />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-white/60 leading-relaxed">
            Your deposit of
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-white tabular-nums">
            {formatAmount(amount)}{" "}
            <span className="text-success-5">{symbol}</span>
          </p>
        </div>

        <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.06] overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Credited To
            </span>
            <span className="text-sm font-bold text-white/80">{accountLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              New Balance
            </span>
            <span className="text-sm font-bold text-white/80 tabular-nums">
              {formatAmount(newBalance)} {symbol}
            </span>
          </div>
        </div>

        <p className="text-xs text-white/30 leading-relaxed">
          Funds are available to trade or transfer right away.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 px-6 pb-6 sm:px-8 sm:pb-8">
        <button
          onClick={modals.closeAll}
          className="sm:flex-1 h-12 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white/70 hover:text-white text-sm font-semibold transition-all active:scale-[0.98]"
        >
          Close
        </button>
        <button
          onClick={goToAssets}
          className="sm:flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 hover:shadow-[0_0_16px_rgba(77,119,240,0.3)] text-white text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          View Assets
          <FaArrowRightLong size={12} />
        </button>
      </div>
    </div>
  );
};
