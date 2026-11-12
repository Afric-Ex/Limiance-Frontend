"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Loader } from "@mantine/core";
import { MdShield, MdCheckCircle, MdPermIdentity, MdVideocam, MdHourglassEmpty } from "react-icons/md";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { successNotification } from "@/src/lib/notification-handler";
import dynamic from "next/dynamic";

const SumsubWebSdk = dynamic(() => import("@sumsub/websdk-react"), {
  ssr: false,
  loading: () => <Loader size="sm" color="blue" />,
});
import { useUserStore } from "@/src/stores/user-store";
import { getKycAccessToken, isKycApproved } from "@/src/lib/normalize-kyc-status";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AccountKycSkeleton } from "@/src/components/skeletons/account";
import { AccountPageHeader } from "@/src/components/settings/account-page-header";
import { useTranslations } from "next-intl";

function KycPageInner() {
  const t = useTranslations("Kyc");
  const queryClient = useQueryClient();
  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const fetchUser = useUserStore((state) => state.fetchUser);

  const { data: statusData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: userKeys.kycStatus,
    queryFn: () => userService.getKycStatus(),
    select: (res) => res?.data,
  });

  const { mutate: startKyc, isPending: startingKyc } = useMutation({
    mutationFn: () => userService.startKycSession(),
    onSuccess: async (res) => {
      const token = getKycAccessToken(res as any);
      if (!token || typeof token !== "string") {
        errorMessageHandler(new Error(t("unableToStart")));
        return;
      }

      setActiveToken(token);
    },
    onError: (e) => {
      errorMessageHandler(e);
    }
  });

  const { mutate: startTier2Kyc, isPending: startingTier2 } = useMutation({
    mutationFn: () => userService.upgradeKyc(),
    onSuccess: async (res) => {
      const token = getKycAccessToken(res as any);
      if (!token || typeof token !== "string") {
        errorMessageHandler(new Error(t("unableToStartTier2")));
        return;
      }
      
      setActiveToken(token);
    },
    onError: (e) => {
      errorMessageHandler(e);
    }
  });

  const status = statusData?.status?.toLowerCase();
  const currentTier = statusData?.tier || (user?.kycStatus === 'approved' ? 1 : 0);
  const isPending = ["pending", "processing", "under_review"].includes(status);
  const isApproved = ["approved", "verified"].includes(status);
  const isRejected = ["rejected", "failed"].includes(status);
  const isNotStarted = !isPending && !isApproved && !isRejected;

  const searchParams = useSearchParams();
  const autoStartRef = useRef(false);

  useEffect(() => {
    const shouldStart = searchParams?.get("start") === "1" || searchParams?.get("start") === "true";
    if (mounted && shouldStart && !autoStartRef.current && (isNotStarted || isRejected) && !activeToken && !startingKyc) {
      autoStartRef.current = true;
      startKyc();
    }
  }, [mounted, searchParams, isNotStarted, isRejected, activeToken, startingKyc, startKyc]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (polling && pollCount < 20) {
      interval = setInterval(() => {
        refetch().then((res) => {
          const newStatus = res.data?.status;
          if (isKycApproved(newStatus)) {
            setPolling(false);
            successNotification(t("verificationApproved"));
            queryClient.invalidateQueries({ queryKey: userKeys.userDetails });
            fetchUser();
          }
        });
        setPollCount((c) => c + 1);
      }, 3000);
    } else if (pollCount >= 20) {
      setPolling(false);
    }
    return () => clearInterval(interval);
  }, [polling, pollCount, refetch, queryClient, fetchUser, t]);

  useEffect(() => {
    if (user && isApproved && !user.isIDverified) {
      setUser({ ...user, isIDverified: true, kycStatus: "approved" } as any);
    }
  }, [isApproved, setUser, user]);

  if (isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 pb-8 page-enter max-[1150px]:pb-[100px]">
        <AccountPageHeader
          title={t("pageTitle")}
          description={t("pageDescriptionLoading")}
          icon={<MdShield size={23} />}
          eyebrow={t("eyebrow")}
        />
        <div className="account-card flex min-h-56 items-center justify-center">
          <Loader color="blue" />
        </div>
      </main>
    );
  }

  const accessTokenExpirationHandler = async () => {
    try {
      const freshToken = getKycAccessToken((await userService.upgradeKyc()) as any);
      if (!freshToken || typeof freshToken !== "string") {
        throw new Error(t("unableToRefresh"));
      }
      setActiveToken(freshToken);
      return freshToken;
    } catch {
      setActiveToken(null);
      errorMessageHandler(
        new Error(t("sessionExpired"))
      );
      return "";
    }
  };

  const sumsubMessage = (type: string) => {
    if (type === "idCheck.onApplicantSubmitted") {
      setActiveToken(null);
      setPolling(true);
      setPollCount(0);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 5000);
    }
    if (type === "idCheck.onCancel") {
      setActiveToken(null);
      errorMessageHandler(new Error(t("verificationCancelled")));
    }
  };

  const sumsubError = (error: any) => {
    errorMessageHandler(new Error(error?.message || t("unknownError")));
  };

  if (!mounted) return <AccountKycSkeleton />;

  return (
    <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 pb-8 page-enter max-[1150px]:pb-[100px]">
      <AccountPageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        icon={<MdShield size={23} />}
        eyebrow={t("eyebrow")}
      />

      {showBanner && (
        <div className="p-3 bg-success-6/10 border border-success-6/30 rounded-lg text-success-6 text-sm text-center font-medium animate-fade-in">
          {t("documentsSubmitted")}
        </div>
      )}

      {activeToken && (
        <div className="w-full bg-white rounded-lg overflow-hidden p-4">
          <SumsubWebSdk
            accessToken={activeToken}
            expirationHandler={accessTokenExpirationHandler}
            config={{
              lang: "en",
            }}
            options={{ addViewportTag: false, adaptIframeHeight: true }}
            onMessage={sumsubMessage}
            onError={sumsubError}
          />
        </div>
      )}

      {!activeToken && (isNotStarted || isRejected) && (
        <div className="account-card relative flex flex-col items-center gap-8 overflow-hidden !p-6 text-center sm:!p-10">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <MdShield size={40} className="text-primary" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">{t("verifyYourIdentity")}</h1>
            <p className="text-sm text-white/60 max-w-md">
              {t("verifyYourIdentityDesc")}
            </p>
          </div>

          <div className="grid w-full max-w-3xl grid-cols-1 gap-5 text-left sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-white/90 uppercase tracking-wider">{t("benefits")}</span>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <MdCheckCircle className="text-success-6" size={18} /> {t("benefitHigherLimits")}
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <MdCheckCircle className="text-success-6" size={18} /> {t("benefitP2p")}
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <MdCheckCircle className="text-success-6" size={18} /> {t("benefitFullFeatures")}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-white/90 uppercase tracking-wider">{t("whatYouNeed")}</span>
              <div className="flex items-start gap-3 text-sm text-white/70">
                <MdPermIdentity className="text-primary mt-0.5" size={18} />
                <span>{t("needGovernmentId")}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-white/70">
                <MdVideocam className="text-primary mt-0.5" size={18} />
                <span>{t("needSelfie")}</span>
              </div>
            </div>
          </div>

          {isRejected && (
            <div className="p-3 w-full max-w-sm bg-error-1/10 border border-error-1/30 rounded-lg text-error-1 text-sm text-left">
              <span className="font-semibold">{t("verificationFailedLabel")}</span> {statusData?.reason || t("documentsNotVerified")}
            </div>
          )}

          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            <Button
              size="lg"
              className="w-full !bg-primary hover:!bg-primary/90"
              loading={startingKyc}
              onClick={() => startKyc()}
            >
              {t("startVerification")}
            </Button>
            <span className="text-xs text-white/40">{t("usuallyTakesMinutes")}</span>
          </div>
        </div>
      )}

      {!activeToken && isPending && (
        <div className="account-card flex flex-col items-center gap-8 !p-6 text-center sm:!p-10">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <MdHourglassEmpty size={40} className="text-yellow-500 animate-pulse" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">{t("verificationInProgress")}</h1>
            <p className="text-sm text-white/60 max-w-md">
              {t("verificationInProgressDesc")}
            </p>
            <p className="text-xs text-white/40 mt-2">
              {t("verificationInProgressNotice")}
            </p>
          </div>

          <Button
            variant="outline"
            className="!border-white/20 !text-white hover:!bg-white/5"
            loading={isRefetching || polling}
            onClick={() => refetch()}
          >
            {t("checkStatus")}
          </Button>
        </div>
      )}

      {!activeToken && isApproved && (
        <div className="flex flex-col gap-6">
          <div className="account-card flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-6 flex-col sm:flex-row">
              <div className="w-16 h-16 rounded-full bg-success-6/20 flex items-center justify-center">
                <MdCheckCircle size={32} className="text-success-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">{t("tierVerifiedTitle", { tier: currentTier })}</h1>
                <p className="text-sm text-white/60 max-w-md">
                  {t("identityVerified")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Tier 1 Limits */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-3">{t("tier1Limits")}</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">{t("dailyWithdrawalLimit")}</span>
                <span className="font-mono text-white/90">$50,000 USD</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">{t("fiatDeposits")}</span>
                <span className="font-mono text-white/90">{t("enabledLabel")}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">{t("p2pTrading")}</span>
                <span className="font-mono text-white/90">{t("enabledLabel")}</span>
              </div>
              {currentTier >= 2 && (
                <div className="mt-4 p-3 bg-success-6/15 text-success-6 text-sm text-center font-medium rounded-lg border border-success-6/30">
                  {t("upgradedPastTier1")}
                </div>
              )}
            </div>

            {/* Tier 2 Upgrade */}
            <div className={`p-6 border rounded-2xl flex flex-col gap-4 ${currentTier >= 2 ? 'bg-success-6/5 border-success-6/20' : 'bg-primary/5 border-primary/20'}`}>
              <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-3">{t("tier2Limits")}</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">{t("dailyWithdrawalLimit")}</span>
                <span className="font-mono text-white/90">$1,000,000 USD</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">{t("marginTrading")}</span>
                <span className="font-mono text-white/90">{t("enabledLabel")}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">{t("otcDeskAccess")}</span>
                <span className="font-mono text-white/90">{t("enabledLabel")}</span>
              </div>

              {currentTier === 1 && (
                <Button
                  className="w-full !mt-2 !bg-primary hover:!bg-primary/90"
                  loading={startingTier2}
                  onClick={() => startTier2Kyc()}
                >
                  {t("applyForTier2")}
                </Button>
              )}
              {currentTier >= 2 && (
                <div className="mt-4 p-3 bg-success-6/15 text-success-6 text-sm text-center font-medium rounded-lg border border-success-6/30">
                  <MdCheckCircle className="inline-block mr-2" /> {t("tier2Active")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function KycPage() {
  return (
    <PageSuspense fallback={<AccountKycSkeleton />}>
      <KycPageInner />
    </PageSuspense>
  );
}
