"use client";

import React, { useEffect, useState } from "react";
import { ModalClose } from "../icons/modal-close";
import { Button, PinInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { DEFAULT_MODAL_SETTINGS } from "@/src/utils/constants";
import { EmailVerificationModal } from "./email-verification-modal";

function TotpCountdown() {
  const [remaining, setRemaining] = useState(() => 30 - (Math.floor(Date.now() / 1000) % 30));

  useEffect(() => {
    const tick = () => setRemaining(30 - (Math.floor(Date.now() / 1000) % 30));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pct = (remaining / 30) * 100;
  const r = 12;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex items-center gap-2 text-white/40">
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
        <circle
          cx="14" cy="14" r={r} fill="none"
          stroke={remaining <= 5 ? "#ef4444" : "#4D77F0"}
          strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 14 14)"
          style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.3s" }}
        />
        <text x="14" y="18" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{remaining}</text>
      </svg>
      <span className="text-sm">Code refreshes in {remaining}s</span>
    </div>
  );
}

export const AuthenticatorVerificationModal = ({
  email,
  intitiateWithdrawal,
  onFallback,
}: {
  email: string;
  intitiateWithdrawal: (otpCode: string, totpCode?: string) => void;
  onFallback?: () => void;
}) => {
  const [code, setCode] = useState("");

  const handleVerify = () => {
    if (code.length !== 6) return;
    intitiateWithdrawal("", code);
    modals.closeAll();
  };

  const handleComplete = (value: string) => {
    setCode(value);
    if (value.length === 6) {
      intitiateWithdrawal("", value);
      modals.closeAll();
    }
  };

  return (
    <div className="bg-[#12131A] border border-white/[0.08] w-full max-w-md rounded-3xl p-6 sm:p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden mx-auto">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold text-white/90 tracking-tight">Security Verification</h4>
        <ModalClose className="cursor-pointer hover:bg-white/5 p-1 rounded-full transition-colors" onClick={modals.closeAll} />
      </div>
      <div className="flex flex-col w-full self-center gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">
              <span className="text-[#3B82F6]">Authenticator</span> Code
            </h2>
            <p className="text-sm font-medium text-white/60 leading-relaxed">
              Open your authenticator app and enter the<br />6-digit code to confirm this withdrawal
            </p>
          </div>

          <div className="flex justify-center">
            <TotpCountdown />
          </div>

          <div className="flex flex-col gap-4 items-center w-full mt-2">
            <span className="font-bold text-xs text-white/50 uppercase tracking-wider">Enter 6-digit Code</span>
            <div className="w-full flex justify-center">
              <PinInput
                length={6}
                type="number"
                value={code}
                onChange={setCode}
                onComplete={handleComplete}
                size="xl"
                classNames={{
                  input: "!bg-[#1e1f26] !border-white/[0.04] !text-white !text-xl !font-bold focus:!border-[#3B82F6] focus:!bg-[#252730] !rounded-xl !w-12 !h-14",
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 items-center w-full mt-2">
          <Button
            className="w-32 h-[44px] rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm disabled:bg-white/5 disabled:text-white/30 disabled:border-transparent data-[disabled]:opacity-100"
            style={{
              backgroundColor: code.length === 6 ? '#3B82F6' : undefined,
              color: code.length === 6 ? 'white' : undefined
            }}
            onClick={handleVerify}
            disabled={code.length !== 6}
          >
            <span className="font-bold">Verify</span>
          </Button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm text-white/40">Having issues using this method?</span>
            <span className="text-sm text-white/60">
              Try{" "}
              <span
                onClick={() => {
                  if (onFallback) {
                    onFallback();
                  } else {
                    modals.open({
                      children: (
                        <EmailVerificationModal
                          email={email}
                          intitiateWithdrawal={intitiateWithdrawal}
                        />
                      ),
                      ...DEFAULT_MODAL_SETTINGS,
                    });
                  }
                }}
                className="font-bold cursor-pointer text-[#3B82F6] hover:text-blue-400 transition-colors"
              >
                Email Verification
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
