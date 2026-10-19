"use client";

import { PageSuspense } from "@/src/components/shared/page-suspense";
import { EarnLimSkeleton } from "@/src/components/skeletons/with-sidebar";
import { EarnHeader } from "@/src/components/earn/earn-header";
import { RewardNotificationBanner } from "@/src/components/earn/reward-notification-banner";
import { LimBalanceCard } from "@/src/components/earn/lim-balance-card";
import { BuyLimCard } from "@/src/components/earn/buy-lim-card";
import { WaysToEarn } from "@/src/components/earn/ways-to-earn";
import { MyRewards } from "@/src/components/earn/my-rewards";
import { LimUtility } from "@/src/components/earn/lim-utility";
import { EarnProducts } from "@/src/components/earn/earn-products";

/**
 * Earn — the single earn surface. LIM balance and buy flow, live earning
 * campaigns, LIM rewards, and the upcoming earn product suite (all products
 * render "Coming Soon" until operations launches them).
 */
function EarnInner() {
  return (
    <main className="flex flex-col gap-6 w-full page-enter">
      <EarnHeader />
      <RewardNotificationBanner />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 flex flex-col gap-6">
          <LimBalanceCard />
          <WaysToEarn />
        </div>
        <div className="xl:col-span-2 flex flex-col gap-6">
          <BuyLimCard />
          <MyRewards />
          <LimUtility />
        </div>
      </div>

      <EarnProducts />
    </main>
  );
}

export default function Earn() {
  return (
    <PageSuspense fallback={<EarnLimSkeleton />}>
      <EarnInner />
    </PageSuspense>
  );
}
