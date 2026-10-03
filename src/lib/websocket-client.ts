"use client";

import { redactDiagnostic } from "./pii-policy";
import { resolveSocketTarget } from "./ws-url";
import { handleLogout } from "./handle-logout";
import { sessionCoordinator } from "./session-coordinator";

export type WsMessageHandler = (data: any, rawMessage: any) => void;
export type WsStatusHandler = (connected: boolean) => void;

/**
 * Grace period before an idle socket is torn down. Navigation unmounts the old
 * page's subscribers and mounts the new page's in the same React commit, so a
 * zero-delay close would thrash the connection on every route change (and burn a
 * handshake round-trip). A short delay lets a same-tick replacement cancel it.
 */
const IDLE_CLOSE_DELAY_MS = 2000;

/**
 * Close codes that mean the server looked at our session and refused it.
 * Reconnecting would produce the same answer forever, so the client stops and
 * lets the session-coordinator/logout path clear state instead.
 */
const AUTH_FAILURE_CODES = new Set([1008, 4401, 4403]);

/**
 * Opt out of the same-origin proxy only. Never a way to re-enable URL tokens.
 *
 * The read below is deliberately a literal `process.env.NEXT_PUBLIC_WS_PROXY`
 * rather than `process.env[PROXY_OPT_OUT_ENV]`: Next.js only inlines
 * `NEXT_PUBLIC_*` values it can see written out verbatim in the client bundle, so
 * a computed lookup would resolve to `undefined` in the browser and the opt-out
 * could never be switched on.
 */
const PROXY_OPT_OUT_ENV = "NEXT_PUBLIC_WS_PROXY";

/**
 * Deterministic JSON serialisation: object keys are sorted recursively so two
 * structurally identical payloads always produce the same string no matter what
 * order the caller built the keys in. JSON.stringify can't be used here — it
 * preserves insertion order, so {a,b} and {b,a} would hash differently.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (typeof (value as { toJSON?: unknown }).toJSON === "function") {
    return stableStringify((value as { toJSON: () => unknown }).toJSON());
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`);
  return `{${entries.join(",")}}`;
}

/** Stable identity for one (topic, payload) pair: callers asking for the same
 *  topic with the same payload share an entry, different payloads get their own. */
function subscriptionKey(topic: string, sendPayload: object | null): string {
  return `${topic}::${stableStringify(sendPayload)}`;
}

interface Subscription {
  topic: string;
  sendPayload?: object | null;
  handlers: Set<WsMessageHandler>;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private retryCount = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscriptions = new Map<string, Subscription>();
  /** topic -> compound keys registered under it. Incoming frames only carry a
   *  topic, so this is what lets us reach handlers across every distinct payload. */
  private topicIndex = new Map<string, Set<string>>();
  private statusHandlers = new Set<WsStatusHandler>();
  private intentionalClose = false;
  private idleCloseTimeout: NodeJS.Timeout | null = null;
  /** Set on auth-rejection close codes to prevent futile reconnect loops. */
  private authFailed = false;

  constructor() {
    if (typeof window !== "undefined") {
      // Reconnect immediately when browser comes back online or tab becomes visible
      window.addEventListener("online", () => this.handleNetworkRestore());
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.handleNetworkRestore();
        }
      });
      // Logout, session expiry, or a logout broadcast from another tab. Reset
      // the auth-failure latch so the next login can open a fresh socket.
      sessionCoordinator.subscribe(() => {
        this.authFailed = false;
        this.disconnect();
      });
    }
  }

  private handleNetworkRestore() {
    if (this.authFailed) return;
    if (!this.isConnected && !this.isConnecting && this.subscriptions.size > 0) {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.retryCount = 0;
      this.connect();
    }
  }

  /**
   * Close the socket once nothing is subscribed any more.
   *
   * Without this the socket stays open for the life of the tab: the last
   * unsubscribe leaves an idle connection that still gets heartbeats and still
   * receives every server push, on pages that no longer display it. Deferred so
   * a route change (unmount old page, mount new page in one commit) reuses the
   * connection instead of reconnecting.
   */
  private scheduleIdleClose() {
    if (this.idleCloseTimeout) return;
    this.idleCloseTimeout = setTimeout(() => {
      this.idleCloseTimeout = null;
      if (this.subscriptions.size > 0) return;
      this.disconnect();
    }, IDLE_CLOSE_DELAY_MS);
  }

  private cancelIdleClose() {
    if (!this.idleCloseTimeout) return;
    clearTimeout(this.idleCloseTimeout);
    this.idleCloseTimeout = null;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public onStatusChange(handler: WsStatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.isConnected);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * Keep the connection alive so idle servers don't drop it (backends commonly
   * terminate sockets that send no frames for ~120s). Also detects dead sockets.
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: "ping" });
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private notifyStatus(status: boolean) {
    this.isConnected = status;
    this.statusHandlers.forEach((handler) => {
      try {
        handler(status);
      } catch (err) {
        console.error("[WebSocketClient] Error in status handler:", redactDiagnostic({ error: err }));
      }
    });
  }

  /**
   * Same-origin WebSocket endpoint, or `null` when nothing is configured.
   *
   * `/ws-proxy` is a Next.js rewrite onto the backend's `/api/v1/ws`, so the
   * handshake is first-party and the browser attaches the session cookie on its
   * own. Going direct (`NEXT_PUBLIC_WS_PROXY=false`) is a deployment escape
   * hatch for hosts that terminate WebSockets outside Next.js — the backend must
   * then authenticate the upgrade from the request cookie itself, because
   * nothing is ever appended to that URL either.
   */
  private resolveSocketUrl(): string | null {
    const useSameOriginProxy = process.env.NEXT_PUBLIC_WS_PROXY !== "false";
    const target = resolveSocketTarget({
      pageProtocol: window.location.protocol,
      host: window.location.host,
      useSameOriginProxy,
      directUrl: process.env.NEXT_PUBLIC_WS_URL,
    });

    if (!target && !useSameOriginProxy) {
      console.warn(
        `[WebSocketClient] ${PROXY_OPT_OUT_ENV}=false but NEXT_PUBLIC_WS_URL is missing or unusable — not connecting`
      );
    }
    return target;
  }

  public connect() {
    if (typeof window === "undefined") return;
    if (this.isConnected || this.isConnecting) return;
    if (this.authFailed) return;
    this.cancelIdleClose();

    const url = this.resolveSocketUrl();
    if (!url) return;

    this.isConnecting = true;
    this.intentionalClose = false;

    try {
      // No credential of any kind is appended: the handshake is a plain
      // same-origin GET, and the session is whatever cookie the browser already
      // holds for this origin. Tokens in a URL leak into proxy logs, browser
      // history and `Sec-WebSocket-Protocol` echoes.
      const socket = new WebSocket(url);
      this.ws = socket;

      socket.onopen = () => {
        this.isConnecting = false;
        this.retryCount = 0;
        this.authFailed = false;
        this.notifyStatus(true);
        this.startHeartbeat();

        // Re-subscribe all active topics on connection / reconnection
        this.resubscribeAll();
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const type = msg.type;
          if (!type) return;

          // Dispatch by topic only — the server never echoes the payload back.
          // Fan out to every distinct payload registered under this topic; each
          // handler already filters the frame down to the pair/interval it asked for.
          const keys = this.topicIndex.get(type);
          if (!keys) return;
          for (const key of Array.from(keys)) {
            const sub = this.subscriptions.get(key);
            if (!sub) continue;
            sub.handlers.forEach((handler) => {
              try {
                handler(msg.data, msg);
              } catch (handlerErr) {
                console.error(
                  `[WebSocketClient] Handler error for ${type}`,
                  redactDiagnostic({ error: handlerErr })
                );
              }
            });
          }
        } catch {
          // Ignore unparseable frames
        }
      };

      socket.onclose = (event) => {
        this.isConnecting = false;
        this.notifyStatus(false);
        this.stopHeartbeat();
        this.ws = null;

        // Server rejected the session. `handleLogout` runs synchronously through
        // the session coordinator (which also closes this socket and clears
        // local state), so the latch is set *after* it — otherwise the
        // coordinator's own reset would immediately re-enable reconnecting.
        if (AUTH_FAILURE_CODES.has(event.code)) {
          console.warn(
            "[WebSocketClient] session rejected (close code " +
              event.code +
              "); stopping reconnection"
          );
          void handleLogout();
          this.authFailed = true;
          return;
        }

        if (!this.intentionalClose && this.subscriptions.size > 0) {
          this.scheduleReconnect();
        }
      };

      socket.onerror = () => {
        if (this.ws) {
          this.ws.close();
        }
      };
    } catch {
      this.isConnecting = false;
      this.notifyStatus(false);
      this.stopHeartbeat();
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.authFailed) return;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

    // Exponential backoff with jitter: 1.5s -> 3s -> 6s -> max 15s
    const baseDelay = Math.min(1500 * Math.pow(1.8, this.retryCount), 15000);
    const jitter = Math.random() * 500;
    const delay = baseDelay + jitter;
    this.retryCount++;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public send(payload: object): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
        return true;
      } catch (err) {
        console.error("[WebSocketClient] Send error:", redactDiagnostic({ error: err }));
        return false;
      }
    }
    return false;
  }

  private resubscribeAll() {
    // subscriptions is keyed by topic+payload, so this walks every distinct
    // payload — a topic with three active payloads re-sends all three frames.
    this.subscriptions.forEach((sub) => {
      if (sub.sendPayload) {
        this.send(sub.sendPayload);
      }
    });
  }

  /**
   * Subscribes to a message type. Ensures the single socket is connected,
   * sends the initial subscription command if provided, and returns an unsubscribe cleanup function.
   *
   * A topic may carry several concurrent subscriptions with different payloads (e.g. two
   * charts on different pairs both on "candle"). Each distinct payload gets its own entry,
   * so a reconnect re-sends all of them rather than only the most recent.
   */
  public subscribe(
    topic: string,
    sendPayload: object | null,
    handler: WsMessageHandler
  ): () => void {
    const key = subscriptionKey(topic, sendPayload);
    let sub = this.subscriptions.get(key);
    const isNewSubscription = !sub;
    if (!sub) {
      sub = {
        topic,
        sendPayload,
        handlers: new Set(),
      };
      this.subscriptions.set(key, sub);
      let keys = this.topicIndex.get(topic);
      if (!keys) {
        keys = new Set();
        this.topicIndex.set(topic, keys);
      }
      keys.add(key);
    }

    sub.handlers.add(handler);

    // Only the 1st handler for a (topic, payload) starts the server stream.
    // Re-sending on every extra handler makes N mounted consumers of one topic
    // cost N frames, and the server answers each one with a full snapshot.
    if (isNewSubscription && this.isConnected && sendPayload) {
      this.send(sendPayload);
    } else if (!this.isConnected && !this.isConnecting) {
      this.connect();
    }

    return () => {
      // Scoped to this compound key: unsubscribing one payload must leave the
      // topic's other payloads (and their handlers) untouched.
      const currentSub = this.subscriptions.get(key);
      if (!currentSub) return;
      currentSub.handlers.delete(handler);
      if (currentSub.handlers.size === 0) {
        this.subscriptions.delete(key);
        const keys = this.topicIndex.get(topic);
        if (keys) {
          keys.delete(key);
          if (keys.size === 0) this.topicIndex.delete(topic);
        }
        // Nothing is listening any more: tear the socket down rather than
        // leaving it open (and pushed to) for the rest of the tab's life.
        if (this.subscriptions.size === 0) this.scheduleIdleClose();
      }
    };
  }

  /**
   * Force update payload for an existing topic subscription (e.g. switching trading pair).
   *
   * NOTE: this is topic-wide — it rewrites the payload of *every* subscription registered
   * under `topic` and sends once. Under the multi-payload model that is ambiguous (which of
   * several payloads should win?), and since the entry key is derived from the payload it
   * can leave a key that no longer matches its stored payload. It has no callers in the
   * codebase today and is untested against the multi-payload model — revisit before use.
   */
  public updateSubscriptionPayload(topic: string, newPayload: object) {
    const keys = this.topicIndex.get(topic);
    if (!keys || keys.size === 0) return;
    keys.forEach((key) => {
      const sub = this.subscriptions.get(key);
      if (sub) sub.sendPayload = newPayload;
    });
    if (this.isConnected) {
      this.send(newPayload);
    }
  }

  public disconnect() {
    this.intentionalClose = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus(false);
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
