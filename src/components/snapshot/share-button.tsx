"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { FiShare2 } from "react-icons/fi";

type ShareButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
};

export function ShareButton({ onClick, disabled, tooltip, className }: ShareButtonProps) {
  const t = useTranslations("Snapshot");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={t("shareTriggerAria")}
      title={disabled ? tooltip : undefined}
      className={clsx(
        "flex h-9 w-9 items-center justify-center rounded-full bg-muted text-[var(--color-text-secondary)] transition-colors hover:bg-line hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      <FiShare2 size={16} aria-hidden />
    </button>
  );
}
