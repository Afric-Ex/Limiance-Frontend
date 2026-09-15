import React from "react";
import clsx from "clsx";

export interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  labelledBy?: string;
}

export function ModalShell({
  open,
  onClose,
  icon,
  title,
  children,
  footer,
  className,
  labelledBy,
}: ModalShellProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={clsx(
          "w-full max-w-[460px] bg-elevated border border-line rounded-xl shadow-[var(--shadow-card)] flex flex-col overflow-hidden",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 p-6 pb-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            {title && (
              <h2 id={labelledBy} className="text-[var(--text-title)] font-semibold text-[var(--color-text-primary)] leading-tight">
                {title}
              </h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex-shrink-0 w-9 h-9 rounded-full bg-muted text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-line flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
        {footer && <div className="p-6 pt-0">{footer}</div>}
      </div>
    </div>
  );
}