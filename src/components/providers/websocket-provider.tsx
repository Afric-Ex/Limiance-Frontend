"use client";

import { useEffect } from "react";
import { wsClient } from "@/src/lib/websocket-client";

/**
 * WebSocketProvider - maintains the WebSocket connection throughout the app lifecycle.
 * This ensures the connection is always ready for real-time data, even when no
 * specific subscriptions are active.
 */
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Enable keepalive mode on mount
    wsClient.setMaintainConnection(true);
    console.log("[WebSocketProvider] Enabled keepalive mode");

    return () => {
      // Disable on unmount (if this provider unmounts)
      wsClient.setMaintainConnection(false);
    };
  }, []);

  return <>{children}</>;
}
