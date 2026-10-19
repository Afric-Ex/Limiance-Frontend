"use client";

import { NumberInput } from "@mantine/core";
import { Button } from "@/src/components/ui/button";
import { BalanceCloak } from "@/src/components/shared/balance-cloak";
import { InlineLoading } from "@/src/components/shared/inline-loading";
import { LimTokenIcon } from "../lim-token-icon";
import { useLimWallet } from "@/src/hooks/use-lim-wallet";
import { LIM_SYMBOL, formatAmount } from "@/src/lib/lim";
import type { LimPurchaseController } from "@/src/hooks/use-lim-purchase";

const PERCENT_CHOICES = [25, 50, 75, 100];

export function BuyLimAmountStep({
  controller,
}: {
  controller: LimPurchaseController;
}) {
  const {
    amount,
    setAmount,
    applyPercent,
    validation,
    validationMessage,
    liveQuote,
    quoteFetching,
    quoteUnavailable,
    payBalance,
    spotBalance,
    balancesLoading,
    startReview,
  } = controller;
  const { logo } = useLimWallet();

  const insufficient =
    !validation.ok &&
    validation.error === "insufficient" &&
    spotBalance >= Number(amount || 0) &&
    spotBalance > 0;

  const receiveDisplay = quoteFetching ? (
    <InlineLoading />
  ) : quoteUnavailable || !liveQuote ? (
    <span className="text-sm font-medium text-error-1">
      Live rate unavailable
    </span>
  ) : (
    <span className="text-lg font-bold tabular-nums text-white">
      ≈ {liveQuote.received != null ? formatAmount(liveQuote.received) : "—"}
    </span>
  );

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[600px]:p-5 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-white">
          Buy {LIM_SYMBOL}
        </h1>
        <p className="text-sm text-white/40">
          Convert USDT to {LIM_SYMBOL} at the live platform rate.
        </p>
      </div>

      {/* You pay */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <label
            htmlFor="buy-lim-amount"
            className="text-xs font-semibold uppercase tracking-wider text-white/50"
          >
            You pay
          </label>
          <span className="text-xs text-white/40">
            Available:{" "}
            <span className="font-bold text-primary">
              {balancesLoading ? "…" : <BalanceCloak balance={payBalance} />}{" "}
              USDT
            </span>
          </span>
        </div>
        <NumberInput
          id="buy-lim-amount"
          hideControls
          classNames={{
            section: "!w-fit !right-3",
            input:
              "!bg-white/[0.03] !border !border-white/[0.08] hover:!border-white/[0.18] focus:!border-primary/60 focus:!shadow-[0_0_10px_rgba(77,119,240,0.12)] !rounded-xl !h-[56px] !text-white !text-sm !transition-all !duration-200 placeholder:!text-white/20",
          }}
          placeholder="0.00"
          rightSection={
            <span className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">USDT</span>
            </span>
          }
          thousandSeparator=","
          allowNegative={false}
          decimalScale={6}
          value={amount}
          onChange={(val) => setAmount(`${val}`)}
          aria-label="Amount of USDT to spend"
        />
        <div className="flex items-center gap-2">
          {PERCENT_CHOICES.map((percent) => (
            <button
              key={percent}
              type="button"
              onClick={() => applyPercent(percent)}
              disabled={payBalance <= 0}
              className="rounded-md bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-white/60 transition-colors hover:bg-primary/15 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {percent === 100 ? "MAX" : `${percent}%`}
            </button>
          ))}
        </div>
      </div>

      {/* You receive */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
          You receive (estimated)
        </label>
        <div className="flex items-center justify-between gap-3" aria-live="polite">
          {receiveDisplay}
          <span className="flex items-center gap-2">
            <LimTokenIcon logo={logo} size={22} />
            <span className="text-xs font-bold text-white">{LIM_SYMBOL}</span>
          </span>
        </div>
        {liveQuote && !quoteUnavailable && (
          <span className="text-[11px] text-white/35">
            1 USDT ≈ {formatAmount(liveQuote.rate, 6)} {LIM_SYMBOL}
          </span>
        )}
      </div>

      {validationMessage && (
        <p role="alert" className="text-xs font-medium text-error-1">
          {validationMessage}
        </p>
      )}

      {insufficient && (
        <p className="text-xs text-white/40">
          This purchase is paid from your Funding balance. You have{" "}
          <BalanceCloak balance={spotBalance} /> USDT in Spot — move it to
          Funding first to use it here.
        </p>
      )}

      <Button
        variant="buy"
        size="primary"
        disabled={!validation.ok || !liveQuote || quoteFetching}
        onClick={startReview}
      >
        Review purchase
      </Button>

      <p className="text-center text-[11px] text-white/30">
        Paid from your Funding balance. You&apos;ll see the exact rate before
        anything is executed.
      </p>
    </section>
  );
}
