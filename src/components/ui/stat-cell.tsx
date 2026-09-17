import React from "react";

export interface StatCellProps {
  label: React.ReactNode;
  value: React.ReactNode;
  valueClassName?: string;
}

export function StatCell({ label, value, valueClassName }: StatCellProps) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[var(--text-caption)] text-[var(--color-text-secondary)] uppercase tracking-wide">
        {label}
      </span>
      <span className={`text-[var(--text-subtitle)] text-[var(--color-text-primary)] font-semibold tabular-nums ${valueClassName ?? ""}`}>
        {value}
      </span>
    </div>
  );
}