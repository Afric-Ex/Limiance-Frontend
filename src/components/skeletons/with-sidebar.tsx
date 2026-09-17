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

export function LimianceEarnSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={200} subtitle />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard titleWidth={120}>
          <Skeleton variant="text" width={80} height={32} />
          <Skeleton variant="text" width={100} height={14} />
          <Skeleton variant="rect" width="100%" height={40} className="!rounded-xl mt-2" />
        </SkeletonCard>
        <SkeletonCard titleWidth={120}>
          <Skeleton variant="text" width={80} height={32} />
          <Skeleton variant="text" width={100} height={14} />
          <Skeleton variant="rect" width="100%" height={40} className="!rounded-xl mt-2" />
        </SkeletonCard>
        <SkeletonCard titleWidth={120}>
          <Skeleton variant="text" width={80} height={32} />
          <Skeleton variant="text" width={100} height={14} />
          <Skeleton variant="rect" width="100%" height={40} className="!rounded-xl mt-2" />
        </SkeletonCard>
      </div>
      <SkeletonCard titleWidth={160}>
        <SkeletonTable rows={6} cols={4} />
      </SkeletonCard>
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
