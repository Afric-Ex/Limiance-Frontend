"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaCircleCheck, FaCircleExclamation, FaClock } from "react-icons/fa6";
import { Button } from "@/src/components/ui/button";
import { LIM_SYMBOL, formatAmount, truncateMiddle } from "@/src/lib/lim";
import type { LimPurchaseController } from "@/src/hooks/use-lim-purchase";

const RESULT_META = {
  credited: {
    icon: <FaCircleCheck size={30} className="text-buy" />,
    iconBg: "bg-buy-tint",
    title: "Purchase complete",
  },
  pending: {
    icon: <FaClock size={30} className="text-warning-text" />,
    iconBg: "bg-warning/[0.12]",
    title: "Purchase submitted",
  },
  unknown: {
    icon: <FaCircleExclamation size={30} className="text-warning-text" />,
    iconBg: "bg-warning/[0.12]",
    title: "We couldn't confirm this purchase",
  },
} as const;

export function BuyLimResultStep({
  controller,
}: {
  controller: LimPurchaseController;
}) {
  const { result, reset } = controller;
  const router = useRouter();

  if (!result) return null;

  const meta = RESULT_META[result.kind];

  const body = (() => {
    switch (result.kind) {
      case "credited":
        return result.received != null
          ? `${formatAmount(result.received)} ${LIM_SYMBOL} has been credited to your Funding balance.`
          : `Your ${LIM_SYMBOL} has been credited to your Funding balance.`;
      case "pending":
        return `Your payment was accepted. We'll credit ${LIM_SYMBOL} to your balance as soon as the conversion settles — no action needed.`;
      case "unknown":
        return `${result.message ?? "The server didn't confirm this purchase."} Check your Convert History before trying again — if the conversion isn't there, nothing was deducted.`;
    }
  })();

  const handleDone = () => {
    reset();
    router.push("/assets/earn");
  };

  return (
    <section className="flex flex-col items-center gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[600px]:p-5 text-center animate-fade-in">
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-full ${meta.iconBg}`}
        aria-hidden="true"
      >
        {meta.icon}
      </span>

      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold text-white">{meta.title}</h1>
        <p className="text-sm leading-relaxed text-white/50">{body}</p>
      </div>

      {result.kind === "credited" && result.received != null && (
        <p className="text-2xl font-extrabold tabular-nums text-buy">
          +{formatAmount(result.received)}{" "}
          <span className="text-base font-semibold text-white/50">
            {LIM_SYMBOL}
          </span>
        </p>
      )}

      {(result.paid != null || result.reference) && (
        <dl className="w-full flex flex-col divide-y divide-white/[0.06] rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 text-left">
          {result.paid != null && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-xs text-white/40">Paid</dt>
              <dd className="text-sm font-semibold tabular-nums text-white">
                {formatAmount(result.paid)} USDT
              </dd>
            </div>
          )}
          {result.reference && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-xs text-white/40">Reference</dt>
              <dd className="text-sm font-medium tabular-nums text-white/70">
                {truncateMiddle(result.reference)}
              </dd>
            </div>
          )}
        </dl>
      )}

      <div className="flex w-full flex-col gap-3">
        <Button variant="buy" size="primary" onClick={handleDone}>
          {result.kind === "credited" ? "Done" : "Back to Earn"}
        </Button>
        <Link href="/orders/convert-history" className="w-full">
          <Button variant="subtle" size="compact">
            View Convert History
          </Button>
        </Link>
      </div>
    </section>
  );
}
