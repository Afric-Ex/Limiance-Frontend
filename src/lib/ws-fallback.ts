import { wsClient } from "@/src/lib/websocket-client";

/**
 * Shared rule for every "WebSocket first, HTTP second" feature:
 * HTTP is only used when the socket is genuinely unavailable, never because
 * the socket is still connecting or is simply a little slow.
 *
 *  - connecting      -> wait (this helper's grace period)
 *  - connected       -> never use HTTP (the socket is delivering)
 *  - failed / dropped -> use HTTP
 */
export const WS_CONNECT_GRACE_MS = 4000;

/**
 * Runs `fallback` only if the socket is still not connected after the grace
 * period. Returns a cancel function for the effect cleanup.
 */
export function fallbackIfSocketStaysDown(
  fallback: () => void,
  graceMs: number = WS_CONNECT_GRACE_MS
): () => void {
  if (wsClient.getIsConnected()) return () => undefined;
  const timer = setTimeout(() => {
    if (!wsClient.getIsConnected()) fallback();
  }, graceMs);
  return () => clearTimeout(timer);
}
