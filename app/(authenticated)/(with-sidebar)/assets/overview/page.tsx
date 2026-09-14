"use client";

import { WalletCard } from "@/src/components/assets/wallet-card";
import { MyWallet } from "@/src/components/assets/my-wallet";
import { RecentHistory } from "@/src/components/assets/recent-history";
import { AssetTrendChart } from "@/src/components/assets/asset-trend-chart";

function Overview() {
  return (
    <main className="flex flex-col gap-6 w-full animate-fade-in max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4">
      <WalletCard />

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-[1150px]:gap-4 items-start w-full">
        {/* Left Column: My Assets */}
        <div className="w-full">
          <MyWallet />
        </div>

        {/* Right Column: Asset Trend + Recent History */}
        <div className="w-full flex flex-col gap-8 max-[1150px]:gap-4 animate-fade-up stagger-2">
          <AssetTrendChart />
          <RecentHistory />
        </div>
      </div>
    </main>
  );
}

export default Overview;
