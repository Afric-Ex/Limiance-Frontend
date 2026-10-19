"use client";

import clsx from "clsx";
import { RewardStatus } from "@/src/lib/rewards";

const STATUS_STYLES: Record<RewardStatus, { label: string; className: string }> = {
  credited: {
    label: "Credited",
    className: "bg-buy-tint text-buy border-buy/25",
  },
  pending: {
    label: "Pending",
    className: "bg-warning/[0.12] text-warning-text border-warning/25",
  },
  failed: {
    label: "Failed",
    className: "bg-sell/[0.12] text-sell border-sell/25",
  },
  reversed: {
    label: "Reversed",
    className: "bg-sell/[0.12] text-sell border-sell/25",
  },
  expired: {
    label: "Expired",
    className: "bg-muted text-[var(--color-text-secondary)] border-line",
  },
  unknown: {
    label: "—",
    className: "bg-muted text-[var(--color-text-secondary)] border-line",
  },
};

export function RewardStatusBadge({ status }: { status: RewardStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.unknown;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[var(--text-micro)] font-semibold uppercase tracking-wide",
        style.className
      )}
    >
      {style.label}
    </span>
  );
}
