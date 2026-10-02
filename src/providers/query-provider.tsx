"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode, useState } from "react";
import { useEffect } from "react";
import { sessionCoordinator } from "@/src/lib/session-coordinator";
import { useAuthStore } from "@/src/stores/auth-store";
import { useUserStore } from "@/src/stores/user-store";
import { clearP2PUserActions } from "@/src/lib/p2p-user-actions";
import { wsClient } from "@/src/lib/websocket-client";

function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: () => false,
            // Pages remounting on navigation used to refetch everything they
            // displayed, because a 0 staleTime marks cached data stale the
            // instant a component subscribes. That turned every route change
            // into a burst of duplicate requests for data the app had just
            // fetched. Individual queries that need fresher data raise this
            // (see use-infinite-list, use-candle-feed) rather than lowering it.
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // Don't hold cancelled/obsolete requests open once the screen that
            // asked for them is gone.
            refetchOnReconnect: false,
          },
        },
      })
  );
  useEffect(() => sessionCoordinator.subscribe(() => {
    useAuthStore.getState().reset();
    useUserStore.getState().reset();
    clearP2PUserActions();
    queryClient.clear();
    wsClient.disconnect();
  }), [queryClient]);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export default QueryProvider;
