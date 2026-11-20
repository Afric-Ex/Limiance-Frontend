"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MdVerifiedUser, MdOutlineArrowForward, MdOutlineLock } from "react-icons/md";
import { useUserStore } from "@/src/stores/user-store";
import { userKeys, userService } from "@/src/services/user";
import { isKycApproved } from "@/src/lib/normalize-kyc-status";
import { InlineLoading } from "./inline-loading";

interface KycRequiredGateProps {
  children: React.ReactNode;
  featureName?: string;
}

export function KycRequiredGate({
  children,
  featureName = "this section",
}: KycRequiredGateProps) {
  const router = useRouter();
  const { user, _hasHydrated } = useUserStore();

  const { data: kycStatus, isLoading } = useQuery({
    queryKey: userKeys.kycStatus,
    queryFn: () => userService.getKycStatus(),
    select: (res) => res?.data?.status,
    staleTime: 5 * 60_000,
    enabled: _hasHydrated,
  });

  const normalizedStatus = String(kycStatus ?? user?.kycStatus ?? "").toLowerCase();
  const isKycComplete = Boolean(
    user?.isIDverified ||
      user?.isVerified ||
      isKycApproved(normalizedStatus)
  );

  if (!_hasHydrated || (!isKycComplete && isLoading)) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
        <InlineLoading label="Checking verification status..." />
      </div>
    );
  }

  if (!isKycComplete) {
    const isPending = normalizedStatus === "pending";
    const isRejected = normalizedStatus === "rejected" || normalizedStatus === "failed";

    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#181a20] p-6 shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
            <MdOutlineLock size={24} />
          </div>

          <h2 className="text-center text-lg font-bold text-white">
            KYC Verification Required
          </h2>

          <p className="mt-2 text-center text-xs leading-relaxed text-white/60">
            {isPending
              ? `Your identity verification is currently under review. You will be able to access ${featureName} once your KYC is approved.`
              : isRejected
                ? `Your previous identity verification was ${normalizedStatus}. Please resubmit your KYC documents to access ${featureName}.`
                : `Please complete your identity verification (KYC) to access ${featureName}.`}
          </p>

          {normalizedStatus && (
            <div className="mt-4 flex justify-center">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                  isPending
                    ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                    : isRejected
                      ? "border-[#F6465D]/30 bg-[#F6465D]/10 text-[#F6465D]"
                      : "border-white/10 bg-white/[0.04] text-white/60"
                }`}
              >
                <MdVerifiedUser size={13} />
                Status: {normalizedStatus}
              </span>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/account/kyc")}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
            >
              <span>{isPending ? "View KYC Status" : "Complete KYC Verification"}</span>
              <MdOutlineArrowForward size={16} />
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex h-9 w-full items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
