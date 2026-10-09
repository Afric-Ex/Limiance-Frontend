import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { useMemo, useState } from "react";
import { fiatKeys, fiatService } from "../services/fiat";
import { tradingKeys, tradingService } from "../services/trading";
import { TemporaryDepositAccount } from "../types/fiat";
import { errorMessageHandler } from "../lib/error-handler";
import { successNotification } from "../lib/notification-handler";
import { useDepositStore } from "../stores/deposit-store";
import { useInfiniteList } from "./use-infinite-list";
import {
  fiatAssetImageMap,
  getFiatQuoteReceivedAmount,
  normalizeFiatQuoteAmount,
} from "../lib/fiat-assets";

const unwrap = <T,>(res: any): T => {
  let cur = res;
  while (
    cur &&
    typeof cur === "object" &&
    "data" in cur &&
    (typeof cur.data === "object" || Array.isArray(cur.data))
  ) {
    cur = cur.data;
  }
  return cur as T;
};

// Coins the deposit/card pickers offer. `trading/listed_tokens` is the backend's
// own supported-token list and answers one row per token per chain, so it's paged
// in and collapsed to one symbol per token here. Falls back to a small curated
// set while the first page is loading, or if the request fails.
const FALLBACK_FIAT_SYMBOLS = ["USDT", "USDC", "BTC", "ETH", "SOL"];
const FIAT_SYMBOLS_PAGE_SIZE = 50;

export const useFiatCoinSymbols = () => {
  const {
    items,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    isError,
    refetch,
    fetchNextPage,
  } = useInfiniteList({
    queryKey: tradingKeys.listedTokens(),
    limit: FIAT_SYMBOLS_PAGE_SIZE,
    fetchPage: ({ page, limit }) => tradingService.listedTokens({ page, limit }),
    // Rows repeat a symbol once per chain (CNGN arrives four times), and the
    // same symbol can straddle a page boundary, so dedupe on the key.
    getItemId: (token: { symbol?: string }) => token?.symbol,
  });

  const coinSymbols = useMemo(() => {
    const symbols = items
      .map((token: any) => String(token?.symbol ?? "").trim().toUpperCase())
      .filter(Boolean);
    return symbols.length ? symbols : FALLBACK_FIAT_SYMBOLS;
  }, [items]);
  const coinImages = useMemo(() => fiatAssetImageMap(items), [items]);

  return {
    coinSymbols,
    coinImages,
    coinSymbolsLoading: isPending,
    hasMoreCoins: hasNextPage,
    isLoadingMoreCoins: isFetchingNextPage,
    isCoinsError: isError,
    loadMoreCoins: fetchNextPage,
    retryCoins: refetch,
  };
};

export const useFiatBankDeposit = () => {
  const queryClient = useQueryClient();
  const markPendingDeposit = useDepositStore((state) => state.markPending);
  const {
    coinSymbols,
    coinImages,
    coinSymbolsLoading,
    hasMoreCoins,
    isLoadingMoreCoins,
    isCoinsError,
    loadMoreCoins,
    retryCoins,
  } = useFiatCoinSymbols();
  const form = useForm({
    initialValues: { symbol: "USDT", bankCode: "", amount: "" },
  });
  const [account, setAccount] = useState<TemporaryDepositAccount | null>(null);
  const [expirySeconds, setExpirySeconds] = useState(0);

  const { data: banks, isLoading: banksLoading } = useQuery({
    queryKey: fiatKeys.banks,
    queryFn: () => fiatService.getBanks(),
    select: (res: any) => {
      const body = res?.data && typeof res.data === "object" ? res.data : res;
      const d = Array.isArray(body) ? body : body?.banks ?? [];
      return Array.isArray(d) ? d : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const quoteAmount = normalizeFiatQuoteAmount(form.values.amount);
  const quoteSymbol = form.values.symbol.trim().toLowerCase();
  const quoteCurrency = "ngn";
  const { data: quote, isLoading: rateLoading } = useQuery({
    queryKey: fiatKeys.quoteFor({
      depositAmount: quoteAmount,
      symbol: quoteSymbol,
      currency: quoteCurrency,
    }),
    queryFn: () =>
      fiatService.getQuote({
        depositAmount: quoteAmount,
        symbol: quoteSymbol,
        currency: quoteCurrency,
      }),
    enabled: Number(quoteAmount) > 0 && !!quoteSymbol,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const rate = Number(quote?.rate) || 0;
  const quotedReceivedAmount = getFiatQuoteReceivedAmount(
    quote?.symbolAmountToReceive ?? quote?.symbolAmountToReceived
  );

  const { mutate: createAccount, isPending: creatingAccount } = useMutation({
    // Flag the symbol as in-flight here, not on confirm: the credit is driven by
    // the incoming bank transfer, so it can land before confirmDeposit is even
    // called. Marking at account creation puts the flag in place early enough.
    onMutate: () => markPendingDeposit(form.values.symbol),
    mutationFn: () =>
      fiatService.createDepositAccount({
        symbol: form.values.symbol,
        bankCode: form.values.bankCode,
        amount: form.values.amount,
      }),
    onSuccess: (res) => {
      const acc = unwrap<TemporaryDepositAccount>(res);
      setAccount(acc);
      setExpirySeconds(acc?.accountDurationSeconds || 1200);
    },
    onError: (e) => errorMessageHandler(e as any),
  });

  const { mutate: confirmDeposit, isPending: confirming } = useMutation({
    mutationFn: () => fiatService.confirmDeposit(account?.transactionReference as string),
    onSuccess: (res) => {
      const d = unwrap<{ message?: string }>(res);
      successNotification(d?.message || "Deposit confirmed — your assets will be credited shortly.");
      setAccount(null);
      setExpirySeconds(0);
      form.reset();
      queryClient.invalidateQueries({ queryKey: fiatKeys.historyRoot });
    },
    onError: (e) => errorMessageHandler(e as any),
  });

  return {
    banks,
    banksLoading,
    coinSymbols,
    coinImages,
    coinSymbolsLoading,
    hasMoreCoins,
    isLoadingMoreCoins,
    isCoinsError,
    loadMoreCoins,
    retryCoins,
    rate,
    quotedReceivedAmount,
    rateLoading,
    form,
    account,
    expirySeconds,
    creatingAccount,
    createAccount,
    confirming,
    confirmDeposit,
  };
};

export const useFiatCardDeposit = () => {
  const queryClient = useQueryClient();
  const markPendingDeposit = useDepositStore((state) => state.markPending);
  const {
    coinSymbols,
    coinImages,
    coinSymbolsLoading,
    hasMoreCoins,
    isLoadingMoreCoins,
    isCoinsError,
    loadMoreCoins,
    retryCoins,
  } = useFiatCoinSymbols();
  const form = useForm({
    initialValues: {
      symbol: "USDT",
      amount: "",
      cardNumber: "",
      cardExpiryMonth: "",
      cardExpiryYear: "",
      cardCvv: "",
      cardPin: "",
    },
  });

  const [pendingReference, setPendingReference] = useState("");
  const [pendingTokenId, setPendingTokenId] = useState("");
  const [authMode, setAuthMode] = useState<"otp" | "3ds" | null>(null);

  const finishCardAuth = (message?: string) => {
    successNotification(message || "Card payment successful — your assets will be credited shortly.");
    setAuthMode(null);
    setPendingReference("");
    setPendingTokenId("");
    form.reset();
    queryClient.invalidateQueries({ queryKey: fiatKeys.history });
  };

  const { mutate: pay, isPending: paying } = useMutation({
    // A card payment credits the balance as part of processing, so the flag has
    // to be set before the request goes out — by the time onSuccess runs the
    // balance_update may already have been delivered and missed.
    onMutate: () => markPendingDeposit(form.values.symbol),
    mutationFn: () =>
      fiatService.payCard({
        symbol: form.values.symbol,
        amount: form.values.amount,
        cardNumber: form.values.cardNumber.replace(/\s/g, ""),
        cardExpiryMonth: form.values.cardExpiryMonth,
        cardExpiryYear: form.values.cardExpiryYear,
        cardPin: form.values.cardPin || undefined,
        cardCvv: form.values.cardCvv,
      }),
    onSuccess: (res) => {
      const d = unwrap<{
        transactionReference?: string;
        paymentReference?: string;
        tokenId?: string;
        paymentStatus?: string;
        responseMessage?: string;
      }>(res);
      setPendingReference(d.transactionReference || d.paymentReference || "");
      setPendingTokenId(d.tokenId || d.paymentReference || "");

      const status = (d.paymentStatus || "").toLowerCase();
      if (status.includes("3ds") || status.includes("secure") || status.includes("challenge")) {
        setAuthMode("3ds");
      } else if (status.includes("otp") || status.includes("sms") || status.includes("pending")) {
        setAuthMode("otp");
      } else {
        finishCardAuth(d.responseMessage);
      }
    },
    onError: (e) => errorMessageHandler(e as any),
  });

  const { mutate: completeOtp, isPending: otpPending } = useMutation({
    mutationFn: ({ tokenId, otp }: { tokenId: string; otp: string }) =>
      fiatService.cardOtp({ transactionReference: pendingReference, tokenId, otp }),
    onSuccess: (res) => {
      const d = unwrap<{ message?: string }>(res);
      finishCardAuth(d?.message);
    },
    onError: (e) => errorMessageHandler(e as any),
  });

  const { mutate: complete3ds, isPending: threeDsPending } = useMutation({
    mutationFn: (params: {
      apiKey: string;
      cardNumber: string;
      cardExpiryMonth: string;
      cardExpiryYear: string;
      cardCvv: string;
      cardPin?: string;
    }) =>
      fiatService.card3ds({
        transactionReference: pendingReference,
        ...params,
      }),
    onSuccess: (res) => {
      const d = unwrap<{ message?: string }>(res);
      finishCardAuth(d?.message);
    },
    onError: (e) => errorMessageHandler(e as any),
  });

  const authPending = otpPending || threeDsPending;

  return {
    form,
    coinSymbols,
    coinImages,
    coinSymbolsLoading,
    hasMoreCoins,
    isLoadingMoreCoins,
    isCoinsError,
    loadMoreCoins,
    retryCoins,
    paying,
    pay,
    pendingReference,
    pendingTokenId,
    authMode,
    setAuthMode,
    completeOtp,
    otpPending,
    complete3ds,
    threeDsPending,
    authPending,
  };
};