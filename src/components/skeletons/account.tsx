import { Skeleton } from "@/src/components/shared/skeleton";
import {
  SkeletonCard,
  SkeletonHeader,
  SkeletonShell,
  SkeletonTable,
} from "@/src/components/skeletons/shared";

/** Account centre — generic content-column skeleton (section chrome stays real). */
export function AccountPageSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonHeader titleWidth={160} subtitle={false} action={false} />
      <div className="flex flex-col gap-4">
        <SkeletonCard titleWidth={120} className="max-w-xl">
          <div className="flex flex-col gap-3">
            <Skeleton variant="rect" width="100%" height={48} />
            <Skeleton variant="rect" width="100%" height={48} />
          </div>
        </SkeletonCard>
        <SkeletonTable rows={4} cols={3} className="max-w-xl" />
      </div>
    </SkeletonShell>
  );
}