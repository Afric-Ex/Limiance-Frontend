"use client";

import { PageSuspense } from "@/src/components/shared/page-suspense";
import { BuyLimSkeleton } from "@/src/components/skeletons/with-sidebar";
import { BuyLimFlow } from "@/src/components/earn/buy/buy-lim-flow";

export default function BuyLimPage() {
  return (
    <PageSuspense fallback={<BuyLimSkeleton />}>
      <div className="flex w-full flex-col page-enter">
        <BuyLimFlow />
      </div>
    </PageSuspense>
  );
}
