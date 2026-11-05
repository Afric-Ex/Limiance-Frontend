"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsClient } from "@/src/lib/websocket-client";
import { ORDER_HISTORY_QUERY_KEY } from "@/src/hooks/use-order-history";

/**
 * Live order lifecycle stream (WEBSOCKET_MESSAGES.md §7.1).
 *
 * The backend pushes `user_order_update` on every fill, partial fill,
 * cancellation and rejection. Subscribing here keeps open orders, positions and
 * both history tables in sync without polling; the doc explicitly recommends
 * opening this channel before placing orders so immediate fills are not missed.
 */
export function useUserOrderUpdates(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = wsClient.subscribe(
      "user_order_update",
      { type: "get_user_order_updates", data: {} },
      () => {
        queryClient.invalidateQueries({ queryKey: ["open-orders"] });
        queryClient.invalidateQueries({ queryKey: ["futures-open-orders"] });
        queryClient.invalidateQueries({ queryKey: ["margin-open-orders"] });
        queryClient.invalidateQueries({ queryKey: [ORDER_HISTORY_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: ["order-history"] });
        queryClient.invalidateQueries({ queryKey: ["trade-history"] });
        queryClient.invalidateQueries({ queryKey: ["margin-account"] });
        queryClient.invalidateQueries({ queryKey: ["margin-positions"] });
      }
    );

    return unsubscribe;
  }, [enabled, queryClient]);
}
