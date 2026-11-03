"use client";

import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/src/components/shared/skeleton";
import { EmptyState } from "@/src/components/ui/empty-state";
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
    <section className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-sm:gap-4 max-sm:p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FaGift size={16} />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">My rewards</h2>
          <p className="text-xs text-white/45">LIM credited from earning programs.</p>
        </div>
      </div>

      {/* Stats row */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="flex flex-col gap-2 rounded-xl border border-white/[0.06] p-4">
              <Skeleton variant="text" width={60} height={11} />
              <Skeleton variant="text" width={100} height={20} />
            </div>
          ))}
        </div>
      ) : showStats ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STAT_CARDS.map((card) => (
            <div key={card.label} className={`flex flex-col gap-2 rounded-xl border p-4 ${card.bg}`}>
              <div className="flex items-center gap-2">
                {card.icon}
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{card.label}</span>
              </div>
              <div className="text-lg font-bold tabular-nums text-white">
                {card.value == null ? (
                  <span className="text-white/30">—</span>
                ) : (
                  <>
                    <BalanceCloak balance={card.value} />{" "}
                    <span className="text-sm font-semibold text-white/40">{LIM_SYMBOL}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Reward history */}
      {historyLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="flex items-center justify-between gap-4 py-2">
              <Skeleton variant="text" width={160} height={14} />
              <Skeleton variant="text" width={80} height={14} />
            </div>
          ))}
        </div>
      ) : rewards.length > 0 ? (
        <div className="flex flex-col gap-1">
          <div className="mb-2 flex items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Recent activity</p>
            <div className="h-px flex-1 bg-white/[0.05]" />
          </div>
          <ul className="flex flex-col divide-y divide-white/[0.04]">
            {rewards.map((reward) => {
              const date = formatRewardDate(reward.createdAt);
              return (
                <li
                  key={reward.id}
                  className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 max-sm:gap-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FaGift size={12} />
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5 flex-1">
                      <span className="truncate text-sm font-semibold text-white">
                        {reward.campaign ?? reward.source}
                      </span>
                      {date && (
                        <span className="text-[11px] text-white/40">{date}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-row max-sm:pl-11">
                    <span className="text-sm font-bold tabular-nums text-white">
                      +{formatAmount(reward.amount)}{" "}
                      <span className="text-white/40">{reward.asset}</span>
                    </span>
                    <RewardStatusBadge status={reward.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] py-8">
          <EmptyState
            caption={
              statsUnavailable
                ? "Reward activity will appear here as you earn LIM."
                : "No rewards yet — earn LIM by taking part in the programs above."
            }
          />
        </div>
      )}
    </section>
  );
}