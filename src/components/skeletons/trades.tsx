import { Skeleton } from "@/src/components/shared/skeleton";
import {
  SkeletonAvatar,
  SkeletonCard,
  SkeletonShell,
  SkeletonTable,
} from "@/src/components/skeletons/shared";

/** Full-screen trading workspace skeletons. */
export function SpotTradePageSkeleton() {
  return (
    <SkeletonShell className="max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 min-[1150px]:grid-cols-[1fr_320px] gap-4 w-full">
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonAvatar size={36} />
              <div className="flex flex-col gap-1.5">
                <Skeleton variant="text" width={120} height={20} />
                <Skeleton variant="text" width={90} height={14} />
              </div>
            </div>
            <Skeleton variant="rect" width={140} height={40} className="!rounded-full" />
          </div>
          <SkeletonCard header={false}>
            <Skeleton variant="chart" height={320} className="!bg-transparent" />
          </SkeletonCard>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <SkeletonCard titleWidth={100}>
            <SkeletonTable rows={6} cols={3} />
          </SkeletonCard>
          <SkeletonCard titleWidth={100}>
            <div className="flex flex-col gap-3">
              <Skeleton variant="rect" width="100%" height={48} />
              <Skeleton variant="rect" width="100%" height={48} />
              <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl" />
            </div>
          </SkeletonCard>
        </div>
      </div>
    </SkeletonShell>
  );
}

export function MarginTradePageSkeleton() {
  return <SpotTradePageSkeleton />;
}

export function FuturesTradePageSkeleton() {
  return <SpotTradePageSkeleton />;
}