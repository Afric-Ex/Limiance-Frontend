/**
 * Rewards ledger helpers — pure functions, no React and no network.
 *
 * The rewards feature has no frontend implementation yet, so these helpers
 * define the tolerant client-side contract: they unwrap whatever envelope the
 * backend returns and normalize records into a single shape the UI can render.
 * When the endpoints are not implemented yet, every consumer degrades to an
 * honest empty/unavailable state instead of inventing data.
 */

import { parseAmount } from "./lim.ts";

export type RewardStatus =
  | "pending"
  | "credited"
  | "failed"
  | "expired"
  | "reversed"
  | "unknown";

export interface RewardItem {
  id: string;
  /** Reward source/campaign label, e.g. "Trade to Earn". */
  source: string;
  /** Campaign name/reference when the backend provides one. */
  campaign?: string;
  /** Reward amount in LIM units, as a display string. */
  amount: string;
  /** Asset symbol — rewards are LIM-denominated, but never hardcode blind. */
  asset: string;
  status: RewardStatus;
  createdAt?: string;
  /** Backend transaction / ledger reference for the reward credit. */
  reference?: string;
}

export interface RewardsSummary {
  /** LIM currently credited and spendable through rewards. */
  totalEarned: number | null;
  /** LIM not yet credited (confirmation window, campaign settlement, ...). */
  pending: number | null;
  /** LIM credited within the summary period, when the backend provides it. */
  creditedPeriod: number | null;
  /** Length of the credited window in days, when the backend provides it. */
  periodDays: number | null;
}

export type CampaignKind =
  | "trade_to_earn"
  | "deposit_to_earn"
  | "referral"
  | "cashback"
  | "promotion"
  | "other";

export interface RewardCampaign {
  id: string;
  kind: CampaignKind;
  title: string;
  description?: string;
  /** Backend campaign status string, normalized to lowercase. */
  status?: string;
  startsAt?: string;
  endsAt?: string;
  /** Human-readable reward rate/rule text, only when the backend provides it. */
  rewardRate?: string;
  /** Human-readable eligibility rules, only when the backend provides it. */
  eligibility?: string;
  /** Human-readable cap, only when the backend provides it. */
  cap?: string;
  /** Action the card should offer, e.g. a trading or deposit destination. */
  actionHref?: string;
  actionLabel?: string;
}

const REWARD_STATUS_MAP: Record<string, RewardStatus> = {
  pending: "pending",
  processing: "pending",
  confirming: "pending",
  credited: "credited",
  completed: "credited",
  paid: "credited",
  success: "credited",
  successful: "credited",
  failed: "failed",
  error: "failed",
  expired: "expired",
  reversed: "reversed",
  reverted: "reversed",
  clawed_back: "reversed",
};

export function normalizeRewardStatus(raw: unknown): RewardStatus {
  const key = String(raw ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return REWARD_STATUS_MAP[key] ?? "unknown";
}

/**
 * Unwrap the common envelopes the backend uses: `{ data: { data: [...] } }`,
 * `{ data: { rewards: [...] } }`, `{ rewards: [...] }`, or a bare array.
 * Returns [] for anything unusable so callers never crash on shape drift.
 */
export function unwrapRewardList(payload: unknown): unknown[] {
  const candidates: unknown[] = [
    payload,
    (payload as any)?.data,
    (payload as any)?.data?.data,
    (payload as any)?.data?.rewards,
    (payload as any)?.rewards,
    (payload as any)?.data?.items,
    (payload as any)?.items,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function normalizeRewardItem(raw: unknown): RewardItem | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, any>;

  const amount = record.amount ?? record.rewardAmount ?? record.value ?? record.limAmount;
  const parsedAmount = parseAmount(amount);
  if (parsedAmount == null) return null;

  const id =
    firstString(record.id, record._id, record.rewardId, record.reference) ??
    `${record.source ?? record.type ?? "reward"}-${record.createdAt ?? record.created_at ?? parsedAmount}`;

  const source =
    firstString(
      record.source,
      record.program,
      record.campaignName,
      record.campaign?.name,
      record.title,
      record.type
    ) ?? "LIM reward";

  const createdAt = firstString(record.createdAt, record.created_at, record.timestamp, record.date);
  const reference = firstString(
    record.reference,
    record.transactionReference,
    record.txRef,
    record.ledgerId
  );

  return {
    id,
    source,
    campaign: firstString(record.campaignName, record.campaign?.name, record.campaign),
    amount: String(amount).trim(),
    asset: (firstString(record.asset, record.symbol, record.currency) ?? "LIM").toUpperCase(),
    status: normalizeRewardStatus(record.status ?? record.state),
    createdAt,
    reference,
  };
}

export function normalizeRewardItems(payload: unknown): RewardItem[] {
  return unwrapRewardList(payload)
    .map(normalizeRewardItem)
    .filter((item): item is RewardItem => item != null);
}

/** Numeric-or-null reader used for summary fields. */
function numberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = parseAmount(value);
  return parsed == null ? null : parsed;
}

export function normalizeRewardsSummary(payload: unknown): RewardsSummary | null {
  if (!payload || typeof payload !== "object") return null;
  const body: any = (payload as any)?.data?.data ?? (payload as any)?.data ?? payload;

  const totalEarned = numberOrNull(
    body.totalEarned ?? body.total_earned ?? body.lifetimeEarned ?? body.earned
  );
  const pending = numberOrNull(
    body.pending ?? body.pendingRewards ?? body.pending_rewards ?? body.uncredited
  );
  const creditedPeriod = numberOrNull(
    body.creditedPeriod ??
      body.credited_period ??
      body.last30Days ??
      body.last_30_days ??
      body.periodEarned
  );
  const periodDays = numberOrNull(body.periodDays ?? body.period_days);

  if (
    totalEarned == null &&
    pending == null &&
    creditedPeriod == null
  ) {
    return null;
  }

  return { totalEarned, pending, creditedPeriod, periodDays };
}

const CAMPAIGN_KIND_MAP: Record<string, CampaignKind> = {
  trade_to_earn: "trade_to_earn",
  trade: "trade_to_earn",
  trading: "trade_to_earn",
  deposit_to_earn: "deposit_to_earn",
  deposit: "deposit_to_earn",
  referral: "referral",
  referral_reward: "referral",
  cashback: "cashback",
  fee_cashback: "cashback",
  promotion: "promotion",
  promo: "promotion",
  bonus: "promotion",
};

export function normalizeCampaignKind(raw: unknown): CampaignKind {
  const key = String(raw ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return CAMPAIGN_KIND_MAP[key] ?? "other";
}

export function normalizeCampaign(raw: unknown): RewardCampaign | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, any>;

  const title = firstString(record.title, record.name, record.campaignName);
  if (!title) return null;

  const kind = normalizeCampaignKind(record.type ?? record.kind ?? record.category);

  return {
    id: firstString(record.id, record._id, record.campaignId) ?? title,
    kind,
    title,
    description: firstString(record.description, record.subtitle, record.details),
    status: firstString(record.status, record.state)?.toLowerCase(),
    startsAt: firstString(record.startsAt, record.startDate, record.start_date),
    endsAt: firstString(record.endsAt, record.endDate, record.end_date),
    rewardRate: firstString(record.rewardRate, record.reward_rate, record.rate),
    eligibility: firstString(record.eligibility, record.rules, record.requirements),
    cap: firstString(record.cap, record.rewardCap, record.maxReward),
    actionHref: firstString(record.actionHref, record.href, record.link),
    actionLabel: firstString(record.actionLabel, record.cta),
  };
}

export function normalizeCampaigns(payload: unknown): RewardCampaign[] {
  return unwrapRewardList(payload)
    .map(normalizeCampaign)
    .filter((campaign): campaign is RewardCampaign => campaign != null);
}

/** Campaigns that are not explicitly ended/paused are shown as active. */
export function isCampaignActive(
  campaign: RewardCampaign,
  now: number = Date.now()
): boolean {
  const status = (campaign.status ?? "").toLowerCase();
  if (["ended", "expired", "paused", "cancelled", "canceled", "draft"].includes(status)) {
    return false;
  }
  if (campaign.startsAt) {
    const start = Date.parse(campaign.startsAt);
    if (Number.isFinite(start) && start > now) return false;
  }
  if (campaign.endsAt) {
    const end = Date.parse(campaign.endsAt);
    if (Number.isFinite(end) && end < now) return false;
  }
  return true;
}

/**
 * Whether an existing notification announces a reward credit. Used to surface
 * a supplemental banner on the Earn page; the notification itself is the
 * source of truth and its message is rendered verbatim.
 */
export function isRewardNotification(notification: {
  title?: string;
  body?: string;
  type?: unknown;
} | null | undefined): boolean {
  if (!notification) return false;
  const haystack = [
    notification.title,
    notification.body,
    typeof notification.type === "string" ? notification.type : "",
  ]
    .join(" ")
    .toLowerCase();
  if (!haystack.trim()) return false;
  return /(reward|bonus|cashback|airdrop|credited|lim\b)/.test(haystack);
}
