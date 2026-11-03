"use client";

import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/src/components/shared/skeleton";
import { BalanceCloak } from "@/src/components/shared/balance-cloak";
import { RewardStatusBadge } from "./reward-status-badge";
import { useLimRewardsSummary } from "@/src/hooks/use-lim-wallet";
import { rewardsKeys, rewardsService } from "@/src/services/rewards";
import { normalizeRewardItems } from "@/src/lib/rewards";
import { formatAmount, LIM_SYMBOL } from "@/src/lib/lim";
import { MdEmojiEvents, MdPending, MdHistory } from "react-icons/md";
import { FaGift } from "react-icons/fa6";

const RECENT_LIMIT = 5;

const formatRewardDate = (value?: string): string | null => {
  if (!value) return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return null;
  return parsed.format("MMM D, YYYY · HH:mm");
};

export function MyRewards() {
  const { summary, isLoading: summaryLoading, isUnavailable: summaryUnavailable } = useLimRewardsSummary();

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
  const statsUnavailable = !summaryLoading && summaryUnavailable && !historyLoading && rewards.length === 0;
  const periodLabel = summary?.periodDays != null ? `Last ${summary.periodDays} days` : "Recent period";

  const STAT_CARDS = [
    {
      label: "Total earned",
      icon: <MdEmojiEvents size={16} className="text-primary" />,
      value: summary?.totalEarned,
      bg: "bg-primary/[0.07] border-primary/15",
    },
    {
      label: "Pending",
      icon: <MdPending size={16} className="text-amber-400" />,
      value: summary?.pending,
      bg: "bg-amber-400/[0.07] border-amber-400/15",
    },
    {
      label: periodLabel,
      icon: <MdHistory size={16} className="text-blue-400" />,
      value: summary?.creditedPeriod,
      bg: "bg-blue-500/[0.07] border-blue-500/15",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
      <article className="flex flex-col gap-5 rounded-2xl border border-white/[0.07] bg-surface p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FaGift size={15} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">My rewards</h2>
            <p className="text-xs text-white/45">LIM credited from earning programs.</p>
          </div>
        </div>

        {summaryLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="flex flex-col gap-2 border-t border-white/[0.08] py-3">
                <Skeleton variant="text" width={80} height={11} />
                <Skeleton variant="text" width={110} height={20} />
              </div>
            ))}
          </div>
        ) : showStats ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STAT_CARDS.map((card) => (
              <div key={card.label} className={`flex flex-col gap-2 rounded-xl border p-4 ${card.bg}`}>
                <div className="flex items-center gap-2">
                  {card.icon}
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{card.label}</span>
                </div>
                <div className="text-lg font-bold tabular-nums text-white">
                  {card.value == null ? (
                    <span className="text-white/35">—</span>
                  ) : (
                    <>
                      <BalanceCloak balance={card.value} />{" "}
                      <span className="text-sm font-semibold text-white/45">{LIM_SYMBOL}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="border-t border-white/[0.08] pt-4 text-sm text-white/45">Reward totals will appear here when available.</p>
        )}
      </article>

      <aside className="flex min-h-[270px] flex-col rounded-2xl border border-white/[0.07] bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Recent activity</h2>
            <p className="mt-1 text-xs text-white/45">Your latest reward credits.</p>
          </div>
          {!historyLoading && rewards.length > 0 && (
            <span className="shrink-0 text-xs tabular-nums text-white/40">Last {rewards.length}</span>
          )}
        </div>

        {historyLoading ? (
          <div className="flex flex-1 flex-col justify-center divide-y divide-white/[0.06]">
            {[0, 1, 2].map((key) => (
              <div key={key} className="flex items-center justify-between gap-4 py-4">
                <Skeleton variant="text" width={160} height={14} />
                <Skeleton variant="text" width={80} height={14} />
              </div>
            ))}
          </div>
        ) : rewards.length > 0 ? (
          <ul className="flex flex-1 flex-col divide-y divide-white/[0.06]">
            {rewards.map((reward) => {
              const date = formatRewardDate(reward.createdAt);
              return (
                <li key={reward.id} className="flex items-center gap-3 py-3.5 first:pt-4 last:pb-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FaGift size={12} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{reward.campaign ?? reward.source}</p>
                    {date && <p className="mt-0.5 text-[11px] text-white/40">{date}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-white">
                      +{formatAmount(reward.amount)} <span className="text-white/45">{reward.asset}</span>
                    </p>
                    <div className="mt-1"><RewardStatusBadge status={reward.status} /></div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <MdHistory size={22} className="mb-3 text-white/35" />
            <p className="text-sm font-medium text-white/70">No reward activity yet</p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-white/40">
              {statsUnavailable
                ? "Your reward credits will appear here as you earn LIM."
                : "Join an earning program to see your reward credits here."}
            </p>
          </div>
        )}
      </aside>
    </section>
  );
}