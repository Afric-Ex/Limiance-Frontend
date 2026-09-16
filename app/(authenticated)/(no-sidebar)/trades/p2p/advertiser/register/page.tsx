"use client";

import React, { useState, useEffect } from "react";
import { P2PLayout } from "@/src/components/p2p/p2p-layout";
import { Button, Checkbox, Stepper } from "@mantine/core";
import { useRouter } from "next/navigation";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import { useAdvertiserInfo, useBecomeAdvertiser } from "@/src/hooks/p2p/use-p2p";
import { useUserStore } from "@/src/stores/user-store";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { P2PAdvertiserRegisterSkeleton } from "@/src/components/skeletons";

const USE_MOCK = true; // Set to false when ready to enforce real rules

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

  const { mutate: becomeAdvertiser, isPending: isRegistering } = useBecomeAdvertiser();
  const { user } = useUserStore();

  // Fetch real funding balance via WebSocket portfolio channel
  const { coins: portfolioCoins } = usePortfolioWs();

  const balanceArray = Array.isArray(portfolioCoins) ? portfolioCoins : [];
  const fundingBalance = balanceArray.reduce((acc: number, b: any) => 
    acc + parseFloat(b.fundingBalance || "0"), 0
  );

  // Evaluate requirements based on USE_MOCK toggle
  const requirements = USE_MOCK ? {
    kycLevel2: true,
    accountAge: true,
    fundingAccount: true
  } : {
    // Check if ID is verified in the user store
    kycLevel2: !!user?.isIDverified || !!user?.isVerified,
    // Account age check (assuming createdAt exists in backend, otherwise defaulting to true)
    accountAge: true, // TODO: Check user.createdAt > 30 days when available from backend
    // Check if they have any funds in their funding account
    fundingAccount: fundingBalance > 0
  };

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

  // If already an advertiser, jump to complete (or show different state)
  if (isAdvertiser && activeStep !== 2) {
    setActiveStep(2);
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
                    <span className="text-sm text-white/50">Complete identity verification.</span>
                  </div>
                  {requirements.kycLevel2 ? (
                    <MdCheckCircle className="text-buy" size={24} />
                  ) : (
                    <MdCancel className="text-[#F6465D]" size={24} />
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
                      <Button size="xs" color="blue" onClick={() => {}}>Set up</Button>
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
                  <p className="font-bold text-white mb-4">Limiance P2P Trading Rules & Agreement</p>
                  <p className="mb-4">1. You must use a payment method that matches your verified identity name.</p>
                  <p className="mb-4">2. Do not include crypto-related keywords in payment remarks.</p>
                  <p className="mb-4">3. Fraudulent behavior will result in permanent account bans.</p>
                  <p className="mb-4">4. You are responsible for verifying received funds before releasing crypto.</p>
                  <p className="mb-4">5. Limiance is not responsible for losses due to user error.</p>
                  {/* Simulate long text */}
                  <div className="h-40"></div>
                  <p className="mb-4 text-white">By clicking &quot;I Agree&quot;, you acknowledge that you have read and understood these terms.</p>
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
