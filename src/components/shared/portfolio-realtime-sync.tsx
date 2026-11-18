"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { wsClient } from "@/src/lib/websocket-client";
import { useUserStore } from "@/src/stores/user-store";
import { refreshFinancialData } from "@/src/lib/refresh-financial-data";
import { useUserOrderUpdates } from "@/src/hooks/use-user-order-updates";

/**
 * PortfolioRealtimeSync – keeps balances and history reactive to server pushes.
 *
 * The backend pushes a `balance_update` frame whenever money moves (deposit,
 * trade settlement, conversion, internal/external transfer). Without a global
 * listener the UI only reflects those changes after a manual reload. We refresh
 * every currently-mounted balance surface (and the history/wallet lists) in
 * response. Frames are coalesced because one operation can emit several of them.
 */
const REFRESH_DEBOUNCE_MS = 400;

export function PortfolioRealtimeSync() {
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();

  // Live order executions are handled app-wide so resting limit fills also
  // update balances/orders when the user has navigated away from the trade page.
  useUserOrderUpdates(Boolean(user));

  useEffect(() => {
    if (!user) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = wsClient.subscribe("balance_update", null, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        refreshFinancialData(queryClient);
      }, REFRESH_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [user, queryClient]);

  return null;
}
