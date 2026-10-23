"use client";

import React from "react";
import { Modal, Button, PinInput } from "@mantine/core";
import { MdWarning } from "react-icons/md";

interface ReleaseCryptoModalProps {
  opened: boolean;
  onClose: () => void;
  quantity: number;
  asset: string;
  counterpartyName: string;
  fiatAmount: number;
  fiat: string;
  otpRequested: boolean;
  otpValue: string;
  setOtpValue: (val: string) => void;
  isRequestingCode: boolean;
  isReleasing: boolean;
  handleRequestOtp: () => void;
  handleRelease: () => void;
  showFinalConfirm: boolean;
  setShowFinalConfirm: (val: boolean) => void;
}

export function ReleaseCryptoModal({
  opened,
  onClose,
  quantity,
  asset,
  counterpartyName,
  fiatAmount,
  fiat,
  otpRequested,
  otpValue,
  setOtpValue,
  isRequestingCode,
  isReleasing,
  handleRequestOtp,
  handleRelease,
  showFinalConfirm,
  setShowFinalConfirm,
}: ReleaseCryptoModalProps) {
  const handleClose = () => {
    setShowFinalConfirm(false);
    onClose();
  };

  const onOtpComplete = () => {
    if (otpValue.length === 6) {
      setShowFinalConfirm(true);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Security Verification Required"
      centered
      classNames={{
        content: "!bg-[#181a20] !border !border-white/[0.08] !text-white !rounded-xl",
        header: "!bg-[#181a20] !border-b !border-white/[0.06] !text-white",
        title: "!text-white !font-semibold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
      }}
    >
      <div className="flex flex-col gap-4 pt-2">
        {!showFinalConfirm ? (
          <>
            <div className="text-white/60 text-xs leading-relaxed">
              To release{" "}
              <span className="text-white font-semibold font-mono">
                {quantity.toLocaleString()} {asset}
              </span>
              , enter the verification code sent to your registered email or phone.
            </div>

            {!otpRequested ? (
              <Button
                className="!bg-primary hover:!bg-primary/90 !text-white !font-semibold !h-10 !rounded-lg !text-xs mt-2"
                loading={isRequestingCode}
                onClick={handleRequestOtp}
              >
                Send Verification Code
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-4 py-2">
                <PinInput
                  length={6}
                  type="number"
                  value={otpValue}
                  onChange={setOtpValue}
                  onComplete={onOtpComplete}
                  classNames={{
                    input:
                      "!bg-white/[0.04] !border-white/[0.08] !text-white focus:!border-primary/50 !rounded-lg !w-10 !h-12 !text-base !font-mono text-center",
                  }}
                />
                <Button
                  className="w-full !bg-buy hover:!bg-buy/90 !text-white !font-semibold !h-10 !rounded-lg !text-xs mt-1"
                  disabled={otpValue.length < 6}
                  onClick={() => setShowFinalConfirm(true)}
                >
                  Verify Code
                </Button>
                <Button
                  variant="subtle"
                  className="w-full !text-primary hover:!bg-white/[0.04] !text-xs !h-9 !rounded-lg"
                  loading={isRequestingCode}
                  onClick={handleRequestOtp}
                >
                  Resend Code
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-[#F6465D]/10 border border-[#F6465D]/20 rounded-lg p-4 text-center">
              <div className="text-[#F6465D] font-semibold text-sm mb-2 flex items-center justify-center gap-1.5">
                <MdWarning size={16} />
                <span>Final Release Confirmation</span>
              </div>
              <div className="text-white/70 text-xs">
                You are about to release
                <span className="text-xl font-bold text-white font-mono my-1 block">
                  {quantity.toLocaleString()} {asset}
                </span>
                to <span className="text-white font-semibold">{counterpartyName}</span>
              </div>
              <div className="mt-3 text-white/50 text-[11px] text-left border-t border-white/[0.08] pt-2.5 space-y-1">
                <p className="font-medium text-white/70">Please acknowledge:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>You have verified receipt of {fiatAmount.toLocaleString()} {fiat} in your bank account.</li>
                  <li>Crypto releases cannot be reversed under any circumstance.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2.5 mt-2">
              <Button
                variant="subtle"
                className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-10 !rounded-lg !text-xs !font-semibold"
                onClick={() => setShowFinalConfirm(false)}
              >
                Back
              </Button>
              <Button
                className="flex-1 !bg-[#F6465D] hover:!bg-[#F6465D]/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
                loading={isReleasing}
                onClick={handleRelease}
              >
                Release Now
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
