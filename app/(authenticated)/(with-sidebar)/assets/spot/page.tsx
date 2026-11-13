import { WalletCard } from '@/src/components/assets/wallet-card';
import { SpotTable } from '@/src/components/assets/spot-table';
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AssetsSpotSkeleton } from "@/src/components/skeletons/assets";
import { ScreenShare } from "@/src/components/snapshot/screen-share";

function SpotInner() {
  return (
    <main className="flex flex-col gap-8 w-full max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4">
      <ScreenShare
        titleKey="walletSpot"
        filenameParts={["spot"]}
        contentClassName="flex flex-col gap-8 max-[1150px]:gap-4"
      >
        <WalletCard title="Spot" variant="dashboard" />

        <SpotTable />
      </ScreenShare>
    </main>
  );
}

export default function Spot() {
  return (
    <PageSuspense fallback={<AssetsSpotSkeleton />}>
      <SpotInner />
    </PageSuspense>
  );
}
