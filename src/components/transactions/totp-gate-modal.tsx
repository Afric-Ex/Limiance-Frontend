"use client";

import { useState, useEffect } from "react";
import { PinInput, Button } from "@mantine/core";
import { ModalClose } from "../icons/modal-close";
import { modals } from "@mantine/modals";

function TotpCountdown() {
  const [remaining, setRemaining] = useState(() => 30 - (Math.floor(Date.now() / 1000) % 30));

  useEffect(() => {
    const tick = () => setRemaining(30 - (Math.floor(Date.now() / 1000) % 30));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pct = (remaining / 30) * 100;
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="40" height="40" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle
          cx="16" cy="16" r={r} fill="none"
          stroke={remaining <= 5 ? "#ef4444" : "#4D77F0"}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
          style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.3s" }}
        />
        <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{remaining}s</text>
      </svg>
      <span className="text-xs text-white/40">Refreshes every 30s</span>
    </div>
  );
}

export const TotpGateModal = ({ onComplete }: { onComplete: (code: string) => void }) => {
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (code.length !== 6) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    onComplete(code);
  };

  return (
    <div className="bg-[#12131A] border border-white/[0.08] w-full max-w-md rounded-3xl p-6 sm:p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden mx-auto">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold text-white/90 tracking-tight">Security Verification</h4>
        <ModalClose className="cursor-pointer hover:bg-white/5 p-1 rounded-full transition-colors" onClick={modals.closeAll} />
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">
            <span className="text-[#3B82F6]">Authenticator</span> Code
          </h2>
          <p className="text-sm font-medium text-white/60 leading-relaxed">
            Open your authenticator app and enter the<br />6-digit code to confirm this withdrawal
          </p>
        </div>

        <TotpCountdown />

        <div className={shake ? "animate-shake" : ""}>
          <PinInput
            length={6}
            type="number"
            value={code}
            onChange={setCode}
            onComplete={(val) => { setCode(val); }}
            size="xl"
            classNames={{
              input: "!bg-[#1e1f26] !border-white/[0.04] !text-white !text-xl !font-bold focus:!border-[#3B82F6] focus:!bg-[#252730] !rounded-xl !w-12 !h-14",
            }}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={code.length !== 6}
          className="w-32 h-[44px] rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm disabled:bg-white/5 disabled:text-white/30 disabled:border-transparent data-[disabled]:opacity-100"
          style={{
            backgroundColor: code.length === 6 ? '#3B82F6' : undefined,
            color: code.length === 6 ? 'white' : undefined
          }}
        >
          <span className="font-bold">Proceed</span>
        </Button>
      </div>
    </div>
  );
};
