"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { tradingService } from "@/src/services/trading";
import { readList } from "@/src/lib/api-response";
import type { OrderHistoryStatus } from "@/src/lib/order-ws";

export type HistoryMarket = "spot" | "margin" | "futures";
export const ORDER_HISTORY_PAGE_SIZE = 20;
export const ORDER_HISTORY_QUERY_KEY = "order-history-panel";

export interface MarketHistoryPage {
  market: HistoryMarket;
  rows: Record<string, any>[];
  totalPages: number;
}

// One request per market. Spot and margin accept a status filter on the server;
// futures history has none (the page filters it locally).
const fetchMarketHistory = (market: HistoryMarket, page: number, status?: OrderHistoryStatus) => {
  const common = { page, limit: ORDER_HISTORY_PAGE_SIZE };
  if (market === "spot") return tradingService.spotOrderHistory({ ...common, status });
  if (market === "margin") return tradingService.marginOrderHistory({ ...common, status });
  return tradingService.futuresOrderHistory(common);
};

const readTotalPages = (res: any): number => {
  const raw = res?.totalPages ?? res?.total_pages ?? res?.data?.totalPages ?? res?.pagination?.totalPages;
  const pages = Number(raw);
  return Number.isFinite(pages) && pages >= 1 ? Math.floor(pages) : 1;
};

/**
 * Order history for one or several markets. Today this is up to three separate
 * requests merged on the client — see the backend note in the PR/summary about a
 * single unified history endpoint.
 */
export function useOrderHistory({
  enabled,
  markets,
  page,
  status,
}: {
  enabled: boolean;
  markets: readonly HistoryMarket[];
  page: number;
  status?: OrderHistoryStatus;
}) {
  const results = useQueries({
    queries: markets.map((market) => ({
      queryKey: [ORDER_HISTORY_QUERY_KEY, market, status ?? "all", page],
      queryFn: () => fetchMarketHistory(market, page, status),
      select: (res: unknown): MarketHistoryPage => ({
        market,
        rows: readList<Record<string, any>>(res),
        totalPages: readTotalPages(res),
      }),
      enabled,
      retry: false,
      throwOnError: false,
      staleTime: 10_000,
      refetchInterval: enabled ? 15_000 : (false as const),
    })),
  });

  const updatedKey = results.map((r) => r.dataUpdatedAt).join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pages = useMemo(() => results.map((r) => r.data).filter((d): d is MarketHistoryPage => Boolean(d)), [updatedKey]);

  return {
    pages,
    // only "loading" while nothing has arrived yet
    isLoading: enabled && pages.length === 0 && results.some((r) => r.isLoading),
  };
}