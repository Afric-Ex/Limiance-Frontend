import { Skeleton } from "@/src/components/shared/skeleton";
import {
  SkeletonCard,
  SkeletonHeader,
  SkeletonShell,
  SkeletonStatGrid,
  SkeletonTable,
} from "@/src/components/skeletons/shared";

/**
 * Assets section skeletons — one per sub-route.
 */

export function AssetsOverviewSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={180} subtitle />
      <SkeletonStatGrid count={4} />
      <SkeletonCard titleWidth={160}>
        <Skeleton variant="chart" height={240} />
      </SkeletonCard>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard titleWidth={120}>
          <SkeletonTable rows={5} cols={3} />
        </SkeletonCard>
        <SkeletonCard titleWidth={120}>
          <SkeletonTable rows={5} cols={3} />
        </SkeletonCard>
      </div>
    </SkeletonShell>
  );
}

export function AssetsSpotSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle action={false} />
      <SkeletonStatGrid count={3} />
      <SkeletonCard titleWidth={140}>
        <SkeletonTable rows={8} cols={5} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function AssetsMarginSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle action={false} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <SkeletonCard titleWidth={120}>
          <SkeletonTable rows={6} cols={4} />
        </SkeletonCard>
        <SkeletonCard titleWidth={120}>
          <div className="flex flex-col gap-3">
            <Skeleton variant="text" width={100} height={16} />
            <Skeleton variant="rect" width="100%" height={48} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={48} className="!rounded-xl" />
          </div>
        </SkeletonCard>
      </div>
    </SkeletonShell>
  );
}

export function AssetsFuturesSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle action={false} />
      <SkeletonStatGrid count={3} />
      <SkeletonCard titleWidth={140}>
        <SkeletonTable rows={8} cols={5} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function AssetsEarnSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard header={false} className="!p-5">
          <Skeleton variant="text" width={100} height={18} />
          <Skeleton variant="text" width={80} height={28} />
          <Skeleton variant="rect" width="100%" height={40} className="!rounded-xl mt-2" />
        </SkeletonCard>
        <SkeletonCard header={false} className="!p-5">
          <Skeleton variant="text" width={100} height={18} />
          <Skeleton variant="text" width={80} height={28} />
          <Skeleton variant="rect" width="100%" height={40} className="!rounded-xl mt-2" />
        </SkeletonCard>
        <SkeletonCard header={false} className="!p-5">
          <Skeleton variant="text" width={100} height={18} />
          <Skeleton variant="text" width={80} height={28} />
          <Skeleton variant="rect" width="100%" height={40} className="!rounded-xl mt-2" />
        </SkeletonCard>
      </div>
      <SkeletonCard titleWidth={140}>
        <SkeletonTable rows={6} cols={4} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function AssetsHistorySkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={170} subtitle action={false} />
      <div className="flex gap-2">
        {[110, 80, 90, 90, 60, 110].map((width, i) => (
          <Skeleton
            key={i}
            variant="rect"
            width={width}
            height={36}
            className="!rounded-full"
          />
        ))}
      </div>
      <SkeletonCard header={false}>
        <SkeletonTable rows={8} cols={5} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function AssetsFundingSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle action={false} />
      <div className="flex gap-2">
        <Skeleton variant="rect" width={80} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={80} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={100} height={36} className="!rounded-full" />
      </div>
      <SkeletonCard header={false}>
        <SkeletonTable rows={8} cols={5} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function TradingBotsSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={180} subtitle />
      <div className="flex gap-2">
        <Skeleton variant="rect" width={100} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={100} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={100} height={36} className="!rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard titleWidth={120} header={false} className="!p-5">
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width={80} height={12} />
          <Skeleton variant="rect" width="100%" height={80} className="!rounded-xl" />
        </SkeletonCard>
        <SkeletonCard titleWidth={120} header={false} className="!p-5">
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width={80} height={12} />
          <Skeleton variant="rect" width="100%" height={80} className="!rounded-xl" />
        </SkeletonCard>
        <SkeletonCard titleWidth={120} header={false} className="!p-5">
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width={80} height={12} />
          <Skeleton variant="rect" width="100%" height={80} className="!rounded-xl" />
        </SkeletonCard>
      </div>
    </SkeletonShell>
  );
}
