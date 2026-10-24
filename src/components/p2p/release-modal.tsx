"use client";

import React, { useState, useEffect } from "react";
import { Modal, Button, PinInput } from "@mantine/core";

interface ReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeVerified: () => void;
}

export const ReleaseModal = ({ isOpen, onClose, onCodeVerified }: ReleaseModalProps) => {
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setCountdown(45);
      setCanResend(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, isOpen]);

  const handleResend = () => {
    setCountdown(45);
    setCanResend(false);
  };

  const handleConfirm = () => {
    if (code.length === 6) {
      onCodeVerified();
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Security Verification"
      centered
      classNames={{
        content: "!bg-[#181a20] !border !border-white/[0.08] !text-white !rounded-xl",
        header: "!bg-[#181a20] !border-b !border-white/[0.06] !text-white",
        title: "!text-white !font-semibold !text-base",
        close: "!text-white/40 hover:!text-white hover:!bg-white/[0.06]",
      }}
    >
      <div className="flex flex-col items-center gap-5 py-3 text-center">
        <div>
          <p className="text-white/80 text-xs mb-1">Enter the 6-digit code sent to your email or mobile device.</p>
          <p className="text-white/40 text-[11px]">This verification is required before releasing cryptocurrency from escrow.</p>
        </div>

        <PinInput
          length={6}
          value={code}
          onChange={setCode}
          size="md"
          classNames={{
            input:
              "!bg-white/[0.04] !border-white/[0.08] !text-white focus:!border-primary/50 !rounded-lg !w-10 !h-12 !text-base !font-mono",
          }}
        />

        <div className="text-xs">
          <span className="text-white/40">Didn&apos;t receive code? </span>
          {canResend ? (
            <button onClick={handleResend} className="text-primary hover:underline font-medium transition-colors">
              Resend Code
            </button>
          ) : (
            <span className="text-white/40 font-mono">Resend in {countdown}s</span>
          )}
        </div>

        <div className="flex gap-2.5 w-full mt-2">
          <Button
            variant="subtle"
            className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 !bg-primary hover:!bg-primary/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
            disabled={code.length !== 6}
            onClick={handleConfirm}
          >
            Verify &amp; Release
          </Button>
        </div>
      </div>
    </Modal>
  );
};
