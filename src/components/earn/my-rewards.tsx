"use client";

import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/src/components/shared/skeleton";
import { EmptyState } from "@/src/components/ui/empty-state";
import { StatCell } from "@/src/components/ui/stat-cell";
import { BalanceCloak } from "@/src/components/shared/balance-cloak";
import { RewardStatusBadge } from "./reward-status-badge";
import { earnKeys, earnService } from "@/src/services/earn";
import { formatAmount } from "@/src/lib/lim";

const RECENT_LIMIT = 5;

const formatRewardDate = (value?: string): string | null => {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return null;
  return parsed.format("MMM D, YYYY · HH:mm");
};

/**
 * Rewards ledger: lifetime/pending/period totals plus the latest distribution
 * entries from `/earn/my_rewards`.
 */
export function MyRewards() {
  const { data: rewardsData, isLoading } = useQuery({
    queryKey: earnKeys.myRewards,
    queryFn: () => earnService.myRewards(),
    staleTime: 30_000,
    retry: false,
    throwOnError: false,
  });

  const history = rewardsData?.history ?? [];
  const totalEarnedUsd = rewardsData?.totalEarnedUsd ?? 0;
  const yesterdayRewardsUsd = rewardsData?.yesterdayRewardsUsd ?? 0;
  const thirtyDayRewardsUsd = rewardsData?.thirtyDayRewardsUsd ?? 0;
  const totalStakedUsd = rewardsData?.totalStakedUsd ?? 0;
  const assetSummaries = rewardsData?.assetSummaries ?? [];

  const showStats = !isLoading && rewardsData != null;

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:rounded-xl max-[1150px]:p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-[var(--text-subtitle)] font-semibold text-[var(--color-text-primary)]">
            My rewards
          </h2>
          <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
            Accumulated interest and distributions from your Earn subscriptions.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="flex flex-col gap-2">
              <Skeleton variant="text" width={72} height={12} />
              <Skeleton variant="text" width={110} height={20} />
            </div>
          ))}
        </div>
      ) : showStats ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCell
              label="Total earned"
              value={
                <>
                  $<BalanceCloak balance={totalEarnedUsd} />
                </>
              }
            />
            <StatCell
              label="Yesterday"
              value={
                <>
                  $<BalanceCloak balance={yesterdayRewardsUsd} />
                </>
              }
            />
            <StatCell
              label="Last 30 days"
              value={
                <>
                  $<BalanceCloak balance={thirtyDayRewardsUsd} />
                </>
              }
            />
            <StatCell
              label="Active staked"
              value={
                <>
                  $<BalanceCloak balance={totalStakedUsd} />
                </>
              }
            />
          </div>

          {assetSummaries.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
              <span className="text-xs text-[var(--color-text-secondary)]">By asset:</span>
              {assetSummaries.map((sum) => (
                <span
                  key={sum.asset}
                  className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2.5 py-0.5 text-xs text-white/80"
                >
                  <strong className="text-white">{sum.asset}</strong>: +{formatAmount(sum.totalRewards)} earned
                  {sum.activeStaked > 0 ? ` · ${formatAmount(sum.activeStaked)} staked` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Skeleton variant="text" width={160} height={14} />
              <Skeleton variant="text" width={80} height={14} />
            </div>
          ))}
        </div>
      ) : history.length > 0 ? (
        <ul className="flex flex-col divide-y divide-white/[0.06]">
          {history.slice(0, RECENT_LIMIT).map((reward) => {
            const date = formatRewardDate(reward.distributionDate);
            const typeLabel =
              reward.type === "DAILY_INTEREST"
                ? "Daily Interest"
                : reward.type === "MATURITY_PAYOUT"
                ? "Maturity Payout"
                : reward.type || "Earn Reward";

            return (
              <li
                key={reward.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                      {typeLabel}
                    </span>
                    {reward.apy > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                        {reward.apy}% APY
                      </span>
                    )}
                  </div>
                  {date && (
                    <span className="text-[var(--text-micro)] text-[var(--color-text-secondary)]">
                      {date}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-emerald-400">
                    +{formatAmount(reward.amount)} {reward.asset}
                  </span>
                  <RewardStatusBadge status="credited" />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          caption="No rewards yet — subscribe to Simple Earn or Staking to begin earning daily returns."
        />
      )}
    </section>
  );
}
