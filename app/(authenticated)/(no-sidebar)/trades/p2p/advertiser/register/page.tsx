"use client";

import React, { useState, useEffect } from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { Button, Checkbox, Stepper } from "@mantine/core";
import { useRouter } from "next/navigation";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import { useAdvertiserInfo, useBecomeAdvertiser } from "@/src/hooks/p2p/use-p2p";
import { useUserStore } from "@/src/stores/user-store";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { isKycApproved } from "@/src/lib/normalize-kyc-status";
import { userKeys, userService } from "@/src/services/user";
import { useQuery } from "@tanstack/react-query";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PAdvertiserRegisterSkeleton } from "@/src/components/skeletons/p2p";

const MIN_ACCOUNT_AGE_DAYS = 30;

function getAccountAgeDays(raw: string | number | undefined | null): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const digits = String(raw).trim();
  const num = Number(digits);
  let ts: number;
  if (digits !== "" && Number.isFinite(num)) {
    ts = digits.length <= 10 ? num * 1000 : num;
  } else {
    ts = Date.parse(digits);
  }
  if (!Number.isFinite(ts) || ts <= 0) return null;
  const days = (Date.now() - ts) / 86_400_000;
  return days >= 0 ? days : null;
}

function AdvertiserRegisterPageInner() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: advertiserData, isLoading } = useAdvertiserInfo();
  const isAdvertiser = !!advertiserData?.data?.data?.id;

  useEffect(() => {
    if (isAdvertiser) setActiveStep(2);
  }, [isAdvertiser]);

  const { mutate: becomeAdvertiser, isPending: isRegistering } = useBecomeAdvertiser();
  const { user } = useUserStore();

  const { data: kycStatus } = useQuery({
    queryKey: userKeys.kycStatus,
    queryFn: () => userService.getKycStatus(),
    select: (res: any) => res?.data,
    staleTime: 60_000,
    retry: 1,
    throwOnError: false,
  });

  const { coins: portfolioCoins } = usePortfolioWs({ coins: true });

  const balanceArray = Array.isArray(portfolioCoins) ? portfolioCoins : [];
  const fundingBalance = balanceArray.reduce(
    (acc: number, b: any) => acc + parseFloat(b.fundingBalance || "0"),
    0
  );

  const kycLevel2 = kycStatus?.status
    ? isKycApproved(kycStatus.status)
    : !!user?.isIDverified || !!user?.isVerified;
  const accountAgeDays = getAccountAgeDays(user?.createdAt ?? user?.accountCreatedAt);
  const accountAge = accountAgeDays !== null && accountAgeDays >= MIN_ACCOUNT_AGE_DAYS;
  const fundingAccount = fundingBalance > 0;

  const requirements = { kycLevel2, accountAge, fundingAccount };
  const allRequirementsMet =
    requirements.kycLevel2 && requirements.accountAge && requirements.fundingAccount;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom =
      e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 10;
    if (bottom) setHasScrolledToBottom(true);
  };

  const handleSubmit = () => {
    becomeAdvertiser(undefined, {
      onSuccess: () => {
        setActiveStep(2);
      },
    });
  };

  if (!mounted)
    return (
      <P2PLayout>
        <P2PAdvertiserRegisterSkeleton />
      </P2PLayout>
    );

  if (isLoading) {
    return (
      <P2PLayout>
        <div className="flex justify-center items-center py-20 text-white/50 text-xs">
          Loading application requirements...
        </div>
      </P2PLayout>
    );
  }

  return (
    <P2PLayout>
      <div className="w-full max-w-3xl mx-auto py-6 max-[1150px]:py-4 page-enter">
        <h1 className="text-xl font-semibold text-white tracking-tight mb-5 text-center">
          P2P Advertiser Application
        </h1>

        <div className="bg-[#181a20] border border-white/[0.07] rounded-xl p-6">
          <Stepper
            active={activeStep}
            onStepClick={setActiveStep}
            allowNextStepsSelect={false}
            classNames={{
              stepIcon:
                "!bg-white/[0.04] !border-white/[0.1] !text-white data-[completed]:!bg-buy data-[completed]:!border-buy data-[active]:!border-primary",
              separator: "!bg-white/[0.08] data-[active]:!bg-primary",
              stepLabel: "!text-white/60 !font-medium !text-xs data-[active]:!text-white data-[completed]:!text-white",
            }}
          >
            <Stepper.Step label="Prerequisites">
              <div className="py-6 max-w-lg mx-auto flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-white mb-0.5">Eligibility Checklist</h2>
                  <p className="text-xs text-white/40">
                    Verify that your Limiance account meets all merchant criteria
                  </p>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                  <div className="flex flex-col">
                    <span className="font-medium text-white text-xs">KYC Level 2 Verification</span>
                    <span className="text-[11px] text-white/45 mt-0.5">
                      {requirements.kycLevel2
                        ? "Identity verified"
                        : kycStatus?.status === "pending"
                        ? "Verification is currently under review"
                        : "Complete identity verification to post ads."}
                    </span>
                  </div>
                  {requirements.kycLevel2 ? (
                    <MdCheckCircle className="text-buy shrink-0" size={20} />
                  ) : kycStatus?.status === "pending" ? (
                    <span className="text-[#FBA42A] text-xs font-semibold flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FBA42A] animate-pulse" />
                      Pending
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="xs"
                        className="!bg-primary hover:!bg-primary/90 !text-white !h-7 !text-xs !px-2.5 !rounded-md"
                        onClick={() => router.push("/account/kyc")}
                      >
                        Verify
                      </Button>
                      <MdCancel className="text-[#F6465D]" size={20} />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                  <div className="flex flex-col">
                    <span className="font-medium text-white text-xs">Account Age ≥ 30 Days</span>
                    <span className="text-[11px] text-white/45 mt-0.5">
                      Your account must be registered for at least 30 days.
                    </span>
                  </div>
                  {requirements.accountAge ? (
                    <MdCheckCircle className="text-buy shrink-0" size={20} />
                  ) : (
                    <MdCancel className="text-[#F6465D] shrink-0" size={20} />
                  )}
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                  <div className="flex flex-col">
                    <span className="font-medium text-white text-xs">Funding Account Balance</span>
                    <span className="text-[11px] text-white/45 mt-0.5">
                      You must hold active funds in your Funding Account.
                    </span>
                  </div>
                  {requirements.fundingAccount ? (
                    <MdCheckCircle className="text-buy shrink-0" size={20} />
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="xs"
                        className="!bg-primary hover:!bg-primary/90 !text-white !h-7 !text-xs !px-2.5 !rounded-md"
                        onClick={() => router.push("/assets/funding")}
                      >
                        Deposit
                      </Button>
                      <MdCancel className="text-[#F6465D]" size={20} />
                    </div>
                  )}
                </div>

                {!allRequirementsMet && (
                  <div className="text-[#F6465D] text-xs bg-[#F6465D]/10 p-3 rounded-lg border border-[#F6465D]/20 mt-1">
                    Please fulfill all criteria above to unlock advertiser registration.
                  </div>
                )}

                <Button
                  className="mt-2 !bg-primary hover:!bg-primary/90 !text-white !font-semibold !h-10 !rounded-lg !text-xs"
                  disabled={!allRequirementsMet}
                  onClick={() => setActiveStep(1)}
                >
                  Proceed to Agreement
                </Button>
              </div>
            </Stepper.Step>

            <Stepper.Step label="Agreement">
              <div className="py-6 max-w-2xl mx-auto flex flex-col gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-white mb-0.5">Advertiser Agreement</h2>
                  <p className="text-xs text-white/40">Read through the terms of service and maker regulations</p>
                </div>

                <div
                  className="bg-white/[0.02] border border-white/[0.07] rounded-lg p-5 h-64 overflow-y-auto text-xs text-white/70 leading-relaxed space-y-3"
                  onScroll={handleScroll}
                >
                  <p className="font-bold text-white text-sm">Limiance P2P Trading Rules &amp; Merchant Code</p>
                  <div>
                    <p className="font-semibold text-white/90 mb-1">1. Identity &amp; Bank Accounts</p>
                    <ul className="list-disc pl-4 space-y-1 text-white/65">
                      <li>Payment account names must strictly match your verified KYC legal name.</li>
                      <li>Third-party bank accounts or payment proxies are strictly prohibited.</li>
                      <li>You must maintain active KYC Level 2 verification throughout your advertiser tenure.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-white/90 mb-1">2. Escrow &amp; Release Guidelines</p>
                    <ul className="list-disc pl-4 space-y-1 text-white/65">
                      <li>Only release crypto once you have confirmed receipt of fiat in your actual bank account.</li>
                      <li>Never release cryptocurrency based on chat screenshots alone.</li>
                      <li>Do not request counterparties to transact outside the Limiance platform.</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-white/90 mb-1">3. Prohibited Market Conduct</p>
                    <ul className="list-disc pl-4 space-y-1 text-white/65">
                      <li>Self-matching orders, price manipulation, and fraudulent chargebacks result in immediate bans.</li>
                      <li>Limiance will mediate disputes using chat history and verified bank statements.</li>
                    </ul>
                  </div>

                  <p className="text-white/80 font-medium pt-2">
                    By checking the box below, you acknowledge full compliance with these policies.
                  </p>
                </div>

                <Checkbox
                  label="I have read, understood, and agree to the Limiance Advertiser Terms."
                  checked={agreed}
                  onChange={(e) => setAgreed(e.currentTarget.checked)}
                  disabled={!hasScrolledToBottom}
                  color="blue"
                  classNames={{ label: "!text-white/80 !text-xs" }}
                />

                <div className="flex gap-2.5 mt-2">
                  <Button
                    variant="subtle"
                    className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-10 !rounded-lg !text-xs !font-semibold"
                    onClick={() => setActiveStep(0)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 !bg-primary hover:!bg-primary/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
                    disabled={!agreed}
                    loading={isRegistering}
                    onClick={handleSubmit}
                  >
                    Submit Application
                  </Button>
                </div>
              </div>
            </Stepper.Step>

            <Stepper.Step label="Complete">
              <div className="py-12 max-w-md mx-auto flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 bg-buy/10 border border-buy/20 text-buy rounded-xl flex items-center justify-center">
                  <MdCheckCircle size={28} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Application Approved</h2>
                  <p className="text-white/60 text-xs max-w-sm leading-relaxed">
                    You are now a registered Limiance P2P Advertiser. You can create customized Buy and Sell listings
                    immediately.
                  </p>
                </div>

                <div className="flex w-full gap-2.5 mt-4">
                  <Button
                    variant="subtle"
                    className="flex-1 !bg-white/[0.06] hover:!bg-white/[0.1] !border !border-white/[0.08] !text-white !h-10 !rounded-lg !text-xs !font-semibold"
                    onClick={() => router.push("/trades/p2p/my-ads")}
                  >
                    Go to My Ads
                  </Button>
                  <Button
                    className="flex-1 !bg-primary hover:!bg-primary/90 !text-white !h-10 !rounded-lg !text-xs !font-semibold"
                    onClick={() => router.push("/trades/p2p/ads/create")}
                  >
                    Post an Ad
                  </Button>
                </div>
              </div>
            </Stepper.Step>
          </Stepper>
        </div>
      </div>
    </P2PLayout>
  );
}

export default function AdvertiserRegisterPage() {
  return (
    <PageSuspense fallback={<P2PAdvertiserRegisterSkeleton />}>
      <AdvertiserRegisterPageInner />
    </PageSuspense>
  );
}
