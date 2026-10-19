"use client";

import { WalletCard } from "@/src/components/assets/wallet-card";
import { MyWallet } from "@/src/components/assets/my-wallet";
import { RecentHistory } from "@/src/components/assets/recent-history";
import { AssetTrendChart } from "@/src/components/assets/asset-trend-chart";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AssetsOverviewSkeleton } from "@/src/components/skeletons/assets";

function OverviewInner() {
  return (
    <main className="flex flex-col gap-6 w-full animate-fade-in max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4">
      <WalletCard title="Total Assets" variant="dashboard" />

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-[1150px]:gap-4 items-start w-full">
        {/* Left Column: My Assets */}
        <div className="w-full min-w-0">
          <MyWallet />
        </div>

        {/* Right Column: Asset Trend + Recent History */}
        <div className="w-full min-w-0 flex flex-col gap-8 max-[1150px]:gap-4 animate-fade-up stagger-2">
          <AssetTrendChart />
          <RecentHistory />
        </div>
      </div>
    </main>
  );
}

export default function Overview() {
  return (
    <PageSuspense fallback={<AssetsOverviewSkeleton />}>
      <OverviewInner />
    </PageSuspense>
  );
}
