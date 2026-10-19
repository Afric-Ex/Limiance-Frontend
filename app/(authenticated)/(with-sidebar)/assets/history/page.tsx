"use client";

import { PageSuspense } from "@/src/components/shared/page-suspense";
import { AssetsHistorySkeleton } from "@/src/components/skeletons/assets";
import { AssetHistory } from "@/src/components/assets/asset-history";

export default function AssetsHistoryPage() {
  return (
    <PageSuspense fallback={<AssetsHistorySkeleton />}>
      <AssetHistory />
    </PageSuspense>
  );
}
