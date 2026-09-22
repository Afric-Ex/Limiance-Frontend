import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { useRef, useState } from "react";
import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "../utils/constants";
import { fiatKeys, fiatService } from "../services/fiat";
import { FiatWithdrawalResponse } from "../types/fiat";
import { useUserStore } from "../stores/user-store";
import { errorMessageHandler } from "../lib/error-handler";
import { successNotification } from "../lib/notification-handler";
import { AuthenticatorVerificationModal } from "../components/transactions/authenticator-verify-modal";
import { SuccessModal } from "../components/login/verify-email-success";
import { ModalClose } from "../components/icons/modal-close";
import { Button } from "@mantine/core";
import { OtpInput } from "../components/settings/otp-input";
import { useRouter } from "next/navigation";

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

export const useFiatWithdrawal = () => {
  const { push } = useRouter();
  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const totpCodeRef = useRef<string | undefined>(undefined);
  const [reference, setReference] = useState("");

  const form = useForm({
    initialValues: {
      symbol: "USDT",
      amount: "",
      bankCode: "",
      accountNumber: "",
      accountName: "",
    },
  });

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

  // ─── Step 2: Authorize a pending Monnify payout ──────────────────────────
  const { mutate: authorize, isPending: authorizing } = useMutation({
    mutationFn: (authorizationCode: string) =>
      fiatService.authorizeWithdraw({ reference, authorizationCode }),
    onSuccess: (res) => {
      const d = unwrap<FiatWithdrawalResponse>(res);
      modals.closeAll();
      successNotification(d?.status || "Withdrawal authorized and processing.");
      queryClient.invalidateQueries({ queryKey: fiatKeys.history });
      modals.open({
        children: (
          <SuccessModal
            title="Withdrawal Processing"
            description={
              <div className="flex flex-col items-center gap-6">
                <p className="text-center text-2xl">
                  Your fiat withdrawal is processing. You&apos;ll be paid shortly.
                </p>
                <div className="flex flex-col gap-2 items-center">
                  <span className="text-gray-14 font-semibold">Amount</span>
                  <span className="text-primary font-bold text-lg">
                    {form.values.amount} {form.values.symbol}
                  </span>
                </div>
              </div>
            }
            onProceed={() => {
              modals.closeAll();
              setReference("");
              form.reset();
              push("/assets/overview");
            }}
            onClose={() => {
              modals.closeAll();
              setReference("");
              form.reset();
              push("/assets/overview");
            }}
          />
        ),
        ...DEFAULT_MODAL_SETTINGS,
      });
    },
    onError: (e) => errorMessageHandler(e as any),
  });

  // ─── Step 1: Initiate the fiat withdrawal ───────────────────────────────
  const { mutate: initiate, isPending: initiating } = useMutation({
    mutationFn: () =>
      fiatService.withdraw(
        {
          symbol: form.values.symbol,
          amount: form.values.amount,
          bankCode: form.values.bankCode,
          accountNumber: form.values.accountNumber,
          accountName: form.values.accountName,
        },
        totpCodeRef.current
      ),
    onSuccess: (res) => {
      const d = unwrap<FiatWithdrawalResponse>(res);
      const ref = d.reference || d.transactionReference || "";
      setReference(ref);

      const status = (d.status || "").toUpperCase();
      if (status.includes("PENDING_AUTHORIZATION") || status.includes("AUTH")) {
        // Monnify sent an authorization code — collect it before the payout settles.
        modals.open({
          children: (
            <AuthorizationModal
              reference={ref}
              pending={authorizing}
              onConfirm={(code) => authorize(code)}
              onClose={() => {
                modals.closeAll();
                setReference("");
              }}
            />
          ),
          ...DEFAULT_MODAL_SETTINGS,
        });
      } else {
        modals.closeAll();
        successNotification(d?.status || "Withdrawal initiated successfully.");
        queryClient.invalidateQueries({ queryKey: fiatKeys.history });
        push("/assets/overview");
      }
    },
    onError: (e) => errorMessageHandler(e as any),
  });

  const handleWithdrawal = () => {
    try {
      if (user?.twoFaEnabled) {
        modals.open({
          children: (
            <AuthenticatorVerificationModal
              email={user?.email ?? ""}
              intitiateWithdrawal={(otpCode, totpCode) => {
                totpCodeRef.current = totpCode;
                modals.closeAll();
                initiate();
              }}
              onFallback={() => {
                totpCodeRef.current = undefined;
                modals.closeAll();
                initiate();
              }}
            />
          ),
          ...DEFAULT_MODAL_SETTINGS,
        });
      } else {
        totpCodeRef.current = undefined;
        initiate();
      }
    } catch (e) {
      errorMessageHandler(e instanceof Error ? e : new Error(String(e)));
    }
  };

  return {
    banks,
    banksLoading,
    form,
    handleWithdrawal,
    withdrawalPending: initiating || authorizing,
    emailVerificationLoading: initiating,
    pendingWithdrawal: reference,
  };
};

// ─── Monnify authorization code modal (PENDING_AUTHORIZATION) ───────────────
function AuthorizationModal({
  reference,
  pending,
  onConfirm,
  onClose,
}: {
  reference: string;
  pending: boolean;
  onConfirm: (code: string) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");

  return (
    <div className="bg-[#12131A] border border-white/[0.08] w-full max-w-md rounded-3xl p-6 sm:p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden mx-auto">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold text-white/90 tracking-tight">Authorize Withdrawal</h4>
        <ModalClose className="cursor-pointer hover:bg-white/5 p-1 rounded-full transition-colors" onClick={onClose} />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">
            <span className="text-[#3B82F6]">Authorization</span> Code
          </h2>
          <p className="text-sm font-medium text-white/60 leading-relaxed">
            Monnify sent a confirmation code to your registered phone. Enter it to complete the payout.
          </p>
          {reference && (
            <span className="text-xs text-white/40 font-mono">Ref: {reference}</span>
          )}
        </div>
        <div className="flex flex-col gap-4 items-center mt-2">
          <span className="font-bold text-xs text-white/50 uppercase tracking-wider">Enter Code</span>
          <OtpInput digits={6} value={code} onChange={setCode} />
        </div>
      </div>

      <Button
        loading={pending}
        className="w-full h-[52px] rounded-xl text-sm font-bold"
        style={{
          backgroundColor: code.length === 6 ? "#3B82F6" : "rgba(255,255,255,0.1)",
          color: code.length === 6 ? "white" : "rgba(255,255,255,0.3)",
        }}
        onClick={() => code.length === 6 && onConfirm(code)}
        disabled={code.length !== 6 || pending}
      >
        Authorize Withdrawal
      </Button>
    </div>
  );
}