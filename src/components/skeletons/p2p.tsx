import { Skeleton } from "@/src/components/shared/skeleton";
import {
  SkeletonCard,
  SkeletonHeader,
  SkeletonShell,
  SkeletonTable,
} from "@/src/components/skeletons/shared";

/**
 * P2P trades section skeletons — one per sub-route.
 */

export function P2PMarketplaceSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle action={false} />
      <div className="flex gap-2">
        <Skeleton variant="rect" width={100} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={100} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={120} height={36} className="!rounded-full" />
      </div>
      <SkeletonCard header={false}>
        <SkeletonTable rows={8} cols={5} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function P2PCreateAdSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={180} subtitle />
      <SkeletonCard titleWidth={140}>
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
          <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
          <Skeleton variant="rect" width="100%" height={80} className="!rounded-xl" />
          <Skeleton variant="rect" width="100%" height={48} className="!rounded-full" />
        </div>
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function P2PEditAdSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={180} subtitle />
      <SkeletonCard titleWidth={140}>
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
          <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
          <Skeleton variant="rect" width="100%" height={80} className="!rounded-xl" />
          <Skeleton variant="rect" width="100%" height={48} className="!rounded-full" />
        </div>
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function P2PAdvertiserRegisterSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={200} subtitle />
      <SkeletonCard titleWidth={160}>
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
          <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
          <Skeleton variant="rect" width="100%" height={48} className="!rounded-full" />
        </div>
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function P2PMyAdsSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle action={false} />
      <div className="flex gap-2">
        <Skeleton variant="rect" width={80} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={80} height={36} className="!rounded-full" />
      </div>
      <SkeletonCard header={false}>
        <SkeletonTable rows={6} cols={4} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function P2PCreateOrderSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={180} subtitle action={false} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <SkeletonCard titleWidth={140}>
          <div className="flex flex-col gap-4">
            <Skeleton variant="rect" width="100%" height={80} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={120} className="!rounded-xl" />
          </div>
        </SkeletonCard>
        <SkeletonCard titleWidth={120}>
          <Skeleton variant="text" width="100%" height={100} />
        </SkeletonCard>
      </div>
    </SkeletonShell>
  );
}

export function P2POrderDetailSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={180} subtitle action={false} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <SkeletonCard titleWidth={140}>
          <div className="flex flex-col gap-4">
            <Skeleton variant="rect" width="100%" height={60} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={100} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={48} className="!rounded-full" />
          </div>
        </SkeletonCard>
        <SkeletonCard titleWidth={120}>
          <div className="flex flex-col gap-3">
            <Skeleton variant="text" width="100%" height={14} />
            <Skeleton variant="text" width="100%" height={14} />
            <Skeleton variant="rect" width="100%" height={48} className="!rounded-xl" />
          </div>
        </SkeletonCard>
      </div>
    </SkeletonShell>
  );
}

export function P2POrdersSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle action={false} />
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

export function P2PProfileSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={180} subtitle />
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" size={80} />
        <div className="flex flex-col gap-2">
          <Skeleton variant="text" width={160} height={20} />
          <Skeleton variant="text" width={120} height={14} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <SkeletonCard header={false} className="!p-4">
          <Skeleton variant="text" width={60} height={24} />
          <Skeleton variant="text" width={80} height={12} />
        </SkeletonCard>
        <SkeletonCard header={false} className="!p-4">
          <Skeleton variant="text" width={60} height={24} />
          <Skeleton variant="text" width={80} height={12} />
        </SkeletonCard>
        <SkeletonCard header={false} className="!p-4">
          <Skeleton variant="text" width={60} height={24} />
          <Skeleton variant="text" width={80} height={12} />
        </SkeletonCard>
      </div>
      <SkeletonCard titleWidth={140}>
        <SkeletonTable rows={6} cols={4} />
      </SkeletonCard>
    </SkeletonShell>
  );
}
