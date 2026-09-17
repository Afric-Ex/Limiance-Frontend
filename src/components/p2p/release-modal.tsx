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
    // TODO: call API to resend code
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
        content: "bg-gray-900 text-white",
        header: "bg-gray-900 text-white border-b border-white/10",
        title: "text-lg font-bold text-white",
        close: "text-white hover:bg-white/10"
      }}
    >
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        <div>
          <p className="text-white/80 text-sm mb-1">Enter the 6-digit code sent to your email/phone.</p>
          <p className="text-white/50 text-xs">This is required before releasing crypto.</p>
        </div>

        <PinInput 
          length={6} 
          value={code} 
          onChange={setCode} 
          size="lg"
          classNames={{
            input: "bg-black/40 border-white/10 text-white focus:border-primary",
          }}
        />

        <div className="text-sm">
          <span className="text-white/50">Didn&apos;t receive it? </span>
          {canResend ? (
            <button onClick={handleResend} className="text-blue-400 hover:text-blue-300 transition-colors">
              Resend Code
            </button>
          ) : (
            <span className="text-white/50">Resend in {countdown}s</span>
          )}
        </div>

        <div className="flex gap-3 w-full mt-2">
          <Button variant="light" color="gray" className="flex-1 bg-white/5 hover:bg-white/10 text-white" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={code.length !== 6}
            onClick={handleConfirm}
          >
            Verify Code
          </Button>
        </div>
      </div>
    </Modal>
  );
};
