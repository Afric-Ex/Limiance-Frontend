import type { QueryClient } from "@tanstack/react-query";
import { refreshActivePortfolioTopics } from "./portfolio-store";
import { ALL_WALLETS_QUERY_KEY, TRANSACTION_HISTORY_QUERY_KEY } from "../services/asset";
import { tradingKeys } from "../services/trading";

/**
 * Bring every surface that shows money back in sync after a balance-changing
 * operation (trade, conversion, internal/external transfer, deposit).
 *
 * Two caches are involved:
 *  - the module-level portfolio store (WebSocket/REST balances), which is shared
 *    across mounted components and pages, and
 *  - react-query lists (transaction history, wallets, convert history).
 *
 * Refreshing only the caller's own portfolio topics is not enough: the store is
 * shared, so a conversion opened from the dashboard must also update the funding
 * / spot cards and any other mounted consumer. `refreshActivePortfolioTopics`
 * re-requests every topic that currently has a consumer.
 */
export const refreshFinancialData = (queryClient: QueryClient): void => {
  refreshActivePortfolioTopics();
  void queryClient.invalidateQueries({ queryKey: TRANSACTION_HISTORY_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: ALL_WALLETS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: tradingKeys.convertHistory });
};
