import React from "react";
import { Skeleton } from "@/src/components/shared/skeleton";

/**
 * Shared composable building blocks for page-level skeletons.
 * Every per-page skeleton is assembled from these blocks so the shimmer
 * styling lives in one place and skeletons stay consistent with the
 * design system (cards, borders, rounded corners, responsive stacking).
 */

const cardClass =
  "rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:p-4 max-[1150px]:rounded-xl w-full";

/** Full-width page wrapper mirroring the pages' <main> scaffolding. */
export const SkeletonShell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`flex flex-col gap-6 w-full animate-fade-in page-enter ${className}`}>
    {children}
  </div>
);

/** Page header: title bar + optional subtitle/action. */
export const SkeletonHeader: React.FC<{
  titleWidth?: string | number;
  subtitle?: boolean;
  action?: boolean;
  className?: string;
}> = ({ titleWidth = 180, subtitle = true, action = true, className = "" }) => (
  <div className={`flex items-center justify-between gap-4 ${className}`}>
    <div className="flex flex-col gap-1.5">
      <Skeleton variant="text" width={titleWidth} height={24} />
      {subtitle && <Skeleton variant="text" width={(Number(titleWidth) || 180) * 0.6} height={13} />}
    </div>
    {action && <Skeleton variant="rect" width={120} height={40} className="!rounded-full shrink-0" />}
  </div>
);

/** Card panel with optional header row (title bar + action bar). */
export const SkeletonCard: React.FC<{
  className?: string;
  children?: React.ReactNode;
  header?: boolean;
  titleWidth?: string | number;
  actionWidth?: string | number;
}> = ({ className = "", children, header = true, titleWidth = 140, actionWidth = 72 }) => (
  <div className={`${cardClass} ${className}`}>
    {header && (
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" width={titleWidth} height={18} />
        <Skeleton variant="text" width={actionWidth} height={14} />
      </div>
    )}
    {children}
  </div>
);

/** Row of mini stat cards (balances, stats). */
export const SkeletonStatCard: React.FC = () => (
  <SkeletonCard className="!p-4" header={false}>
    <div className="flex flex-col gap-2">
      <Skeleton variant="text" width={72} height={12} />
      <Skeleton variant="text" width={120} height={22} />
    </div>
  </SkeletonCard>
);

export const SkeletonStatGrid: React.FC<{ count?: number; className?: string }> = ({
  count = 4,
  className = "",
}) => (
  <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonStatCard key={i} />
    ))}
  </div>
);

/** List/table rows with a simulated header row. */
export const SkeletonTable: React.FC<{
  rows?: number;
  cols?: number;
  className?: string;
}> = ({ rows = 6, cols = 4, className = "" }) => (
  <div className={`w-full ${className}`}>
    <div className="flex items-center gap-4 px-2 py-2 border-b border-white/[0.06]">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === 0 ? 110 : 72} height={12} className="flex-none" />
      ))}
    </div>
    <Skeleton variant="table-row" count={rows} columns={cols} />
  </div>
);

/** Form field: label bar + input-shaped bar. */
export const SkeletonField: React.FC<{
  labelWidth?: string | number;
  height?: number;
  label?: boolean;
  className?: string;
}> = ({ labelWidth = 64, height = 55, label = true, className = "" }) => (
  <div className={`flex flex-col gap-1.5 w-full ${className}`}>
    {label && <Skeleton variant="text" width={labelWidth} height={12} />}
    <Skeleton variant="rect" width="100%" height={height} />
  </div>
);

/** Grid of form fields (auth/settings forms). */
export const SkeletonForm: React.FC<{
  fields?: number;
  cols?: number;
  withButton?: boolean;
  className?: string;
}> = ({ fields = 4, cols = 1, withButton = true, className = "" }) => (
  <div className={`flex flex-col gap-4 w-full ${className}`}>
    <div className={`grid grid-cols-1 ${cols > 1 ? `md:grid-cols-${cols}` : ""} gap-4`}>
      {Array.from({ length: fields }).map((_, i) => (
        <SkeletonField key={i} labelWidth={64} />
      ))}
    </div>
    {withButton && <Skeleton variant="rect" width="100%" height={56} className="!rounded-xl mt-1" />}
  </div>
);

/** Avatar circle placeholder. */
export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 48,
  className = "",
}) => <Skeleton variant="circle" size={size} className={className} />;

/** Large chart panel. */
export const SkeletonChart: React.FC<{ height?: number; className?: string }> = ({
  height = 300,
  className = "",
}) => (
  <SkeletonCard className={className} header={true}>
    <Skeleton variant="chart" height={height} className="!bg-transparent" />
  </SkeletonCard>
);