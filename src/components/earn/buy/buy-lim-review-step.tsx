"use client";

import { Button } from "@/src/components/ui/button";
import { InlineLoading } from "@/src/components/shared/inline-loading";
import { LIM_SYMBOL, formatAmount } from "@/src/lib/lim";
import type { LimPurchaseController } from "@/src/hooks/use-lim-purchase";

export function BuyLimReviewStep({
  controller,
}: {
  controller: LimPurchaseController;
}) {
  const {
    amount,
    displayedQuote,
    rateChanged,
    revalidating,
    executing,
    confirm,
    backToAmount,
    submitError,
  } = controller;

  const busy = revalidating || executing;

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[600px]:p-5 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-white">Review purchase</h1>
        <p className="text-sm text-white/40">
          Check the numbers before confirming. Nothing has been executed yet.
        </p>
      </div>

      {rateChanged && (
        <div
          role="status"
          className="rounded-xl border border-warning/25 bg-warning/[0.08] px-4 py-3 text-xs leading-relaxed text-warning-text"
        >
          The rate moved while you were reviewing. We&apos;ve updated the
          numbers — confirm again to accept the new rate, or go back.
        </div>
      )}

      <dl className="flex flex-col divide-y divide-white/[0.06] rounded-xl border border-white/[0.05] bg-white/[0.02] px-4">
        <div className="flex items-center justify-between py-3.5">
          <dt className="text-xs text-white/40">You pay</dt>
          <dd className="text-sm font-semibold tabular-nums text-white">
            {formatAmount(amount)} USDT
          </dd>
        </div>
        <div className="flex items-center justify-between py-3.5">
          <dt className="text-xs text-white/40">Rate</dt>
          <dd className="text-sm font-semibold tabular-nums text-white">
            {displayedQuote
              ? `1 USDT ≈ ${formatAmount(displayedQuote.rate, 6)} ${LIM_SYMBOL}`
              : "—"}
          </dd>
        </div>
        <div className="flex items-center justify-between py-3.5">
          <dt className="text-xs text-white/40">You receive</dt>
          <dd className="text-sm font-bold tabular-nums text-buy">
            {displayedQuote?.received != null
              ? `≈ ${formatAmount(displayedQuote.received)} ${LIM_SYMBOL}`
              : "—"}
          </dd>
        </div>
      </dl>

      <p className="text-[11px] leading-relaxed text-white/30">
        The final amount is set by the platform when the conversion executes.
        If the rate moves more than 0.5% by then, you&apos;ll be asked to
        confirm the updated rate before anything is executed.
      </p>

      {submitError && (
        <p role="alert" className="text-xs font-medium text-error-1">
          {submitError}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button
          variant="buy"
          size="primary"
          disabled={busy || !displayedQuote}
          onClick={() => void confirm()}
        >
          {busy ? (
            <InlineLoading />
          ) : rateChanged ? (
            "Confirm updated rate"
          ) : (
            "Confirm purchase"
          )}
        </Button>
        <Button variant="subtle" size="compact" disabled={busy} onClick={backToAmount}>
          Back
        </Button>
      </div>
    </section>
  );
}
