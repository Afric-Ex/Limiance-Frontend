"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/src/services/auth";
import { isKycApproved } from "@/src/lib/normalize-kyc-status";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { VerifyIdentityPendingPageSkeleton } from "@/src/components/skeletons/auth";
import { HeroDecorations } from "@/src/components/shared/hero-decorations";
import { AuthMobileBrand } from "@/src/components/shared/auth-mobile-brand";
import { useTranslations } from "next-intl";

function VerifyIdentityPendingInner() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await auth.checkKycStatus();
        const status = res?.data?.status;
        if (isKycApproved(status)) {
          clearInterval(intervalRef.current!);
          router.push("/dashboard");
        } else if (status === "rejected" || status === "failed") {
          clearInterval(intervalRef.current!);
          router.push("/auth/verify-identity/start");
        }
      } catch {
        // keep polling on transient errors
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => clearInterval(intervalRef.current!);
  }, [router]);

  return (
    <main className="flex flex-col gap-12 min-h-hero pt-10 px-4 overflow-x-hidden relative bg-verifyIdentityBg bg-cover bg-no-repeat">
      <HeroDecorations />
      <div className="flex max-w-1199px w-11/12 mx-auto flex-col gap-8">
      <AuthMobileBrand className="mb-0" />
        <h1 className="pb-3 border-b border-b-white/25 text-3xl font-semibold">
          {t("identityVerification")}
        </h1>
        <h2 className="text-4xl max-[600px]:text-2xl font-bold">{t("verificationInProgress")}</h2>
      </div>
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col items-center gap-6 max-w-md w-full">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-center text-white/70">
            {t("identityBeingReviewed")}
          </p>
          <p className="text-center text-white/40 text-sm">
            {t("redirectWhenComplete")}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function VerifyIdentityPending() {
  return (
    <PageSuspense fallback={<VerifyIdentityPendingPageSkeleton />}>
      <VerifyIdentityPendingInner />
    </PageSuspense>
  );
}
