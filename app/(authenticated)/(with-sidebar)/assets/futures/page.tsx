import { WalletCard } from "@/src/components/assets/wallet-card";
import { FuturesTable } from "@/src/components/assets/futures-table";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AssetsFuturesSkeleton } from "@/src/components/skeletons/assets";

function FuturesInner() {
  return (
    <main className="flex flex-col gap-8 max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-4">
      <WalletCard title="Futures" />

      <FuturesTable />
    </main>
  );
}

export default function Futures() {
  return (
    <PageSuspense fallback={<AssetsFuturesSkeleton />}>
      <FuturesInner />
    </PageSuspense>
  );
}
