import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { fiatKeys, fiatService } from "../services/fiat";
import { TemporaryDepositAccount } from "../types/fiat";
import { errorMessageHandler } from "../lib/error-handler";
import { successNotification } from "../lib/notification-handler";

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

export const useFiatBankDeposit = () => {
  const queryClient = useQueryClient();
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

  const { mutate: createAccount, isPending: creatingAccount } = useMutation({
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
      queryClient.invalidateQueries({ queryKey: fiatKeys.history });
    },
    onError: (e) => errorMessageHandler(e as any),
  });

  return {
    banks,
    banksLoading,
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