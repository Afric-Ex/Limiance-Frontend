"use client";

import { useState } from "react";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { EarnLimSkeleton } from "@/src/components/skeletons/with-sidebar";
import { EarnHeader } from "@/src/components/earn/earn-header";
import { RewardNotificationBanner } from "@/src/components/earn/reward-notification-banner";
import { LimBalanceCard } from "@/src/components/earn/lim-balance-card";
import { WaysToEarn } from "@/src/components/earn/ways-to-earn";
import { MyRewards } from "@/src/components/earn/my-rewards";
import { LimUtility } from "@/src/components/earn/lim-utility";
import {
  EarnProducts,
  EARN_PRODUCTS,
} from "@/src/components/earn/earn-products";

/**
 * Earn — the single earn surface. Flow: balance first (headline + allocation
 * + buy/convert actions), then token utilities, then the featured "ways to
 * earn" teasers that jump into the full earn product suite, then the rewards
 * ledger. All products render honest preview cards until operations launches
 * them.
 */
function EarnInner() {
  const [selectedProduct, setSelectedProduct] = useState(EARN_PRODUCTS[0].name);

  const openProduct = (name: string) => {
    setSelectedProduct(name);
    requestAnimationFrame(() => {
      document
        .getElementById("earn-products")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <main className="flex flex-col gap-6 w-full page-enter">
      <EarnHeader />
      <RewardNotificationBanner />
      <LimBalanceCard />
      <LimUtility />
      <WaysToEarn onLearnMore={openProduct} />
      <EarnProducts
        activeProduct={selectedProduct}
        onProductChange={setSelectedProduct}
      />
      <MyRewards />
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
