import React from "react";

/**
 * Skeleton — Premium shimmer placeholder for loading states.
 * Replaces all <InlineLoading /> spinners with content-shaped placeholders.
 * 
 * Usage:
 *   <Skeleton variant="balance" />
 *   <Skeleton variant="text" width="120px" />
 *   <Skeleton variant="table-row" count={5} />
 *   <Skeleton variant="circle" size={40} />
 *   <Skeleton variant="chart" />
 *   <Skeleton variant="rect" width="100%" height="200px" />
 */

interface SkeletonProps {
  variant?: "text" | "balance" | "table-row" | "circle" | "chart" | "rect";
  width?: string | number;
  height?: string | number;
  size?: number; // for circle variant
  count?: number; // repeat count (for table-row)
  className?: string;
  columns?: number; // number of table columns for table-row variant
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rect",
  width,
  height,
  size = 32,
  count = 1,
  className = "",
  columns = 4,
}) => {
  const baseClass = "skeleton";

  switch (variant) {
    case "text":
      return (
        <div
          className={`${baseClass} ${className}`}
          style={{
            width: width || "80%",
            height: height || "14px",
          }}
        />
      );

    case "balance":
      return (
        <div className={`flex flex-col gap-2 ${className}`}>
          <div
            className={baseClass}
            style={{ width: "180px", height: "36px" }}
          />
          <div
            className={baseClass}
            style={{ width: "140px", height: "14px" }}
          />
        </div>
      );

    case "circle":
      return (
        <div
          className={`${baseClass} !rounded-full ${className}`}
          style={{
            width: size,
            height: size,
            minWidth: size,
          }}
        />
      );

    case "chart":
      return (
        <div className={`flex flex-col gap-2 w-full ${className}`}>
          <div
            className={baseClass}
            style={{ width: "100%", height: height || "300px" }}
          />
        </div>
      );

    case "table-row":
      return (
        <div className={`flex flex-col gap-1 w-full ${className}`}>
          {Array.from({ length: count }).map((_, rowIdx) => (
            <div
              key={rowIdx}
              className="flex items-center gap-4 py-3 px-2"
              style={{
                animationDelay: `${rowIdx * 0.05}s`,
              }}
            >
              {Array.from({ length: columns }).map((_, colIdx) => (
                <div
                  key={colIdx}
                  className={baseClass}
                  style={{
                    flex: colIdx === 0 ? 2 : 1,
                    height: "16px",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      );

    case "rect":
    default:
      return (
        <div
          className={`${baseClass} ${className}`}
          style={{
            width: width || "100%",
            height: height || "20px",
          }}
        />
      );
  }
};

/**
 * SkeletonGroup — Wraps multiple skeleton items with optional fade-in.
 */
export const SkeletonGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
};
