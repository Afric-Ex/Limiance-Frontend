import React from "react";
import { Button } from "@mantine/core";
import { MdCheckCircle, MdWarning } from "react-icons/md";

interface BuyerPaidPanelProps {
  counterpartyName: string;
  quantity: number;
  asset: string;
  updatedAt: string;
  onDisputeOpen: () => void;
}

export function BuyerPaidPanel({
  counterpartyName,
  quantity,
  asset,
  updatedAt,
  onDisputeOpen,
}: BuyerPaidPanelProps) {
  const [secondsLeft, setSecondsLeft] = React.useState(0);

  const deadlineStr = updatedAt
    ? new Date(new Date(updatedAt).getTime() + 15 * 60000).toISOString()
    : new Date(Date.now() + 900000).toISOString();

  React.useEffect(() => {
    const end = new Date(deadlineStr).getTime();
    const tick = () => {
      const diff = Math.floor((end - Date.now()) / 1000);
      setSecondsLeft(diff);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadlineStr]);

  const mins = Math.max(0, Math.floor(secondsLeft / 60));
  const secs = Math.max(0, secondsLeft % 60);

  return (
    <>
      {/* Payment confirmed notice */}
      <div className="bg-buy/[0.08] border border-buy/20 rounded-xl p-4 mt-4 flex items-start gap-3">
        <MdCheckCircle className="text-buy shrink-0 mt-0.5" size={18} />
        <div>
          <div className="text-buy font-semibold text-sm">Payment Confirmed</div>
          <p className="text-white/55 text-xs mt-0.5">
            You confirmed payment at {new Date(updatedAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Countdown */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mt-4 text-center">
        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Seller must release within</div>
        <div className="text-4xl font-mono font-bold text-white tracking-tight">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </div>
        <div className="text-[11px] uppercase tracking-widest text-white/35 mt-1.5">minutes : seconds</div>
      </div>

      {/* Waiting for seller */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mt-4 text-center">
        <div className="text-white text-sm font-semibold mb-1.5">
          Waiting for {counterpartyName || "seller"}
        </div>
        <p className="text-white/50 text-sm">
          Waiting for them to release{" "}
          <span className="text-white font-semibold font-mono">{quantity.toLocaleString()} {asset}</span> to your account.
        </p>
      </div>

      {/* Warning notice */}
      <div className="bg-[#FBA42A]/10 border border-[#FBA42A]/20 rounded-lg p-3 mt-4 flex items-start gap-2">
        <MdWarning className="text-[#FBA42A] shrink-0 mt-0.5" size={14} />
        <p className="text-[#FBA42A]/90 text-xs leading-relaxed">
          Do not attempt to cancel. Your payment has already been sent. If you filed a false payment confirmation, your account may be restricted.
        </p>
      </div>

      {/* Dispute button */}
      <div className="mt-6">
        <Button
          variant="outline"
          className="w-full !border-[#FBA42A]/30 !text-[#FBA42A] hover:!bg-[#FBA42A]/[0.08] !h-10 !rounded-lg !transition-colors"
          onClick={onDisputeOpen}
        >
          File a Dispute
        </Button>
      </div>
    </>
  );
}
