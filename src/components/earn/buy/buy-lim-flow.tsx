"use client";

import Link from "next/link";
import { FaArrowLeftLong } from "react-icons/fa6";
import { BuyLimAmountStep } from "./buy-lim-amount-step";
import { BuyLimReviewStep } from "./buy-lim-review-step";
import { BuyLimResultStep } from "./buy-lim-result-step";
import { useLimPurchase } from "@/src/hooks/use-lim-purchase";

/**
 * Buy LIM — USDT → LIM conversion, USDT-funded. Three steps over one state
 * machine (`useLimPurchase`): enter amount, review the quoted rate, confirm.
 */
export function BuyLimFlow() {
  const controller = useLimPurchase();

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5">
      {controller.step !== "result" && (
        <Link
          href="/assets/earn"
          className="inline-flex w-fit items-center gap-2 text-xs font-medium text-white/40 transition-colors hover:text-white/80"
        >
          <FaArrowLeftLong size={11} />
          Earn LIM
        </Link>
      )}

      {controller.step === "amount" && (
        <BuyLimAmountStep controller={controller} />
      )}
      {controller.step === "review" && (
        <BuyLimReviewStep controller={controller} />
      )}
      {controller.step === "result" && (
        <BuyLimResultStep controller={controller} />
      )}
    </div>
  );
}
