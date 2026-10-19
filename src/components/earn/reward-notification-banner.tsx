"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FaGift } from "react-icons/fa6";
import { MdOutlineClose } from "react-icons/md";
import { useNotifications } from "@/src/hooks/use-notifications";
import { isRewardNotification } from "@/src/lib/rewards";

/**
 * Surfaces the most recent unread reward notification on the Earn page. The
 * notification feed is the single source of truth for what happened; this
 * banner only re-presents its message verbatim and links through when the
 * notification carries a destination.
 */
export function RewardNotificationBanner() {
  const { notifications } = useNotifications();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const rewardNotification = useMemo(() => {
    return notifications.find(
      (notification) =>
        !notification.read &&
        !dismissedIds.includes(notification.id) &&
        isRewardNotification(notification)
    );
  }, [notifications, dismissedIds]);

  if (!rewardNotification) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/[0.08] px-4 py-3">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary"
        aria-hidden="true"
      >
        <FaGift size={14} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          {rewardNotification.title}
        </p>
        {rewardNotification.body && (
          <p className="text-xs text-[var(--color-text-secondary)]">
            {rewardNotification.body}
          </p>
        )}
        {rewardNotification.link && (
          <Link
            href={rewardNotification.link}
            className="mt-1 text-xs font-semibold text-primary transition-colors hover:text-primary-strong"
          >
            View details →
          </Link>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss reward notification"
        onClick={() => setDismissedIds((ids) => [...ids, rewardNotification.id])}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-white/[0.06] hover:text-[var(--color-text-primary)]"
      >
        <MdOutlineClose size={14} />
      </button>
    </div>
  );
}
