import React, { useState, useRef } from "react";
import { SelectedCoin, SelectedNetwork } from "./use-deposit";
import { mapSymbolToWalletChain, mapSymbolToWithdrawalChain } from "../utils/network-mapper";
import { useForm } from "@mantine/form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { assetKeys, asset } from "../services/asset";
import { useUserStore } from "../stores/user-store";
import { errorMessageHandler } from "../lib/error-handler";
import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "../utils/constants";

import { SuccessModal } from "../components/login/verify-email-success";
import { useRouter } from "next/navigation";
import { OtpInput } from "../components/settings/otp-input";
import { Button } from "@mantine/core";
import { ModalClose } from "../components/icons/modal-close";
import { AuthenticatorVerificationModal } from "../components/transactions/authenticator-verify-modal";

export const useWithdrawal = () => {
  const [selectedCoin, setSelectedCoin] = useState<SelectedCoin>({
    name: "",
    image: "",
    symbol: "",
    contractAddress: "",
  });
  const [selectedNetwork, setSelectedNetwork] = useState<SelectedNetwork>({
    name: "",
    symbol: "",
    blockchain: "",
  });
  const user = useUserStore((state) => state.user);
  const totpCodeRef = useRef<string | undefined>(undefined);
  const [walletType, setWalletType] = useState(0);
  const [sourceWallet, setSourceWallet] = useState<"funding" | "spot">("funding");
  const { push } = useRouter();

  const form = useForm({
    initialValues: {
      amount: "",
      address: "",
    },
  });

  const chainId = selectedNetwork?.symbol;
  const internalChainName = mapSymbolToWalletChain(chainId);
  const withdrawalChainName = mapSymbolToWithdrawalChain(chainId);

  const { data: allWallets, isLoading: allWalletsLoading } = useQuery({
    queryKey: assetKeys.allWallets(),
    queryFn: () => asset.allWallets({ limit: 100 }),
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []),
    staleTime: Infinity,
  });

  const existingWallet = internalChainName
    ? allWallets?.find(
        (wallet) =>
          wallet.chain.toLowerCase() === internalChainName.toLowerCase() &&
          wallet.address &&
          wallet.address.trim() !== ""
      )
    : undefined;

  const { data: generatedWallet, isLoading: generateWalletLoading } = useQuery({
    queryKey: assetKeys.generateWalletKeys(internalChainName, walletType),
    queryFn: () =>
      asset.generateWallet({
        chain: internalChainName,
        walletType,
        userid: user?.id as string,
      }),
    enabled:
      !!selectedCoin?.symbol &&
      !!internalChainName &&
      !existingWallet &&
      !!user?.id,
    retry: false,
    throwOnError: false,
  });

  const resolvedWalletId = existingWallet?.id ?? generatedWallet?.data?.id;
  const withdrawalWalletLoading =
    allWalletsLoading ||
    (!existingWallet && generateWalletLoading && !!internalChainName);

  // ─── Step 2: Confirm withdrawal with OTP or TOTP from backend ────────────
  const { mutate: confirmWithdrawal, isPending: confirmPending } = useMutation({
    mutationFn: ({ otpCode, totpCode }: { otpCode?: string; totpCode?: string }) =>
      asset.confirmWithdrawal({
        otpCode: otpCode || "",
        totpCode: totpCode || totpCodeRef.current,
      }),
    onSuccess: () => {
      modals.closeAll();
      modals.open({
        children: (
          <SuccessModal
            title="Congratulations"
            description={
              <div className="flex flex-col items-center gap-6">
                <p className="text-center text-2xl">
                  Your withdrawal is processing. You&apos;ll be credited soon
                </p>
                <div className="flex flex-col gap-3 items-center">
                  <span className="text-gray-14 font-semibold">
                    Amount to be received
                  </span>
                  <span className="flex items-center gap-1">
                    <img
                      src={selectedCoin?.image}
                      alt={selectedCoin?.symbol}
                      width={16}
                      height={16}
                    />
                    <span className="text-primary font-medium">
                      {withdrawableAmountAfterNetworkFee}
                    </span>
                    <span className="font-bold text-gray-14">
                      {selectedCoin?.symbol}
                    </span>
                  </span>
                </div>
              </div>
            }
            onProceed={() => {
              modals.closeAll();
              push("/assets/overview");
            }}
            onClose={() => {
              modals.closeAll();
              push("/assets/overview");
            }}
          />
        ),
        ...DEFAULT_MODAL_SETTINGS,
      });
    },
    onError(e) {
      console.error("[DEBUG] CONFIRM WITHDRAWAL ERROR:", e);
      errorMessageHandler(e);
    },
  });

  // ─── Step 1: Initiate withdrawal ────────────────────────────────────────
  const { mutate: initiateWithdrawal, isPending: initiatePending } = useMutation({
    mutationFn: () =>
      asset.initiateWithdrawal({
        chain: withdrawalChainName,
        destinationAddress: form.values.address,
        amount: `${form.values.amount}`,
        asset: selectedCoin?.symbol,
        sourceWallet,
        walletId: resolvedWalletId,
        tokenAddress: selectedCoin?.contractAddress,
        idempotencyKey:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        totpCode: totpCodeRef.current,
      }),
    onSuccess: () => {
      // Initiation succeeded → backend sends an email OTP.
      // We must show the email OTP modal for ALL users, because confirm_withdrawal requires `otpCode` in the body.
      // If the user has 2FA, we also pass the TOTP in the X-2FA-Code header.
      modals.open({
        children: (
          <WithdrawalOtpModal
            email={user?.email ?? ""}
            onConfirm={(otpCode) =>
              confirmWithdrawal({ otpCode, totpCode: totpCodeRef.current })
            }
            isPending={confirmPending}
          />
        ),
        ...DEFAULT_MODAL_SETTINGS,
      });
    },
    onError(e) {
      console.error("[DEBUG] INITIATE WITHDRAWAL ERROR:", e);
      errorMessageHandler(e);
    },
  });

  const isPending = initiatePending || confirmPending;

  const handleWithdrawal = () => {
    try {
      if (!resolvedWalletId) {
        errorMessageHandler(new Error("Withdrawal wallet is still being prepared. Please try again in a moment."));
        return;
      }

      if (user?.twoFaEnabled) {
        // Show Authenticator modal first — TOTP required in X-2FA-Code header on initiate_withdrawal
        modals.open({
          children: (
            <AuthenticatorVerificationModal
              email={user?.email ?? ""}
              intitiateWithdrawal={(_otpCode, totpCode) => {
                totpCodeRef.current = totpCode;
                modals.closeAll();
                initiateWithdrawal();
              }}
              onFallback={() => {
                // User can't access authenticator — skip 2FA and try without it
                totpCodeRef.current = undefined;
                modals.closeAll();
                initiateWithdrawal();
              }}
            />
          ),
          ...DEFAULT_MODAL_SETTINGS,
        });
      } else {
        totpCodeRef.current = undefined;
        initiateWithdrawal();
      }
    } catch (e) {
      errorMessageHandler(e instanceof Error ? e : new Error(String(e)));
    }
  };

  // mock until Ayo ships the fee endpoint
  const { data: networkFeeData, isLoading: networkFeeLoading } = useQuery({
    queryKey: ["network-fee", chainId, selectedCoin?.symbol],
    queryFn: () =>
      asset.networkFee({ chain: chainId, token: selectedCoin?.symbol }),
    enabled: !!chainId && !!selectedCoin?.symbol,
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []),
  });

  const { data: minWithdrawData, isLoading: minWithdrawLoading } = useQuery({
    queryKey: ["minimum-withdrawal", selectedCoin?.symbol, chainId],
    queryFn: () =>
      asset.minimumWithdrawal({ token: selectedCoin?.symbol, chain: chainId }),
    enabled: !!selectedCoin?.symbol && !!chainId,
    select: (res: any) => Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []),
  });

  const networkFee = networkFeeData?.fee ? +networkFeeData.fee : 0;
  const minimumWithdrawal = minWithdrawData?.minimum ? +minWithdrawData.minimum : 0;
  const withdrawableAmountAfterNetworkFee = +(form.values.amount || 0) - networkFee;

  return {
    withdrawableAmountAfterNetworkFee,
    networkFee,
    networkFeeLoading,
    minimumWithdrawal,
    minWithdrawLoading,
    selectedCoin,
    selectedNetwork,
    setSelectedNetwork,
    setSelectedCoin,
    form,
    setWalletType,
    walletType,
    handleWithdrawal,
    withdrawalPending: isPending,
    emailVerificationLoading: initiatePending,
    sourceWallet,
    setSourceWallet,
    withdrawalWalletLoading,
    resolvedWalletId,
  };
};

// ─── OTP Modal (shown after initiate_withdrawal succeeds) ──────────────────
function WithdrawalOtpModal({
  email,
  onConfirm,
  isPending,
}: {
  email: string;
  onConfirm: (otpCode?: string, totpCode?: string) => void;
  isPending: boolean;
}) {
  const [otp, setOtp] = useState("");

  return (
    <div className="bg-[#12131A] border border-white/[0.08] w-full max-w-md rounded-3xl p-6 sm:p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden mx-auto">
      <div className="flex items-center justify-between relative z-10">
        <h4 className="text-lg font-bold text-white/90 tracking-tight">Confirm Withdrawal</h4>
        <ModalClose className="cursor-pointer hover:bg-white/5 p-1 rounded-full transition-colors" onClick={modals.closeAll} />
      </div>

      <div className="flex flex-col w-full self-center gap-8 relative z-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">
              <span className="text-[#3B82F6]">OTP</span> Verification
            </h2>
            <p className="text-sm font-medium text-white/60 leading-relaxed">
              A 6-digit verification code has been sent to<br />
              <span className="text-white font-semibold">{email}</span>
            </p>
          </div>
          <div className="flex flex-col gap-4 items-center w-full mt-4">
            <span className="font-bold text-xs text-white/50 uppercase tracking-wider">Enter Verification Code</span>
            <div className="w-full flex justify-center">
              <OtpInput digits={6} value={otp} onChange={setOtp} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center w-full mt-2">
          <Button
            loading={isPending}
            className="w-40 h-[44px] rounded-xl text-sm font-bold"
            style={{
              backgroundColor: otp.length === 6 ? "#3B82F6" : "rgba(255,255,255,0.1)",
              color: otp.length === 6 ? "white" : "rgba(255,255,255,0.3)",
            }}
            onClick={() => otp.length === 6 && onConfirm(otp, undefined)}
            disabled={otp.length !== 6 || isPending}
          >
            Confirm Withdrawal
          </Button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-white/30 text-center">
              The code expires in 10 minutes. Check your spam folder if you don&apos;t see it.
            </span>
            <span className="text-xs text-white/50 mt-2">
              Having issues using this method? Try{" "}
              <span
                onClick={() =>
                  modals.open({
                    children: (
                      <AuthenticatorVerificationModal
                        email={email}
                        intitiateWithdrawal={(otpCode, totpCode) => onConfirm(otpCode, totpCode)}
                      />
                    ),
                    ...DEFAULT_MODAL_SETTINGS,
                  })
                }
                className="font-bold cursor-pointer text-[#3B82F6] hover:text-blue-400 transition-colors"
              >
                Google Authenticator
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
