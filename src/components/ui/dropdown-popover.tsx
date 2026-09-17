import React from "react";
import clsx from "clsx";

export interface DropdownPopoverProps {
  children?: React.ReactNode;
  className?: string;
  minWidth?: number;
}

export function DropdownPopover({ children, className, minWidth = 280 }: DropdownPopoverProps) {
  return (
    <div
      className={clsx(
        "bg-elevated border border-line rounded-lg shadow-[var(--shadow-card)] p-2",
        className
      )}
      style={{ minWidth }}
    >
      {children}
    </div>
  );
}

export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  description?: React.ReactNode;
}

export function DropdownItem({ icon, description, className, children, ...rest }: DropdownItemProps) {
  return (
    <button
      type="button"
      className={clsx(
        "w-full flex items-center gap-3 px-3 rounded-md transition-colors hover:bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
        description ? "py-2.5" : "h-[44px]",
        className
      )}
      {...rest}
    >
      {icon && <span className="flex-shrink-0 text-[var(--color-text-secondary)]">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-[var(--color-text-primary)]">{children}</span>
        {description && (
          <span className="block text-xs text-[var(--color-text-secondary)] truncate">{description}</span>
        )}
      </span>
    </button>
  );
}