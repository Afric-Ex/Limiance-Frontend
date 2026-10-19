import { api } from "../lib/axios";

/**
 * Rewards / LIM earning ledger service.
 *
 * BACKEND CONTRACT (frontend expectation — reported as a gap when not
 * implemented). Every consumer degrades to an honest empty/unavailable state
 * when these endpoints are missing, so the Earn page never fabricates data.
 *
 *   GET  rewards/summary
 *        → 200 { statusCode, data: {
 *            totalEarned?:  string,   // lifetime LIM credited
 *            pending?:      string,   // LIM awaiting credit
 *            creditedPeriod?: string, // LIM credited in the current period
 *            periodDays?:   number,   // length of that period, e.g. 30
 *          } }
 *
 *   GET  rewards/history?page&limit
 *        → 200 { data: { rewards: [{ id, source, amount, asset, status,
 *            createdAt, campaignName?, reference? }], total? } }
 *        `status` values: pending | credited | failed | expired | reversed
 *
 *   GET  rewards/campaigns
 *        → 200 { data: [{ id, type: "trade_to_earn" | "deposit_to_earn" |
 *            "referral" | "cashback" | "promotion", title, description?,
 *            status?, startsAt?, endsAt?, rewardRate?, eligibility?, cap?,
 *            actionHref?, actionLabel? }] }
 *
 * The only endpoint this page needs beyond the above is the existing
 * `trading/conversion_rate` quote and `wallet/convert_asset` execution —
 * already implemented — which power the USDT-funded LIM purchase.
 */

export const rewardsKeys = {
  summary: ["rewards", "summary"] as const,
  campaigns: ["rewards", "campaigns"] as const,
  historyList: (filters: Record<string, unknown> = {}) => [
    "rewards",
    "history",
    "list",
    filters,
  ],
} as const;

export const rewardsService = {
  /** Aggregated LIM rewards figures (lifetime, pending, period). */
  getSummary: async () => {
    const response = await api.get("rewards/summary");
    return response.data;
  },

  /** Paginated rewards ledger entries. */
  getHistory: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get("rewards/history", { params });
    return response.data;
  },

  /** Active/upcoming LIM earning campaigns (trade to earn, deposit to earn, ...). */
  getCampaigns: async () => {
    const response = await api.get("rewards/campaigns");
    return response.data;
  },
};
