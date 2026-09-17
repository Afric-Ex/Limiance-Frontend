import React, { useState } from "react";
import { ModalClose } from "../icons/modal-close";
import { Button } from "@mantine/core";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { modals } from "@mantine/modals";
import { AuthenticatorVerificationModal } from "./authenticator-verify-modal";
import { auth } from "@/src/services/auth";
import { useMutation } from "@tanstack/react-query";
import { OtpInput } from "@/src/components/settings/otp-input";

export const EmailVerificationModal = ({
  email,
  intitiateWithdrawal,
  totpCode,
}: {
  email: string;
  intitiateWithdrawal: (otpCode: string, totpCode?: string) => void;
  totpCode?: string;
}) => {
  const [otp, setOtp] = useState("");

  const { mutate: verifyOtp, isPending: verifyLoading } = useMutation({
    mutationFn: () => auth.verifyEmail({ email, otp }),
    onSuccess: () => {
      intitiateWithdrawal(otp, totpCode);
    },
  });

  return (
    <div className="bg-elevated border border-white/[0.08] w-full max-w-md rounded-3xl p-6 sm:p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden mx-auto">
      <div className="flex items-center justify-between relative z-10">
        <h4 className="text-lg font-bold text-white/90 tracking-tight">Security Verification</h4>
        <ModalClose className="cursor-pointer hover:bg-white/5 p-1 rounded-full transition-colors" onClick={modals.closeAll} />
      </div>

      <div className="flex flex-col w-full self-center gap-8 relative z-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">
              <span className="text-primary">Email</span> Verification
            </h2>
            <p className="text-sm font-medium text-white/60 leading-relaxed">
              A 6-digit verification code has just been sent to<br />your email address <span className="text-white font-semibold">{email}</span>
            </p>
          </div>
          <div className="flex flex-col gap-4 items-center w-full mt-4">
            <span className="font-bold text-xs text-white/50 uppercase tracking-wider">Enter Verification Code</span>
            <div className="w-full flex justify-center">
              <OtpInput
                digits={6}
                value={otp}
                onChange={setOtp}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 items-center w-full mt-2">
          <Button
            loading={verifyLoading}
            className="w-32 h-[44px] rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm disabled:bg-white/5 disabled:text-white/30 disabled:border-transparent data-[disabled]:opacity-100"
            style={{
              backgroundColor: otp.length === 6 ? 'var(--color-primary)' : undefined,
              color: otp.length === 6 ? 'white' : undefined
            }}
            onClick={() => verifyOtp()}
            disabled={otp.length !== 6}
          >
            <span className="font-bold">Verify</span>
          </Button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm text-white/40">Having issues using this method?</span>
            <span className="text-sm text-white/60">
              Try{" "}
              <span
                onClick={() =>
                  modals.open({
                    children: (
                      <AuthenticatorVerificationModal
                        email={email}
                        intitiateWithdrawal={intitiateWithdrawal}
                      />
                    ),
                    ...DEFAULT_MODAL_SETTINGS,
                  })
                }
                className="font-bold cursor-pointer text-primary hover:text-primary transition-colors"
              >
                Google Authenticator
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
