"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsClient } from "@/src/lib/websocket-client";
import { ORDER_HISTORY_QUERY_KEY } from "@/src/hooks/use-order-history";
import { useNotificationSound } from "@/src/hooks/use-notification-sound";
import { refreshActivePortfolioTopics } from "@/src/lib/portfolio-store";
import {
  applyOrderFrame,
  type OrderFrameResult,
} from "@/src/lib/trades/order-event-sync";

/** One execution can emit `order_filled` + `user_order_update` + balance pushes. */
const REFRESH_DEBOUNCE_MS = 400;
/** Both fill frames can describe the same order; announce it only once. */
const NOTIFICATION_DEDUPE_MS = 30_000;

/**
 * Live order lifecycle stream (WEBSOCKET_MESSAGES.md §7.1).
 *
 * The backend pushes `user_order_update` on every fill/partial/cancel, and the
 * deployed backend also emits `order_filled` with the execution details. Both
 * are merged into the Open Orders cache (see order-event-sync), so the lists
 * update without refetching. The documented `get_user_order_updates`
 * subscription is still sent first because the matching engine only registers
 * the connection for execution reports after it — missing it drops immediate
 * fills. Orders/history/balances are invalidated once per burst afterwards.
 */
export function useUserOrderUpdates(enabled = true) {
  const queryClient = useQueryClient();
  const playSound = useNotificationSound();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifiedOrders = useRef(new Map<string, number>());

  useEffect(() => {
    if (!enabled) return;

    const notifyFill = (result: OrderFrameResult) => {
      if (result.kind !== "filled") return;

      const key =
        result.orderId ??
        result.clientOrderId ??
        `${result.symbol ?? ""}|${result.side ?? ""}|${result.price ?? ""}`;
      if (!key) return;

      const now = Date.now();
      for (const [id, at] of notifiedOrders.current) {
        if (now - at > NOTIFICATION_DEDUPE_MS) notifiedOrders.current.delete(id);
      }
      if (notifiedOrders.current.has(key)) return;
      notifiedOrders.current.set(key, now);

      // No toast here: bursts of fills stacked top-center toasts until they
      // covered the screen and blocked the UI. The sound cue is enough.
      playSound({
        id: key,
        source: "order-ws",
        type:
          result.market === "futures"
            ? "futures"
            : result.market
              ? "spot"
              : undefined,
        data: { symbol: result.symbol ?? "", market_type: result.market },
      });
    };

    const handleFrame = (_data: any, raw: any) => {
      const result = applyOrderFrame(queryClient, raw);
      if (!result) return;
      notifyFill(result);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        queryClient.invalidateQueries({ queryKey: [ORDER_HISTORY_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: ["order-history"] });
        queryClient.invalidateQueries({ queryKey: ["trade-history"] });
        queryClient.invalidateQueries({ queryKey: ["margin-order-history"] });
        queryClient.invalidateQueries({ queryKey: ["spot-recent-trades"] });
        queryClient.invalidateQueries({ queryKey: ["margin-account"] });
        queryClient.invalidateQueries({ queryKey: ["margin-positions"] });
        refreshActivePortfolioTopics();
      }, REFRESH_DEBOUNCE_MS);
    };

    // Keep the documented registration channel…
    const unsubscribeUpdates = wsClient.subscribe(
      "user_order_update",
      { type: "get_user_order_updates", data: {} },
      handleFrame
    );
    // …and listen for the execution topic the backend actually emits.
    const unsubscribeFilled = wsClient.subscribe("order_filled", null, handleFrame);
    // Defensive: cover aliases (partial fills / updates / position events).
    const unsubscribeAny = wsClient.onAnyMessage(handleFrame);

    return () => {
      unsubscribeUpdates();
      unsubscribeFilled();
      unsubscribeAny();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, playSound, queryClient]);
}
