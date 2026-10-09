"use client";

import { useEffect, useState } from "react";
import { wsClient } from "@/src/lib/websocket-client";
import { filterRecentTradesByPair } from "@/src/lib/recent-trades";
import type { OrderBookMarket } from "@/src/hooks/use-order-book";

export type RecentTrade = Record<string, unknown>;

const normalizePair = (pair: string) =>
  pair.replace(/[/\\\-_\s]/g, "").toUpperCase();

function readTrades(payload: any): RecentTrade[] {
  const values =
    payload?.trades ??
    payload?.recentTrades ??
    payload?.recent_trades ??
    payload?.data?.trades ??
    payload?.data?.recentTrades ??
    payload?.data?.recent_trades ??
    payload?.data?.data ??
    payload?.data;

  if (Array.isArray(values)) return values;
  if (values && typeof values === "object") return [values];
  return [];
}

export function useRecentTrades(pair: string, market: OrderBookMarket) {
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTrades([]);
    setIsLoading(true);

    const symbol = normalizePair(pair);
    const request = {
      type: "get_recent_trades",
      data: { pair, symbol, market },
    };

    const unsubscribe = wsClient.subscribe(
      "recent_trades",
      request,
      (payload) => {
        const updates = filterRecentTradesByPair(readTrades(payload), pair);
        setTrades((current) => {
          const combined =
            updates.length === 1 && current.length > 0
              ? [...updates, ...current]
              : updates;
          const seen = new Set<string>();
          return combined
            .filter((trade) => {
              const record = trade as Record<string, unknown>;
              const id = record.id ?? record.tradeId ?? record.trade_id;
              const key = id == null
                ? `${record.timestamp ?? record.time ?? record.createdAt ?? ""}:${record.price ?? ""}:${record.quantity ?? record.qty ?? ""}:${record.side ?? record.direction ?? ""}`
                : String(id);
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .slice(0, 100);
        });
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [pair, market]);

  return { recentTrades: trades, recentTradesLoading: isLoading };
}
