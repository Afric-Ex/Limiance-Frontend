import { Skeleton } from "@/src/components/shared/skeleton";
import {
  SkeletonCard,
  SkeletonHeader,
  SkeletonShell,
  SkeletonTable,
} from "@/src/components/skeletons/shared";

/**
 * Orders + Transactions section skeletons — one per sub-route.
 */

export function SpotOrdersSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle={false} action={false} />
      <div className="flex gap-2">
        <Skeleton variant="rect" width={80} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={80} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={80} height={36} className="!rounded-full" />
      </div>
      <SkeletonCard header={false}>
        <SkeletonTable rows={8} cols={5} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function MarginOrdersSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle={false} action={false} />
      <div className="flex gap-2">
        <Skeleton variant="rect" width={80} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={80} height={36} className="!rounded-full" />
      </div>
      <SkeletonCard header={false}>
        <SkeletonTable rows={8} cols={5} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function ConvertHistorySkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={180} subtitle={false} action={false} />
      <SkeletonCard header={false}>
        <SkeletonTable rows={6} cols={4} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function FiatOrdersSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle={false} action={false} />
      <SkeletonCard header={false}>
        <SkeletonTable rows={6} cols={4} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function PaymentHistorySkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={180} subtitle={false} action={false} />
      <SkeletonCard header={false}>
        <SkeletonTable rows={8} cols={5} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function TransactionAnalysisSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={200} subtitle={false} action={false} />
      <SkeletonCard header={false}>
        <SkeletonTable rows={6} cols={4} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function DepositSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle />
      <div className="grid grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] gap-6 max-[1150px]:gap-4">
        <SkeletonCard titleWidth={140}>
          <div className="flex flex-col gap-4">
            <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={80} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={48} className="!rounded-full" />
          </div>
        </SkeletonCard>
        <SkeletonCard titleWidth={120}>
          <Skeleton variant="text" width="100%" height={100} />
        </SkeletonCard>
      </div>
    </SkeletonShell>
  );
}

export function WithdrawalSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <SkeletonCard titleWidth={140}>
          <div className="flex flex-col gap-4">
            <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={48} className="!rounded-full" />
          </div>
        </SkeletonCard>
        <SkeletonCard titleWidth={120}>
          <Skeleton variant="text" width="100%" height={100} />
        </SkeletonCard>
      </div>
    </SkeletonShell>
  );
}
