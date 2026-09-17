import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  caption?: React.ReactNode;
}

export function EmptyState({ icon, caption = "No Records" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      {icon && (
        <div className="flex items-center justify-center text-[var(--color-text-disabled)]">
          {icon}
        </div>
      )}
      <p className="text-sm text-[var(--color-text-secondary)]">{caption}</p>
    </div>
  );
}