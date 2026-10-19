import { Skeleton } from "@/src/components/shared/skeleton";
import {
  SkeletonCard,
  SkeletonHeader,
  SkeletonShell,
  SkeletonStatGrid,
  SkeletonTable,
} from "@/src/components/skeletons/shared";

/**
 * with-sidebar root page skeletons — one per route.
 * Each mirrors the real page's layout: header, stat grids, tables, charts.
 */

export function DashboardSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={200} subtitle action={false} />
      <SkeletonStatGrid count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonCard titleWidth={120} className="lg:col-span-2">
          <Skeleton variant="chart" height={220} />
        </SkeletonCard>
        <SkeletonCard titleWidth={100}>
          <SkeletonTable rows={5} cols={2} />
        </SkeletonCard>
      </div>
      <SkeletonCard titleWidth={160}>
        <SkeletonTable rows={6} cols={5} />
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function MarketsPageSkeleton() {
  return (
    <SkeletonShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Skeleton variant="text" width={160} height={28} />
        <Skeleton variant="rect" width={260} height={40} className="!rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rect" width={80} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={80} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={80} height={36} className="!rounded-full" />
        <Skeleton variant="rect" width={100} height={36} className="!rounded-full" />
      </div>
      <SkeletonCard header={false}>
        <SkeletonTable rows={10} cols={5} />
      </SkeletonCard>
      <div className="flex justify-center gap-2">
        <Skeleton variant="rect" width={36} height={36} className="!rounded-lg" />
        <Skeleton variant="rect" width={36} height={36} className="!rounded-lg" />
        <Skeleton variant="rect" width={36} height={36} className="!rounded-lg" />
        <Skeleton variant="rect" width={36} height={36} className="!rounded-lg" />
      </div>
    </SkeletonShell>
  );
}

export function BuyCryptoSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={180} subtitle action={false} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard header={false} className="!p-5">
          <div className="flex flex-col gap-3">
            <Skeleton variant="text" width={120} height={18} />
            <Skeleton variant="text" width="100%" height={14} />
            <Skeleton variant="rect" width="100%" height={44} className="!rounded-xl" />
          </div>
        </SkeletonCard>
        <SkeletonCard header={false} className="!p-5">
          <div className="flex flex-col gap-3">
            <Skeleton variant="text" width={120} height={18} />
            <Skeleton variant="text" width="100%" height={14} />
            <Skeleton variant="rect" width="100%" height={44} className="!rounded-xl" />
          </div>
        </SkeletonCard>
        <SkeletonCard header={false} className="!p-5">
          <div className="flex flex-col gap-3">
            <Skeleton variant="text" width={120} height={18} />
            <Skeleton variant="text" width="100%" height={14} />
            <Skeleton variant="rect" width="100%" height={44} className="!rounded-xl" />
          </div>
        </SkeletonCard>
      </div>
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

export function EarnLimSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle action={false} />

      {/* LIM balance: headline + allocation bar + buy/convert actions */}
      <SkeletonCard header={false}>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" size={44} />
            <div className="flex flex-col gap-1.5">
              <Skeleton variant="text" width={90} height={12} />
              <Skeleton variant="text" width={140} height={14} />
            </div>
          </div>
          <Skeleton variant="text" width={200} height={38} />
          <Skeleton variant="rect" width="100%" height={8} className="!rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
          </div>
        </div>
      </SkeletonCard>

      {/* Token utilities */}
      <SkeletonCard titleWidth={140}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} variant="rect" width="100%" height={130} className="!rounded-xl" />
          ))}
        </div>
      </SkeletonCard>

      {/* Ways to earn teasers */}
      <SkeletonCard titleWidth={120}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} variant="rect" width="100%" height={160} className="!rounded-xl" />
          ))}
        </div>
      </SkeletonCard>

      {/* Earn products: tabs + preview card */}
      <SkeletonCard titleWidth={140}>
        <div className="flex flex-col gap-5">
          <div className="flex gap-6 overflow-hidden border-b border-white/[0.06] pb-3">
            {[90, 70, 80, 96, 110, 84, 92].map((width, i) => (
              <Skeleton key={i} variant="text" width={width} height={14} />
            ))}
          </div>
          <Skeleton variant="rect" width="100%" height={210} className="!rounded-xl" />
        </div>
      </SkeletonCard>

      {/* My rewards */}
      <SkeletonCard titleWidth={110}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <Skeleton variant="text" width={80} height={18} />
            <Skeleton variant="text" width={80} height={18} />
            <Skeleton variant="text" width={80} height={18} />
          </div>
          <SkeletonTable rows={3} cols={2} />
        </div>
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function BuyLimSkeleton() {
  return (
    <SkeletonShell>
      <Skeleton variant="text" width={100} height={16} />
      <div className="mx-auto w-full max-w-[480px] flex flex-col gap-6">
        <SkeletonCard header={false}>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Skeleton variant="circle" size={44} />
              <div className="flex flex-col gap-1.5">
                <Skeleton variant="text" width={140} height={16} />
                <Skeleton variant="text" width={90} height={12} />
              </div>
            </div>
            <Skeleton variant="rect" width="100%" height={80} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={52} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={52} className="!rounded-xl" />
          </div>
        </SkeletonCard>
      </div>
    </SkeletonShell>
  );
}

export function WithSidebarSettingsSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle />
      <SkeletonCard titleWidth={140}>
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
          <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
          <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
          <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
        </div>
      </SkeletonCard>
    </SkeletonShell>
  );
}

export function SupportPageSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={180} subtitle action={false} />
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <SkeletonCard titleWidth={120} header={false}>
          <div className="flex flex-col gap-3">
            <Skeleton variant="rect" width="100%" height={44} className="!rounded-full" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.03]">
                <Skeleton variant="text" width={120} height={14} />
                <Skeleton variant="text" width="100%" height={12} />
                <Skeleton variant="text" width={80} height={12} />
              </div>
            ))}
          </div>
        </SkeletonCard>
        <SkeletonCard titleWidth={160}>
          <div className="flex flex-col gap-4">
            <Skeleton variant="text" width={200} height={18} />
            <Skeleton variant="text" width="100%" height={14} />
            <Skeleton variant="text" width="100%" height={14} />
            <Skeleton variant="rect" width="100%" height={120} className="!rounded-xl" />
            <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
          </div>
        </SkeletonCard>
      </div>
    </SkeletonShell>
  );
}
