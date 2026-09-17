import React from "react";
import clsx from "clsx";

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "default" | "compact";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "default",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={clsx(
        "inline-flex items-center gap-1 bg-surface rounded-[var(--radius-md)] border border-line p-1",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              "rounded-[calc(var(--radius-md)-4px)] transition-all duration-200 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
              size === "default" ? "h-[29px] min-w-[77px] px-4 text-sm" : "h-6 px-3 text-xs",
              active
                ? "bg-primary text-white shadow-glow/30"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-muted"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}