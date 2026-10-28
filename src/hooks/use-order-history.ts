import { useQuery } from "@tanstack/react-query";
import { readList } from "@/src/lib/api-response";
import { tradingService } from "@/src/services/trading";

export type HistoryMarket = "spot" | "margin" | "futures";

export interface OrderHistoryRawRow {
  id: string;
  market_type?: HistoryMarket;
  pair?: string;
  symbol?: string;
  base?: string;
  quote?: string;
  type: string;
  side: string;
  status: string;
  price?: string;
  quantity?: string;
  avgPrice?: string;
  filledQuantity?: string;
  createdAt: string;
  takeProfitPrice?: string;
  stopLossPrice?: string;
  orderValue?: string;
  filledValue?: string;
}

export interface MarketHistoryPage {
  market: HistoryMarket;
  rows: OrderHistoryRawRow[];
  currentPage: number;
  totalPages: number;
}

export interface UseOrderHistoryParams {
  enabled?: boolean;
  marketType: HistoryMarket | "all";
  page: number;
  status?: string;
  orderType?: string;
  side?: string;
  pair?: string;
  from?: string;
  to?: string;
}

const QUERY_KEY = "ORDER_HISTORY_QUERY_KEY";

export function useOrderHistory({
  enabled = true,
  marketType = "all",
  page = 1,
  status,
  orderType,
  side,
  pair,
  from,
  to,
}: UseOrderHistoryParams) {
  return useQuery({
    queryKey: [QUERY_KEY, marketType, page, status, orderType, side, pair, from, to],
    queryFn: async () => {
      const params: Record<string, any> = {
        market_type: marketType,
        page,
        limit: 20,
      };
      if (status) params.status = status;
      if (orderType) params.order_type = orderType;
      if (side) params.side = side;
      if (pair) params.pair = pair;
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await tradingService.getOrderHistory(params);
      const data = readList<OrderHistoryRawRow>(res);

      // Normalize the unified endpoint response back into MarketHistoryPage[] format
      // The unified endpoint may return records from multiple markets with market_type on each
      const pagesByMarket = new Map<HistoryMarket, OrderHistoryRawRow[]>();
      (data || []).forEach((row) => {
        const mkt = (row.market_type || "spot") as HistoryMarket;
        if (!pagesByMarket.has(mkt)) pagesByMarket.set(mkt, []);
        pagesByMarket.get(mkt)!.push(row);
      });

      // Return as array of MarketHistoryPage for buildOrderHistoryRows compatibility
      const pages: MarketHistoryPage[] = Array.from(pagesByMarket.entries()).map(([market, rows]) => ({
        market,
        rows,
        currentPage: res?.data?.currentPage ?? page,
        totalPages: res?.data?.totalPages ?? 1,
      }));

      return pages;
    },
    enabled,
    staleTime: 0,
    refetchInterval: 15000,
  });
}

export const ORDER_HISTORY_QUERY_KEY = QUERY_KEY;
