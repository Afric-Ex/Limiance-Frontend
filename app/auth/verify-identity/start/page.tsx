"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/src/services/auth";
import dynamic from "next/dynamic";

const SumsubWebSdk = dynamic(() => import("@sumsub/websdk-react"), {
  ssr: false,
});
import { getKycAccessToken } from "@/src/lib/normalize-kyc-status";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { VerifyIdentityStartPageSkeleton } from "@/src/components/skeletons/auth";
import { HeroDecorations } from "@/src/components/shared/hero-decorations";
import { AuthMobileBrand } from "@/src/components/shared/auth-mobile-brand";
import { useTranslations } from "next-intl";

function StartInner() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeToken, setActiveToken] = useState<string | null>(null);

  const handleStartKyc = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await auth.startKyc();
      const token = getKycAccessToken(res as any);
      if (!token || typeof token !== "string") {
        setError(t("unableToStartVerification"));
        setLoading(false);
        return;
      }
      setActiveToken(token);
      setLoading(false);
    } catch {
      setLoading(false);
      setError(t("couldNotStartVerification"));
    }
  };

  const accessTokenExpirationHandler = async () => {
    try {
      const res = await auth.startKyc();
      const freshToken = getKycAccessToken(res as any);
      if (!freshToken || typeof freshToken !== "string") {
        throw new Error(t("unableToRefreshVerification"));
      }
      setActiveToken(freshToken);
      return freshToken;
    } catch {
      setActiveToken(null);
      setError(t("verificationSessionExpired"));
      return "";
    }
  };

  const sumsubMessage = (type: string) => {
    if (type === "idCheck.onApplicantSubmitted") {
      router.push("/auth/verify-identity/pending");
    }
    if (type === "idCheck.onCancel") {
      setActiveToken(null);
      setError(t("verificationCancelled"));
    }
  };

  const sumsubError = (error: any) => {
    setError(error?.message || t("verificationFailed"));
    setActiveToken(null);
  };

  return (
    <main className="flex flex-col gap-12 min-h-hero pt-10 px-4 overflow-x-hidden relative bg-verifyIdentityBg bg-cover bg-no-repeat">
      <HeroDecorations />
      <div className="flex max-w-1199px w-11/12 mx-auto flex-col gap-8">
      <AuthMobileBrand className="mb-0" />
        <h1 className="pb-3 border-b border-b-white/25 text-3xl font-semibold">
          {t("identityVerification")}
        </h1>
        <h2 className="text-4xl max-[600px]:text-2xl font-bold">{t("verifyYourIdentity")}</h2>
      </div>
      <div className="flex items-center justify-center flex-1">
        {activeToken ? (
          <div className="w-full max-w-md bg-white rounded-lg overflow-hidden p-4">
            <SumsubWebSdk
              accessToken={activeToken}
              expirationHandler={accessTokenExpirationHandler}
              config={{ lang: "en" }}
              options={{ addViewportTag: false, adaptIframeHeight: true }}
              onMessage={sumsubMessage}
              onError={sumsubError}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 max-w-md w-full">
            <p className="text-center text-white/70">
              {t("sumsubDisclosure")}
            </p>
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <button
              onClick={handleStartKyc}
              disabled={loading}
              className="w-full py-3 px-6 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("starting") : t("startVerification")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Start() {
  return (
    <PageSuspense fallback={<VerifyIdentityStartPageSkeleton />}>
      <StartInner />
    </PageSuspense>
  );
}
