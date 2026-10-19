"use client";

import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/src/components/shared/skeleton";
import { EmptyState } from "@/src/components/ui/empty-state";
import { StatCell } from "@/src/components/ui/stat-cell";
import { BalanceCloak } from "@/src/components/shared/balance-cloak";
import { RewardStatusBadge } from "./reward-status-badge";
import { useLimRewardsSummary } from "@/src/hooks/use-lim-wallet";
import { rewardsKeys, rewardsService } from "@/src/services/rewards";
import { normalizeRewardItems } from "@/src/lib/rewards";
import { formatAmount, LIM_SYMBOL } from "@/src/lib/lim";

const RECENT_LIMIT = 5;

const formatRewardDate = (value?: string): string | null => {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return null;
  return parsed.format("MMM D, YYYY · HH:mm");
};

/**
 * Rewards ledger: lifetime/pending/period totals plus the latest credit
 * entries. All figures come from `rewards/summary` and `rewards/history`;
 * when those endpoints are not available the card degrades to a quiet empty
 * state instead of showing zeros as if they were real balances.
 */
export function MyRewards() {
  const {
    summary,
    isLoading: summaryLoading,
    isUnavailable: summaryUnavailable,
  } = useLimRewardsSummary();

  const historyQuery = useQuery({
    queryKey: rewardsKeys.historyList({ page: 1, limit: RECENT_LIMIT }),
    queryFn: () => rewardsService.getHistory({ page: 1, limit: RECENT_LIMIT }),
    select: (res: unknown) => normalizeRewardItems(res).slice(0, RECENT_LIMIT),
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });

  const rewards = historyQuery.data ?? [];
  const historyLoading = historyQuery.isLoading;

  const showStats = !summaryLoading && !!summary;
  const statsUnavailable =
    !summaryLoading && summaryUnavailable && !historyLoading && rewards.length === 0;

  const periodLabel =
    summary?.periodDays != null
      ? `Last ${summary.periodDays} days`
      : "Recent period";

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:rounded-xl max-[1150px]:p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[var(--text-subtitle)] font-semibold text-[var(--color-text-primary)]">
            My rewards
          </h2>
          <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
            LIM credited from earning programs.
          </p>
        </div>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((key) => (
            <div key={key} className="flex flex-col gap-2">
              <Skeleton variant="text" width={72} height={12} />
              <Skeleton variant="text" width={110} height={20} />
            </div>
          ))}
        </div>
      ) : showStats ? (
        <div className="grid grid-cols-3 gap-4">
          <StatCell
            label="Total earned"
            value={
              summary!.totalEarned == null ? (
                "—"
              ) : (
                <>
                  <BalanceCloak balance={summary!.totalEarned} /> {LIM_SYMBOL}
                </>
              )
            }
          />
          <StatCell
            label="Pending"
            value={
              summary!.pending == null ? (
                "—"
              ) : (
                <>
                  <BalanceCloak balance={summary!.pending} /> {LIM_SYMBOL}
                </>
              )
            }
          />
          <StatCell
            label={periodLabel}
            value={
              summary!.creditedPeriod == null ? (
                "—"
              ) : (
                <>
                  <BalanceCloak balance={summary!.creditedPeriod} /> {LIM_SYMBOL}
                </>
              )
            }
          />
        </div>
      ) : null}

      {historyLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Skeleton variant="text" width={160} height={14} />
              <Skeleton variant="text" width={80} height={14} />
            </div>
          ))}
        </div>
      ) : rewards.length > 0 ? (
        <ul className="flex flex-col divide-y divide-white/[0.06]">
          {rewards.map((reward) => {
            const date = formatRewardDate(reward.createdAt);
            return (
              <li
                key={reward.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {reward.campaign ?? reward.source}
                  </span>
                  {date && (
                    <span className="text-[var(--text-micro)] text-[var(--color-text-secondary)]">
                      {date}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
                    +{formatAmount(reward.amount)} {reward.asset}
                  </span>
                  <RewardStatusBadge status={reward.status} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          caption={
            statsUnavailable
              ? "Reward activity will appear here as you earn LIM."
              : "No rewards yet — earn LIM by taking part in the programs above."
          }
        />
      )}
    </section>
  );
}
