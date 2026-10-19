"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FaArrowRightArrowLeft,
  FaGift,
  FaPercent,
  FaStar,
  FaUserGroup,
  FaWallet,
} from "react-icons/fa6";
import { Skeleton } from "@/src/components/shared/skeleton";
import { EmptyState } from "@/src/components/ui/empty-state";
import { rewardsKeys, rewardsService } from "@/src/services/rewards";
import {
  RewardCampaign,
  CampaignKind,
  isCampaignActive,
  normalizeCampaigns,
} from "@/src/lib/rewards";

const KIND_META: Record<CampaignKind, { icon: React.ReactNode; tint: string }> = {
  trade_to_earn: {
    icon: <FaArrowRightArrowLeft size={16} />,
    tint: "bg-primary/15 text-primary",
  },
  deposit_to_earn: {
    icon: <FaWallet size={16} />,
    tint: "bg-buy-tint text-buy",
  },
  referral: {
    icon: <FaUserGroup size={16} />,
    tint: "bg-purple-1/20 text-purple-1",
  },
  cashback: {
    icon: <FaPercent size={16} />,
    tint: "bg-warning/[0.15] text-warning-text",
  },
  promotion: {
    icon: <FaGift size={16} />,
    tint: "bg-blue-1/20 text-blue-1",
  },
  other: {
    icon: <FaStar size={16} />,
    tint: "bg-muted text-[var(--color-text-secondary)]",
  },
};

function CampaignCard({ campaign }: { campaign: RewardCampaign }) {
  const meta = KIND_META[campaign.kind] ?? KIND_META.other;
  const isExternal = campaign.actionHref?.startsWith("http");

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.12]">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.tint}`}
          aria-hidden="true"
        >
          {meta.icon}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {campaign.title}
          </h3>
          {campaign.description && (
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {campaign.description}
            </p>
          )}
        </div>
      </div>

      {(campaign.rewardRate || campaign.cap) && (
        <div className="flex flex-wrap items-center gap-2">
          {campaign.rewardRate && (
            <span className="rounded-full bg-buy-tint px-2.5 py-0.5 text-[var(--text-micro)] font-semibold text-buy">
              {campaign.rewardRate}
            </span>
          )}
          {campaign.cap && (
            <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[var(--text-micro)] text-[var(--color-text-secondary)]">
              Cap: {campaign.cap}
            </span>
          )}
        </div>
      )}

      {campaign.eligibility && (
        <p className="text-[var(--text-micro)] text-[var(--color-text-disabled)]">
          {campaign.eligibility}
        </p>
      )}

      {campaign.actionHref && campaign.actionLabel && (
        <div className="mt-auto pt-1">
          {isExternal ? (
            <a
              href={campaign.actionHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary hover:text-primary-strong transition-colors"
            >
              {campaign.actionLabel}
            </a>
          ) : (
            <Link
              href={campaign.actionHref}
              className="text-xs font-semibold text-primary hover:text-primary-strong transition-colors"
            >
              {campaign.actionLabel}
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Active LIM earning campaigns from `rewards/campaigns`. Until the backend
 * endpoint ships, or while only ended promotions exist, this renders an honest
 * empty state — no invented campaigns, rates, or dates.
 */
export function WaysToEarn() {
  const { data, isLoading, isError } = useQuery({
    queryKey: rewardsKeys.campaigns,
    queryFn: () => rewardsService.getCampaigns(),
    select: (res: unknown) => normalizeCampaigns(res),
    staleTime: 5 * 60_000,
    retry: false,
    throwOnError: false,
  });

  const campaigns = useMemo(
    () => (data ?? []).filter((campaign) => isCampaignActive(campaign)),
    [data]
  );

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-[#181a20] p-6 max-[1150px]:rounded-xl max-[1150px]:p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[var(--text-subtitle)] font-semibold text-[var(--color-text-primary)]">
          Ways to earn
        </h2>
        <p className="text-[var(--text-caption)] text-[var(--color-text-secondary)]">
          Active programs that reward you with LIM.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((key) => (
            <div
              key={key}
              className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" size={36} />
                <Skeleton variant="text" width={140} height={14} />
              </div>
              <Skeleton variant="text" width="90%" height={12} />
              <Skeleton variant="text" width="60%" height={12} />
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          caption={
            isError
              ? "Earning programs will appear here once they go live."
              : "No active earning programs right now — new campaigns land regularly, so check back soon."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </section>
  );
}
