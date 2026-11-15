"use client";

import type { TopicNotice } from "@/src/lib/portfolio-store";

const MESSAGES: Record<Exclude<TopicNotice, null>, string> = {
  unavailable: "We're having some technical issues right now. Please check back later.",
  delayed: "We're still fetching your balance — please hold on a moment.",
  stale: "Your balance may have changed. Tap the refresh icon to update it.",
};

interface BalanceNoticeProps {
  /** Notice produced by `usePortfolioWs` for the balance-bearing topics. */
  notice: TopicNotice;
  className?: string;
}

/**
 * Reassurance/explanation shown below a balance when its data is slow, stale or
 * unavailable. Shared by every surface that renders an account balance so the
 * wording and styling stay identical across the app.
 */
export function BalanceNotice({ notice, className = "" }: BalanceNoticeProps) {
  if (!notice) return null;
  return (
    <div
      role="status"
      className={`flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200 ${className}`}
    >
      <span aria-hidden className="mt-px font-bold">
        i
      </span>
      <span>{MESSAGES[notice]}</span>
    </div>
  );
}
