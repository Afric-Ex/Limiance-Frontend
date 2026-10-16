"use client";

import { ExternalTransfer } from "@/src/components/transactions/external-transfer";
import { PageSuspense } from "@/src/components/shared/page-suspense";
import { SkeletonCard } from "@/src/components/skeletons/shared";

function InternalTransferInner() {
  return (
    <div className="flex flex-col gap-10 relative max-[1150px]:px-4 max-[1150px]:pb-[90px] page-enter max-[1150px]:gap-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white tracking-tight">Internal Transfer</h1>
        <span className="text-xs font-medium text-white/40">
          Send crypto to another Limiance user by their user ID — no network fee
        </span>
      </div>

      <ExternalTransfer embedded />
    </div>
  );
}

export default function InternalTransferPage() {
  return (
    <PageSuspense fallback={<SkeletonCard className="max-w-[540px]" />}>
      <InternalTransferInner />
    </PageSuspense>
  );
}
