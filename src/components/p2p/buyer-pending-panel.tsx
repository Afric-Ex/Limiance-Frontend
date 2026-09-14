import React, { useState, useEffect } from "react";
import { Button } from "@mantine/core";

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

  const color = isUrgent ? "text-red-400" : isWarning ? "text-yellow-400" : "text-green-400";

  return (
    <div className={`text-center transition-all duration-500 ${color}`}>
      <div className="text-6xl font-mono font-bold tracking-tight">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
      <div className="text-sm mt-2 text-white/40 uppercase tracking-widest font-semibold">minutes : seconds</div>
      {isUrgent && <p className="text-red-400 text-xs mt-3 animate-pulse font-bold">⚠️ Order cancelling soon!</p>}
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
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center mt-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-white/60 text-sm mb-4 font-medium uppercase tracking-wider flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            Pay within
          </div>
          <CountdownTimer deadline={deadlineStr} />
          <div className="text-white/40 text-xs mt-4">Order auto-cancels if unpaid</div>
        </div>
      </div>

      {paymentMethod && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mt-6">
          <div className="text-white/70 text-sm font-bold tracking-wide uppercase mb-4 flex items-center gap-2">
            <span className="text-lg">💳</span> Payment Instructions
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-white/50">Bank</span>
              <span className="text-white">{paymentMethod?.data?.bankName ?? paymentMethod?.method ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50">Account Name</span>
              <span className="text-white">{paymentMethod?.data?.accountName ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono">{paymentMethod?.data?.accountNumber ?? "—"}</span>
                {paymentMethod?.data?.accountNumber && (
                  <button onClick={() => copyToClipboard(paymentMethod.data.accountNumber)} className="text-yellow-400 hover:text-yellow-300 text-xs">Copy</button>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50">Amount</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">{fiatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {fiat}</span>
                <button onClick={() => copyToClipboard(String(fiatAmount))} className="text-yellow-400 hover:text-yellow-300 text-xs">Copy</button>
              </div>
            </div>
          </div>
          <div className="mt-5 text-xs text-white/60 bg-black/30 border border-white/10 p-4 rounded-xl flex gap-3 items-start">
            <span className="text-xl leading-none">⚠️</span>
            <span className="leading-relaxed">Include your Order ID <strong className="text-white bg-white/10 px-1 rounded">{orderId.slice(-8).toUpperCase()}</strong> as the payment reference or narration.</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 mt-8">
        <Button 
          className="w-full bg-gradient-to-r from-[#0ECB81] to-emerald-600 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold h-14 text-lg rounded-xl shadow-[0_4px_15px_rgba(14,203,129,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(14,203,129,0.5)]" 
          onClick={() => setPaymentModalOpen(true)}
        >
          I Have Paid
        </Button>
        <Button 
          variant="subtle" 
          className="w-full text-white/50 hover:text-white hover:bg-white/5 h-12 rounded-xl transition-colors" 
          onClick={() => setCancelModalOpen(true)}
        >
          Cancel Order
        </Button>
      </div>
    </>
  );
}
