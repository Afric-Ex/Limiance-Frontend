import React from "react";
import clsx from "clsx";

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-7",
};

export function Card({
  title,
  actions,
  padding = "md",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        "bg-elevated border border-line rounded-card shadow-card flex flex-col min-w-0",
        paddings[padding],
        className
      )}
      {...rest}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="text-[var(--text-title)] font-semibold text-[var(--color-text-primary)]">
            {title}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}