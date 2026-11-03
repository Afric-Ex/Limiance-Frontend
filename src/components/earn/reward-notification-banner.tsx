"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MdOutlineClose, MdArrowOutward } from "react-icons/md";
import { FaGift } from "react-icons/fa6";
import { useNotifications } from "@/src/hooks/use-notifications";
import { isRewardNotification } from "@/src/lib/rewards";

export function RewardNotificationBanner() {
  const { notifications } = useNotifications();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const rewardNotification = useMemo(() => {
    return notifications.find(
      (n) => !n.read && !dismissedIds.includes(n.id) && isRewardNotification(n)
    );
  }, [notifications, dismissedIds]);

  if (!rewardNotification) return null;

  return (
    <div className="relative overflow-hidden flex items-start gap-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/[0.12] to-primary/[0.04] px-5 py-4">
      {/* Glow */}
      <div className="pointer-events-none absolute -left-4 top-0 h-full w-24 bg-primary/10 blur-2xl" />

      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
        <FaGift size={16} />
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-bold text-white">{rewardNotification.title}</p>
        {rewardNotification.body && (
          <p className="text-xs text-white/55">{rewardNotification.body}</p>
        )}
        {rewardNotification.link && (
          <Link
            href={rewardNotification.link}
            className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary transition-colors hover:text-primary/80"
          >
            View details <MdArrowOutward size={12} />
          </Link>
        )}
      </div>

      <button
        type="button"
        aria-label="Dismiss reward notification"
        onClick={() => setDismissedIds((ids) => [...ids, rewardNotification.id])}
        className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white"
      >
        <MdOutlineClose size={15} />
      </button>
    </div>
  );
}