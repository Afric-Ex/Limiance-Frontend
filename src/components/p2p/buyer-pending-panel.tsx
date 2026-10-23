"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@mantine/core";
import { MdWarning, MdContentCopy } from "react-icons/md";

interface BuyerPendingPanelProps {
  orderId: string;
  fiatAmount: number;
  fiat: string;
  paymentMethod: any;
  deadlineStr: string;
  setCancelModalOpen: (val: boolean) => void;
  setPaymentModalOpen: (val: boolean) => void;
  copyToClipboard: (text: string) => void;
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const end = new Date(deadline).getTime();
    const tick = () => {
      const diff = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft < 120;
  const isWarning = secondsLeft < 300;

  const color = isUrgent ? "text-[#F6465D]" : isWarning ? "text-[#FBA42A]" : "text-buy";

  return (
    <div className={`text-center ${color}`}>
      <div className="text-4xl font-mono font-bold tracking-tight">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
      <div className="text-[11px] mt-1 uppercase tracking-widest text-white/35 font-medium">
        minutes : seconds
      </div>
      {isUrgent && (
        <div className="text-[#F6465D] text-xs mt-2 font-medium flex items-center justify-center gap-1.5">
          <MdWarning size={14} />
          <span>Payment window closing soon</span>
        </div>
      )}
    </div>
  );
}

export function BuyerPendingPanel({
  orderId,
  fiatAmount,
  fiat,
  paymentMethod,
  deadlineStr,
  setCancelModalOpen,
  setPaymentModalOpen,
  copyToClipboard,
}: BuyerPendingPanelProps) {
  return (
    <>
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 text-center mt-4">
        <div className="text-white/45 text-[11px] mb-3 uppercase tracking-wider font-semibold">
          Pay Counterparty Within
        </div>
        <CountdownTimer deadline={deadlineStr} />
        <div className="text-white/35 text-xs mt-3">Order will automatically cancel if unpaid</div>
      </div>

      {paymentMethod && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mt-4">
          <div className="text-white/60 text-xs font-semibold tracking-wider uppercase mb-3.5">
            Payment Account Details
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
              <span className="text-white/40">Payment Amount</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold font-mono text-sm">
                  {fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}
                </span>
                <button
                  onClick={() => copyToClipboard(String(fiatAmount))}
                  className="text-primary hover:text-primary/80 transition-colors p-1"
                  title="Copy Amount"
                >
                  <MdContentCopy size={13} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-[#FBA42A]/90 bg-[#FBA42A]/10 border border-[#FBA42A]/20 p-3 rounded-lg flex items-start gap-2.5 leading-relaxed">
            <MdWarning size={16} className="shrink-0 mt-0.5" />
            <span>
              Include order reference <strong className="font-mono text-white bg-white/10 px-1 py-0.5 rounded">{orderId.slice(-8).toUpperCase()}</strong> in payment narration. Do not include crypto terms like &quot;USDT&quot; or &quot;crypto&quot;.
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5 mt-6">
        <Button
          className="w-full !bg-buy hover:!bg-buy/90 !text-white !font-semibold !h-11 !text-sm !rounded-lg"
          onClick={() => setPaymentModalOpen(true)}
        >
          I Have Paid
        </Button>
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
