import { useQuery } from "@tanstack/react-query";
import { readList } from "@/src/lib/api-response";
import {
  getFuturesOrderHistoryWs,
  getMarginOrderHistoryWs,
  getSpotOrderHistoryWs,
  type OrderHistoryStatus,
  type OrderHistoryWsParams,
} from "@/src/lib/order-ws";
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

const WS_HISTORY_STATUSES = new Set<OrderHistoryStatus>([
  "OPEN",
  "FILLED",
  "CANCELLED",
  "REJECTED",
]);

function wsHistoryRequest(
  market: HistoryMarket,
  params: OrderHistoryWsParams | undefined
): Promise<any> {
  if (market === "margin") return getMarginOrderHistoryWs(params);
  if (market === "futures") return getFuturesOrderHistoryWs(params);
  return getSpotOrderHistoryWs(params);
}

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
      const historyStatus = status?.toUpperCase() as OrderHistoryStatus | undefined;
      const wsParams: OrderHistoryWsParams = {
        page,
        limit: 20,
        ...(historyStatus && WS_HISTORY_STATUSES.has(historyStatus)
          ? { status: historyStatus }
          : {}),
      };

      let res: any;
      if (marketType !== "all") {
        // WS-first for a single market (§3.13–3.15, §4.10–4.11, §5.10).
        // The unified "all markets" view has no WS equivalent, and filters the
        // socket does not accept (pair/date/type/side) are applied client-side
        // by the order-history table.
        try {
          res = await wsHistoryRequest(marketType, wsParams);
        } catch {
          res = null;
        }
      }

      if (!res) {
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

        res = await tradingService.getOrderHistory(params);
      }

      const data = readList<OrderHistoryRawRow>(res);

      // The WS payload keeps totalPages/currentPage as siblings of `data`;
      // the REST envelope does the same on its backend body.
      const currentPage = res?.currentPage ?? res?.data?.currentPage ?? page;
      const totalPages = res?.totalPages ?? res?.data?.totalPages ?? 1;

      // Normalize the unified endpoint response back into MarketHistoryPage[] format
      // The unified endpoint may return records from multiple markets with market_type on each
      const pagesByMarket = new Map<HistoryMarket, OrderHistoryRawRow[]>();
      (data || []).forEach((row) => {
        const rawMkt = (row.market_type || (row as any).marketType || (row as any).market || "").toLowerCase();
        const mkt = (["spot", "margin", "futures"].includes(rawMkt) ? rawMkt : marketType !== "all" ? marketType : "spot") as HistoryMarket;
        if (!pagesByMarket.has(mkt)) pagesByMarket.set(mkt, []);
        pagesByMarket.get(mkt)!.push(row);
      });

      // Return as array of MarketHistoryPage for buildOrderHistoryRows compatibility
      const pages: MarketHistoryPage[] = Array.from(pagesByMarket.entries()).map(([market, rows]) => ({
        market,
        rows,
        currentPage,
        totalPages,
      }));

      return pages;
    },
    enabled,
    staleTime: 0,
    // Slow safety net only: live order updates invalidate this query via
    // useUserOrderUpdates, and the socket supplies the initial page.
    refetchInterval: 60_000,
  });
}

export const ORDER_HISTORY_QUERY_KEY = QUERY_KEY;
