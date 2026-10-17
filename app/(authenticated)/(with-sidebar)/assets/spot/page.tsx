import { WalletCard } from '@/src/components/assets/wallet-card';
import { SpotTable } from '@/src/components/assets/spot-table';
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AssetsSpotSkeleton } from "@/src/components/skeletons/assets";

function SpotInner() {
  return (
    <main className="flex flex-col gap-8 w-full max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4">
      <WalletCard title="Spot" variant="dashboard" />

      <SpotTable />
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
