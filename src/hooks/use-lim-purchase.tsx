"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePortfolioWs } from "./use-portfolio-ws";
import { tradingService, tradingKeys } from "@/src/services/trading";
import { asset, assetKeys } from "@/src/services/asset";
import {
  ConversionQuote,
  LIM_SYMBOL,
  normalizeConversionQuote,
  normalizeConversionResult,
  percentOfBalance,
  rateDeviationExceeded,
  validateBuyAmount,
  AmountValidationError,
} from "@/src/lib/lim";

const PAY_SYMBOL = "USDT";

const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Pull a user-facing message out of an axios error without toasting. */
const extractErrorMessage = (error: any): string => {
  const data = error?.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
  if (typeof data?.error === "string" && data.error.trim()) return data.error.trim();
  if (typeof data?.data === "string" && data.data.trim()) return data.data.trim();
  if (typeof data === "string" && data.trim()) return data.trim();
  if (error?.response?.status === 429) {
    return "Too many attempts — please wait a moment and try again.";
  }
  return "The purchase could not be completed. Please try again.";
};

const quoteQueryKey = (amount: string) => ["lim-buy-quote", PAY_SYMBOL, amount] as const;

const fetchLimQuote = async (amount: string): Promise<ConversionQuote | null> => {
  const response = await tradingService.conversionRate({
    fromAsset: PAY_SYMBOL,
    toAsset: LIM_SYMBOL,
    quantity: amount,
  });
  return normalizeConversionQuote(response, amount);
};

export type LimPurchaseStep = "amount" | "review" | "result";

export interface LimPurchaseResult {
  /**
   * credited — server confirmed the conversion (amount when reported)
   * pending  — server accepted but has not settled; do not claim success
   * unknown  — network/timeout after submit; reconcile before retrying
   */
  kind: "credited" | "pending" | "unknown";
  received: number | null;
  paid: number | null;
  reference?: string;
  status?: string;
  message?: string;
}

const AMOUNT_ERROR_COPY: Record<Exclude<AmountValidationError, null>, string> = {
  empty: "Enter an amount to continue.",
  invalid: "Enter a valid number.",
  negative: "Amount cannot be negative.",
  zero: "Amount must be greater than zero.",
  below_min: "This amount is below the minimum for this purchase.",
  above_max: "This amount is above the maximum for this purchase.",
  insufficient: "Insufficient USDT in your Funding account.",
};

/**
 * USDT → LIM purchase flow built entirely on the existing conversion services
 * (`trading/conversion_rate` for quotes, `wallet/convert_asset` for execution).
 * The hook owns the state machine; the UI components stay presentational.
 *
 * Financial rules honoured here:
 *  - the server quote is the only price source; nothing is hardcoded
 *  - the quote is revalidated before execution and a rate move beyond 0.5%
 *    requires an explicit re-confirmation from the user
 *  - duplicate submits are blocked while a request is in flight
 *  - a network failure after submit is treated as an UNKNOWN outcome; the user
 *    is sent to Convert History to reconcile instead of being told to retry
 */
export function useLimPurchase() {
  const queryClient = useQueryClient();
  const { coins, isLoading: balancesLoading, refreshBalances } = usePortfolioWs({
    coins: true,
  });

  const [amount, setAmountState] = useState("");
  const [step, setStep] = useState<LimPurchaseStep>("amount");
  const [displayedQuote, setDisplayedQuote] = useState<ConversionQuote | null>(null);
  const [rateChanged, setRateChanged] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<LimPurchaseResult | null>(null);
  const [revalidating, setRevalidating] = useState(false);
  const executingRef = useRef(false);

  const usdtCoin = useMemo(
    () => coins.find((coin) => String(coin.symbol).toUpperCase() === PAY_SYMBOL) ?? null,
    [coins]
  );
  const fundingBalance = toNumber(usdtCoin?.fundingBalance);
  const spotBalance = toNumber(usdtCoin?.spotBalance);
  // The established convert flow debits the Funding account by default, so the
  // funding balance is what the pre-submit validation checks. Spot is surfaced
  // as guidance when it could cover a funding shortfall.
  const payBalance = fundingBalance;

  const quoteEnabled = !!amount && toNumber(amount) > 0;

  const {
    data: liveQuote,
    isFetching: quoteFetching,
    isError: quoteFailed,
  } = useQuery({
    queryKey: quoteQueryKey(amount),
    queryFn: () => fetchLimQuote(amount),
    select: (quote) => quote ?? null,
    enabled: quoteEnabled,
    staleTime: 15_000,
    retry: false,
    throwOnError: false,
  });

  const quoteUnavailable = quoteEnabled && !quoteFetching && (quoteFailed || liveQuote == null);

  const validation = useMemo(
    () =>
      validateBuyAmount(amount, {
        balance: payBalance,
        min: displayedQuote?.minAmount ?? liveQuote?.minAmount ?? null,
        max: displayedQuote?.maxAmount ?? liveQuote?.maxAmount ?? null,
      }),
    [amount, payBalance, displayedQuote, liveQuote]
  );

  const validationMessage =
    validation.ok || !amount
      ? null
      : AMOUNT_ERROR_COPY[validation.error ?? "invalid"];

  const setAmount = useCallback((next: string) => {
    executingRef.current = false;
    setAmountState(next);
    setSubmitError(null);
    setRateChanged(false);
    setDisplayedQuote(null);
  }, []);

  const applyPercent = useCallback(
    (pct: number) => {
      const next = percentOfBalance(payBalance, pct, 6);
      if (next) setAmount(next);
    },
    [payBalance, setAmount]
  );

  const startReview = useCallback(() => {
    if (!validation.ok || !liveQuote) return;
    executingRef.current = false;
    setDisplayedQuote(liveQuote);
    setRateChanged(false);
    setSubmitError(null);
    setStep("review");
  }, [validation.ok, liveQuote]);

  const backToAmount = useCallback(() => {
    if (executingRef.current) return;
    setStep("amount");
    setRateChanged(false);
    setSubmitError(null);
  }, []);

  const { mutate: execute, isPending: executing } = useMutation({
    mutationFn: (params: { amount: string }) =>
      asset.convertAsset({
        fromAsset: PAY_SYMBOL,
        toAsset: LIM_SYMBOL,
        amount: params.amount,
      }),
    onSuccess: (response) => {
      const normalized = normalizeConversionResult(response);
      setResult({
        kind: normalized.outcome === "credited" ? "credited" : "pending",
        received: normalized.received,
        paid: normalized.paid ?? toNumber(amount),
        reference: normalized.reference,
        status: normalized.status,
        message: normalized.message,
      });
      setStep("result");
      // Source balances always change; history refresh keeps every surface
      // (wallet, convert history, recent activity) consistent after settlement.
      refreshBalances();
      void queryClient.invalidateQueries({ queryKey: tradingKeys.convertHistory });
      void queryClient.invalidateQueries({ queryKey: assetKeys.transactionHistoryList() });
      queryClient.invalidateQueries({ queryKey: assetKeys.allWallets() });
    },
    onError: (error: any) => {
      if (error?.response) {
        // The server answered and rejected the request — nothing was executed,
        // so it is safe to correct and retry from the review step.
        executingRef.current = false;
        setSubmitError(extractErrorMessage(error));
        setStep("review");
        return;
      }
      // Network error / timeout after submission: the transaction outcome is
      // unknown. Reconcile through history instead of blind retrying.
      setResult({
        kind: "unknown",
        received: null,
        paid: toNumber(amount),
        message:
          error?.code === "ECONNABORTED"
            ? "The request timed out before we received a confirmation."
            : "We couldn't reach the server to confirm this purchase.",
      });
      setStep("result");
      refreshBalances();
      void queryClient.invalidateQueries({ queryKey: tradingKeys.convertHistory });
    },
  });

  /**
   * Confirm from the review step. Revalidates the quote first (and the balance
   * with the latest wallet data): a rate move beyond tolerance updates the
   * displayed quote and requires one more explicit confirmation.
   */
  const confirm = useCallback(async () => {
    if (executingRef.current || executing || !displayedQuote) return;
    setRevalidating(true);
    setSubmitError(null);
    try {
      const fresh = await queryClient.fetchQuery({
        queryKey: quoteQueryKey(amount),
        queryFn: () => fetchLimQuote(amount),
        staleTime: 0,
      });

      if (!fresh) {
        setSubmitError("Live price unavailable for this pair right now. Please try again.");
        return;
      }

      // Balance re-check against the latest wallet snapshot.
      if (toNumber(amount) > payBalance + Number.EPSILON) {
        setSubmitError(AMOUNT_ERROR_COPY.insufficient);
        return;
      }

      if (rateDeviationExceeded(displayedQuote.rate, fresh.rate)) {
        setDisplayedQuote(fresh);
        setRateChanged(true);
        return;
      }

      setRateChanged(false);
      setDisplayedQuote(fresh);
      executingRef.current = true;
      execute({ amount });
    } finally {
      setRevalidating(false);
    }
  }, [amount, displayedQuote, execute, executing, payBalance, queryClient]);

  const reset = useCallback(() => {
    executingRef.current = false;
    setAmountState("");
    setStep("amount");
    setDisplayedQuote(null);
    setRateChanged(false);
    setSubmitError(null);
    setResult(null);
  }, []);

  return {
    // balances
    fundingBalance,
    spotBalance,
    payBalance,
    balancesLoading,
    refreshBalances,

    // amount + quote
    amount,
    setAmount,
    applyPercent,
    validation,
    validationMessage,
    liveQuote,
    quoteFetching,
    quoteUnavailable,

    // step machine
    step,
    startReview,
    backToAmount,
    displayedQuote,
    rateChanged,
    revalidating,
    confirm,
    executing,
    submitError,

    // outcome
    result,
    reset,
  };
}

export type LimPurchaseController = ReturnType<typeof useLimPurchase>;
