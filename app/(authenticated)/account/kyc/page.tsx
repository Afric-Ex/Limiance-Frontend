"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { useState, useEffect } from "react";
import { Button, Loader } from "@mantine/core";
import { MdShield, MdCheckCircle, MdPermIdentity, MdVideocam, MdHourglassEmpty } from "react-icons/md";
import { errorMessageHandler } from "@/src/lib/error-handler";
import { successNotification } from "@/src/lib/notification-handler";
import SumsubWebSdk from "@sumsub/websdk-react";
import { useUserStore } from "@/src/stores/user-store";
import { getKycAccessToken, isKycApproved } from "@/src/lib/normalize-kyc-status";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AccountKycSkeleton } from "@/src/components/skeletons";

function KycPageInner() {
  const queryClient = useQueryClient();
  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
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
        errorMessageHandler(new Error("Unable to start verification. Please try again."));
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
        errorMessageHandler(new Error("Unable to start Tier 2 verification. Please try again."));
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (polling && pollCount < 20) {
      interval = setInterval(() => {
        refetch().then((res) => {
          const newStatus = res.data?.status;
          if (isKycApproved(newStatus)) {
            setPolling(false);
            successNotification("Identity verification approved!");
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
  }, [polling, pollCount, refetch, queryClient, fetchUser]);

  useEffect(() => {
    if (user && isApproved && !user.isIDverified) {
      setUser({ ...user, isIDverified: true, kycStatus: "approved" } as any);
    }
  }, [isApproved, setUser, user]);

  if (isLoading) {
    return (
      <main className="flex justify-center py-20">
        <Loader color="blue" />
      </main>
    );
  }

  const accessTokenExpirationHandler = () => {
    return Promise.resolve(activeToken || "");
  };

  const sumsubMessage = (type: string, payload: any) => {
    console.log("Sumsub message:", type, payload);
    if (type === "idCheck.onApplicantSubmitted") {
      setActiveToken(null);
      setPolling(true);
      setPollCount(0);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 5000);
    }
    if (type === "idCheck.onCancel") {
      setActiveToken(null);
      errorMessageHandler(new Error("Verification cancelled"));
    }
  };

  const sumsubError = (error: any) => {
    console.error("Sumsub error:", error);
    errorMessageHandler(new Error(error?.message || "An unknown error occurred"));
  };

  return (
    <main className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {showBanner && (
        <div className="p-3 bg-success-6/10 border border-success-6/30 rounded-lg text-success-6 text-sm text-center font-medium animate-fade-in">
          Documents submitted successfully. We&apos;re processing your verification now.
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
        <div className="p-10 bg-primary/10 border border-primary/25 rounded-2xl backdrop-blur-8px flex flex-col items-center text-center gap-8">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <MdShield size={40} className="text-primary" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Verify Your Identity</h1>
            <p className="text-sm text-white/60 max-w-md">
              Complete identity verification to unlock full trading features, higher withdrawal limits, and P2P trading access.
            </p>
          </div>

          <div className="flex flex-col gap-6 w-full max-w-sm text-left">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-white/90 uppercase tracking-wider">Benefits</span>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <MdCheckCircle className="text-success-6" size={18} /> Increased withdrawal limits
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <MdCheckCircle className="text-success-6" size={18} /> Access to P2P trading
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70">
                <MdCheckCircle className="text-success-6" size={18} /> Full account features
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-white/90 uppercase tracking-wider">What you&apos;ll need</span>
              <div className="flex items-start gap-3 text-sm text-white/70">
                <MdPermIdentity className="text-primary mt-0.5" size={18} />
                <span>A valid government-issued ID (passport, national ID, or driver&apos;s licence)</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-white/70">
                <MdVideocam className="text-primary mt-0.5" size={18} />
                <span>A selfie or short video for liveness verification</span>
              </div>
            </div>
          </div>

          {isRejected && (
            <div className="p-3 w-full max-w-sm bg-error-1/10 border border-error-1/30 rounded-lg text-error-1 text-sm text-left">
              <span className="font-semibold">Verification Failed:</span> {statusData?.reason || "Your documents could not be verified. Please try again."}
            </div>
          )}

          <div className="flex flex-col items-center gap-3 w-full max-w-sm">
            <Button
              size="lg"
              className="w-full !bg-primary hover:!bg-primary/90"
              loading={startingKyc}
              onClick={() => startKyc()}
            >
              Start Verification
            </Button>
            <span className="text-xs text-white/40">Usually takes 2–5 minutes</span>
          </div>
        </div>
      )}

      {!activeToken && isPending && (
        <div className="p-10 bg-primary/10 border border-primary/25 rounded-2xl backdrop-blur-8px flex flex-col items-center text-center gap-8">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <MdHourglassEmpty size={40} className="text-yellow-500 animate-pulse" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Verification In Progress</h1>
            <p className="text-sm text-white/60 max-w-md">
              Your documents are being reviewed. This usually takes a few minutes, but may take up to 24 hours in some cases.
            </p>
            <p className="text-xs text-white/40 mt-2">
              You&apos;ll be notified once verification is complete. You can safely leave this page.
            </p>
          </div>

          <Button
            variant="outline"
            className="!border-white/20 !text-white hover:!bg-white/5"
            loading={isRefetching || polling}
            onClick={() => refetch()}
          >
            Check Status
          </Button>
        </div>
      )}

      {!activeToken && isApproved && (
        <div className="flex flex-col gap-6">
          <div className="p-8 bg-primary/10 border border-primary/25 rounded-20px flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-6">
            <div className="flex items-center gap-6 flex-col sm:flex-row">
              <div className="w-16 h-16 rounded-full bg-success-6/20 flex items-center justify-center">
                <MdCheckCircle size={32} className="text-success-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">Tier {currentTier}: Identity Verified</h1>
                <p className="text-sm text-white/60 max-w-md">
                  Your identity has been successfully verified.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tier 1 Limits */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-3">Tier 1 Limits</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Daily Withdrawal Limit</span>
                <span className="font-mono text-white/90">$50,000 USD</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Fiat Deposits</span>
                <span className="font-mono text-white/90">Enabled</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">P2P Trading</span>
                <span className="font-mono text-white/90">Enabled</span>
              </div>
              {currentTier >= 2 && (
                <div className="mt-4 p-3 bg-success-6/15 text-success-6 text-sm text-center font-medium rounded-lg border border-success-6/30">
                  You have upgraded past Tier 1.
                </div>
              )}
            </div>

            {/* Tier 2 Upgrade */}
            <div className={`p-6 border rounded-2xl flex flex-col gap-4 ${currentTier >= 2 ? 'bg-success-6/5 border-success-6/20' : 'bg-primary/5 border-primary/20'}`}>
              <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-3">Tier 2 Limits (Pro)</h3>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Daily Withdrawal Limit</span>
                <span className="font-mono text-white/90">$1,000,000 USD</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Margin Trading</span>
                <span className="font-mono text-white/90">Enabled</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">OTC Desk Access</span>
                <span className="font-mono text-white/90">Enabled</span>
              </div>
              
              {currentTier === 1 && (
                <Button
                  className="w-full !mt-2 !bg-primary hover:!bg-primary/90"
                  loading={startingTier2}
                  onClick={() => startTier2Kyc()}
                >
                  Apply for Tier 2 (Proof of Address)
                </Button>
              )}
              {currentTier >= 2 && (
                <div className="mt-4 p-3 bg-success-6/15 text-success-6 text-sm text-center font-medium rounded-lg border border-success-6/30">
                  <MdCheckCircle className="inline-block mr-2" /> Tier 2 Active
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
