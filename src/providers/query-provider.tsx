"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode, useState } from "react";

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
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export default QueryProvider;
