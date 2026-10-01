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
    ts = digits.length <= 10 ? num * 1000 : num; // Unix seconds vs milliseconds
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
  useEffect(() => { setMounted(true); }, []);

  // We check if they are already an advertiser. If so, they shouldn't need to register again.
  const { data: advertiserData, isLoading } = useAdvertiserInfo();
  const isAdvertiser = !!advertiserData?.data?.data?.id;

  useEffect(() => {
    if (isAdvertiser) setActiveStep(2);
  }, [isAdvertiser]);

  const { mutate: becomeAdvertiser, isPending: isRegistering } = useBecomeAdvertiser();
  const { user } = useUserStore();

  // Real KYC status from the backend (users/kyc_status) — the user-store flags
  // (isIDverified / isVerified) are unreliable because other pages set them
  // optimistically, so we only fall back to them if the endpoint has no data.
  const { data: kycStatus } = useQuery({
    queryKey: userKeys.kycStatus,
    queryFn: () => userService.getKycStatus(),
    select: (res: any) => res?.data,
    staleTime: 60_000,
    retry: 1,
    throwOnError: false,
  });

  // Fetch real funding balance via WebSocket portfolio channel
  const { coins: portfolioCoins } = usePortfolioWs({ coins: true });

  const balanceArray = Array.isArray(portfolioCoins) ? portfolioCoins : [];
  const fundingBalance = balanceArray.reduce((acc: number, b: any) =>
    acc + parseFloat(b.fundingBalance || "0"), 0
  );

  // Real requirement checks — no mock bypass
  const kycLevel2 =
    kycStatus?.status
      ? isKycApproved(kycStatus.status)
      : !!user?.isIDverified || !!user?.isVerified;
  const accountAgeDays = getAccountAgeDays(user?.createdAt ?? user?.accountCreatedAt);
  const accountAge = accountAgeDays !== null && accountAgeDays >= MIN_ACCOUNT_AGE_DAYS;
  const fundingAccount = fundingBalance > 0;

  const requirements = { kycLevel2, accountAge, fundingAccount };
  const allRequirementsMet = requirements.kycLevel2 && requirements.accountAge && requirements.fundingAccount;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 10;
    if (bottom) setHasScrolledToBottom(true);
  };

  const handleSubmit = () => {
    becomeAdvertiser(undefined, {
      onSuccess: () => {
        setActiveStep(2); // Move to complete step
      }
    });
  };

  if (!mounted) return (
    <P2PLayout>
      <P2PAdvertiserRegisterSkeleton />
    </P2PLayout>
  );

  if (isLoading) {
    return (
      <P2PLayout>
        <div className="flex justify-center items-center py-20 text-white/50">
          Loading...
        </div>
      </P2PLayout>
    );
  }

  return (
    <P2PLayout>
      <div className="w-full max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Advertiser Application</h1>

        <div className="bg-black/20 p-8 rounded-xl border border-white/5">
          <Stepper 
            active={activeStep} 
            onStepClick={setActiveStep} 
            allowNextStepsSelect={false}
            classNames={{
              stepIcon: "bg-white/10 border-white/20 text-white data-[completed]:bg-buy data-[completed]:border-buy",
              separator: "bg-white/10 data-[active]:bg-buy",
              stepLabel: "text-white/70 font-medium"
            }}
          >
            <Stepper.Step label="Requirements">
              <div className="py-8 max-w-lg mx-auto flex flex-col gap-6">
                <h2 className="text-xl font-bold text-white mb-2">Check Prerequisites</h2>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex flex-col">
                    <span className="font-medium text-white">KYC Level 2 Verification</span>
                    <span className="text-sm text-white/50">
                      {requirements.kycLevel2
                        ? "Identity verified"
                        : kycStatus?.status === "pending"
                        ? "Verification is pending review"
                        : "Complete identity verification."}
                    </span>
                  </div>
                  {requirements.kycLevel2 ? (
                    <MdCheckCircle className="text-buy" size={24} />
                  ) : kycStatus?.status === "pending" ? (
                    <span className="text-[#FBA42A] text-sm font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FBA42A] animate-pulse" />
                      Pending
                    </span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button size="xs" color="blue" onClick={() => router.push("/account/kyc")}>Verify</Button>
                      <MdCancel className="text-[#F6465D]" size={24} />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex flex-col">
                    <span className="font-medium text-white">Account Age &gt; 30 Days</span>
                    <span className="text-sm text-white/50">Your account must be at least 30 days old.</span>
                  </div>
                  {requirements.accountAge ? (
                    <MdCheckCircle className="text-buy" size={24} />
                  ) : (
                    <MdCancel className="text-[#F6465D]" size={24} />
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex flex-col">
                    <span className="font-medium text-white">Funding Account Setup</span>
                    <span className="text-sm text-white/50">You must have an active Funding Account.</span>
                  </div>
                  {requirements.fundingAccount ? (
                    <MdCheckCircle className="text-buy" size={24} />
                  ) : (
                    <div className="flex items-center gap-3">
                      <Button size="xs" color="blue" onClick={() => router.push("/assets/funding")}>Set up</Button>
                      <MdCancel className="text-[#F6465D]" size={24} />
                    </div>
                  )}
                </div>

                {!allRequirementsMet && (
                  <div className="text-[#F6465D] text-sm bg-[#F6465D]/10 p-4 rounded-lg border border-[#F6465D]/20 mt-2">
                    Please complete all requirements to proceed with your application.
                  </div>
                )}

                <Button 
                  size="lg" 
                  className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
                  disabled={!allRequirementsMet}
                  onClick={() => setActiveStep(1)}
                >
                  Next Step
                </Button>
              </div>
            </Stepper.Step>

            <Stepper.Step label="Agreement">
              <div className="py-8 max-w-2xl mx-auto flex flex-col gap-6">
                <h2 className="text-xl font-bold text-white mb-2">Advertiser Agreement</h2>
                
<div
                  className="bg-black/40 border border-white/10 rounded-lg p-6 h-64 overflow-y-auto text-sm text-white/70 leading-relaxed"
                  onScroll={handleScroll}
                >
                  <p className="font-bold text-white mb-4">Limiance P2P Trading Rules &amp; Agreement</p>
                  <p className="mb-2 font-semibold text-white/80">Identity &amp; Payment Accounts</p>
                  <ul className="list-disc pl-5 mb-4 flex flex-col gap-1.5">
                    <li>You must use a payment method whose registered name matches your verified identity.</li>
                    <li>All bank accounts and payment cards you link must belong to you. You may not use third-party accounts under any circumstance.</li>
                    <li>You must complete KYC Level 2 verification before posting ads, and maintain valid verification for the lifetime of your advertiser account.</li>
                  </ul>
                  <p className="mb-2 font-semibold text-white/80">Payment &amp; Release Rules</p>
                  <ul className="list-disc pl-5 mb-4 flex flex-col gap-1.5">
                    <li>Funds being sold must sit in your Funding Account before an ad is created or matched.</li>
                    <li>Do not include crypto-related keywords (e.g. wallet, BTC, USDT) in your bank payment remarks.</li>
                    <li>You are responsible for verifying that payment has actually been received before releasing crypto.</li>
                    <li>Only release crypto after confirming the exact amount, sender name, and payment reference match the order.</li>
                    <li>Do not ask buyers or sellers to confirm payment outside the Limiance chat system.</li>
                  </ul>
                  <p className="mb-2 font-semibold text-white/80">Prohibited Conduct</p>
                  <ul className="list-disc pl-5 mb-4 flex flex-col gap-1.5">
                    <li>Multiple accounts created to bypass limits or fees are prohibited.</li>
                    <li>Manipulating prices, self-matching, or placing ads you cannot fulfil is prohibited.</li>
                    <li>Fraudulent behaviour, chargebacks, or deliberate payment disputes will result in permanent account bans.</li>
                    <li>Do not share your login, API keys, or funds with other users.</li>
                  </ul>
                  <p className="mb-2 font-semibold text-white/80">Limits, Fees &amp; Liability</p>
                  <ul className="list-disc pl-5 mb-4 flex flex-col gap-1.5">
                    <li>Advertiser limits and P2P fees are set by Limiance and may change with notice.</li>
                    <li>Limiance is a matching and escrow platform; it is not a party to your payment transactions.</li>
                    <li>Limiance is not liable for losses caused by user error, off-platform payment, or third-party misuse.</li>
                    <li>Disputes are reviewed based on evidence provided in order chat; always keep proof of payment.</li>
                  </ul>
                  <p className="mb-2 font-semibold text-white/80">Enforcement</p>
                  <ul className="list-disc pl-5 mb-4 flex flex-col gap-1.5">
                    <li>Violations may lead to warnings, temporary suspension, or permanent revocation of advertiser status.</li>
                    <li>Limiance may withhold funds pending investigation of fraud or regulatory requirements.</li>
                  </ul>
                  <p className="mb-4 text-white">By clicking &quot;I Agree&quot;, you acknowledge that you have read, understood, and agreed to these terms.</p>
                </div>

                <Checkbox
                  label="I have read, understood, and agree to the Advertiser Agreement."
                  checked={agreed}
                  onChange={(e) => setAgreed(e.currentTarget.checked)}
                  disabled={!hasScrolledToBottom}
                  color="yellow"
                  classNames={{ label: "text-white/80" }}
                />

                <div className="flex gap-4 mt-4">
                  <Button variant="light" color="gray" className="flex-1 bg-white/5 hover:bg-white/10 text-white" onClick={() => setActiveStep(0)}>
                    Back
                  </Button>
                  <Button 
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
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
              <div className="py-16 max-w-lg mx-auto flex flex-col items-center text-center gap-6">
                <div className="w-24 h-24 bg-buy/20 text-buy rounded-full flex items-center justify-center text-5xl">
                  ✓
                </div>
                <h2 className="text-2xl font-bold text-white">Application Approved</h2>
                <p className="text-white/70">
                  Congratulations! You are now a Limiance P2P Advertiser. You can start posting your own ads immediately.
                </p>

                <div className="flex w-full gap-4 mt-6">
                  <Button variant="light" color="gray" className="flex-1 bg-white/5 hover:bg-white/10 text-white" onClick={() => router.push("/trades/p2p/my-ads")}>
                    Go to My Ads
                  </Button>
                  <Button className="flex-1 bg-buy hover:bg-buy/90 text-white font-semibold" onClick={() => router.push("/trades/p2p/ads/create")}>
                    Post Ad Now
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
