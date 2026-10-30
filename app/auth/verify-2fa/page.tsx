"use client";

import { useAuth } from "@/src/hooks/queries/use-auth";
import { PinInput, Loader } from "@mantine/core";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { Verify2FAPageSkeleton } from "@/src/components/skeletons/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroDecorations } from "@/src/components/shared/hero-decorations";
import { AuthMobileBrand } from "@/src/components/shared/auth-mobile-brand";

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
          stroke={remaining <= 5 ? "var(--color-warning-base)" : "var(--color-primary)"}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
          style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.3s" }}
        />
        <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{remaining}s</text>
      </svg>
      <span className="text-xs text-white/40">Code expires shortly</span>
    </div>
  );
}

function Verify2FAPageInner() {
  const { push } = useRouter();
  const {
    emailOrPhone,
    pending2FAUserId,
    pending2FAChallengeToken,
    pending2FAMethod,
    pending2FARememberMe,
    clearPendingLogin2FA,
    verifyLogin2FA,
    verifyLogin2FALoading,
  } = useAuth();
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);
  const [authStoreHydrated, setAuthStoreHydrated] = useState(false);
  const loginChallengeToken = pending2FAChallengeToken ?? pending2FAUserId ?? "";
  const isTotp = pending2FAMethod === "totp";
  const verificationPayload = (value: string) => ({
    loginChallengeToken,
    rememberMe: pending2FARememberMe,
    ...(isTotp ? { totpCode: value } : { emailOtpCode: value }),
  });

  useEffect(() => {
    // Auth challenge state is memory-only; there is no browser hydration step.
    setAuthStoreHydrated(true);
  }, []);

  // Decide whether this route was opened with an active in-memory challenge.
  useEffect(() => {
    if (authStoreHydrated && !pending2FAUserId) push("/auth/login");
  }, [authStoreHydrated, pending2FAUserId, push]);

  useEffect(() => {
    setCode("");
  }, [pending2FAMethod]);

  const handleComplete = (value: string) => {
    setCode(value);
    if (value.length === 6 && loginChallengeToken) {
      verifyLogin2FA(
        verificationPayload(value),
        {
          onError: () => {
            setShake(true);
            setCode("");
            setTimeout(() => setShake(false), 600);
          },
        }
      );
    }
  };

  return (
    <main className="flex items-center justify-center px-4 min-h-hero relative bg-landing bg-cover bg-no-repeat max-[1150px]:bg-none max-[1150px]:bg-black page-enter animate-fade-in">
      <HeroDecorations />
      <div className="flex flex-col items-center gap-8 max-w-sm w-full">
        
        <AuthMobileBrand className="mb-4" />

        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-3xl font-bold">{isTotp ? "Authenticator Verification" : "Email Verification"}</h2>
          <p className="text-sm text-white/55">
            {isTotp
              ? "Enter the 6-digit code from your authenticator app"
              : `Enter the 6-digit code sent to ${emailOrPhone || "your email"}`}
          </p>
        </div>

        {isTotp && <TotpCountdown />}

        <div className={shake ? "animate-shake" : ""}>
          <PinInput
            length={6}
            type="number"
            value={code}
            onChange={setCode}
            onComplete={handleComplete}
            size="xl"
            classNames={{
              input: "!bg-gray-1 !border-gray-9/40 !text-white !text-xl !font-bold focus:!border-primary !w-12 !h-14 !rounded-xl",
            }}
          />
        </div>

        <button
          onClick={() =>
            code.length === 6 && loginChallengeToken &&
            verifyLogin2FA(verificationPayload(code))
          }
          disabled={verifyLogin2FALoading || code.length !== 6 || !loginChallengeToken}
          className="w-full h-[52px] bg-primary rounded-xl text-base font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors hover:bg-primary/90"
        >
          {verifyLogin2FALoading && <Loader size="xs" color="white" />}
          Verify
        </button>

        <button
          onClick={() => {
            clearPendingLogin2FA();
            push("/auth/login");
          }}
          className="text-sm text-white/40 hover:text-white/70"
        >
          Back to login
        </button>
      </div>
    </main>
  );
}

export default function Verify2FAPage() {
  return (
    <PageSuspense fallback={<Verify2FAPageSkeleton />}>
      <Verify2FAPageInner />
    </PageSuspense>
  );
}
