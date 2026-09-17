"use client";

import { handleLogout } from "./handle-logout";

/** Check if JWT token has expired based on its 'exp' claim */
function isTokenExpired(token: string): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    if (decoded.exp && typeof decoded.exp === "number") {
      const isExpired = Date.now() >= decoded.exp * 1000;
      if (isExpired) {
        console.warn(
          `[WebSocketClient] Token expired at ${new Date(decoded.exp * 1000).toLocaleString()}`
        );
      }
      return isExpired;
    }
  } catch {
    // If parsing fails, proceed without assuming expired
  }
  return false;
}

import { getCookie } from "cookies-next";

/** Mirror axios.ts: localStorage first (raw token), then cookies-next/document.cookie (URL-decoded). */
function getAuthToken(): string {
  if (typeof localStorage !== "undefined") {
    const lsToken = localStorage.getItem("auth-token");
    if (lsToken && lsToken !== "undefined" && lsToken !== "null") return lsToken;
  }
  try {
    const nextCookie = getCookie("auth-token");
    if (nextCookie && typeof nextCookie === "string" && nextCookie !== "undefined" && nextCookie !== "null") {
      return decodeURIComponent(nextCookie);
    }
  } catch {}
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
  const cookieToken = match ? decodeURIComponent(match[1]) : "";
  return cookieToken && cookieToken !== "undefined" && cookieToken !== "null" ? cookieToken : "";
}

export type WsMessageHandler = (data: any, rawMessage: any) => void;
export type WsStatusHandler = (connected: boolean) => void;

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
  private subscriptions = new Map<string, Subscription>();
  private statusHandlers = new Set<WsStatusHandler>();
  private intentionalClose = false;

  constructor() {
    if (typeof window !== "undefined") {
      // Reconnect immediately when browser comes back online or tab becomes visible
      window.addEventListener("online", () => this.handleNetworkRestore());
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.handleNetworkRestore();
        }
      });
    }
  }

  private handleNetworkRestore() {
    if (!this.isConnected && !this.isConnecting && this.subscriptions.size > 0) {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      this.retryCount = 0;
      this.connect();
    }
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

  private notifyStatus(status: boolean) {
    this.isConnected = status;
    this.statusHandlers.forEach((handler) => {
      try {
        handler(status);
      } catch (err) {
        console.error("[WebSocketClient] Error in status handler:", err);
      }
    });
  }

  public connect() {
    if (typeof window === "undefined") return;
    if (this.isConnected || this.isConnecting) return;

    const explicitUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!explicitUrl) {
      console.warn("[WebSocketClient] NEXT_PUBLIC_WS_URL is not set");
      return;
    }

    const isHttps = window.location.protocol === "https:";
    const safeUrl = isHttps ? explicitUrl.replace(/^ws:\/\//, "wss://") : explicitUrl;
    const token = getAuthToken();
    if (token && isTokenExpired(token)) {
      console.warn("[WebSocketClient] Current auth token is expired. Triggering session refresh/logout.");
      handleLogout();
      return;
    }

    this.isConnecting = true;
    this.intentionalClose = false;

    try {
      const url = token ? `${safeUrl}?auth-token=${token}` : safeUrl;
      const socket = new WebSocket(url);
      this.ws = socket;

      socket.onopen = () => {
        this.isConnecting = false;
        this.retryCount = 0;
        this.notifyStatus(true);

        // Re-subscribe all active topics on connection / reconnection
        this.resubscribeAll();
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const type = msg.type;
          if (!type) return;

          // Dispatch to matching topic subscribers
          const sub = this.subscriptions.get(type);
          if (sub) {
            sub.handlers.forEach((handler) => {
              try {
                handler(msg.data, msg);
              } catch (handlerErr) {
                console.error(`[WebSocketClient] Handler error for ${type}:`, handlerErr);
              }
            });
          }
        } catch {
          // Ignore unparseable frames
        }
      };

      socket.onclose = () => {
        this.isConnecting = false;
        this.notifyStatus(false);
        this.ws = null;

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
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
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
        console.error("[WebSocketClient] Send error:", err);
        return false;
      }
    }
    return false;
  }

  private resubscribeAll() {
    this.subscriptions.forEach((sub) => {
      if (sub.sendPayload) {
        this.send(sub.sendPayload);
      }
    });
  }

  /**
   * Subscribes to a message type. Ensures the single socket is connected,
   * sends the initial subscription command if provided, and returns an unsubscribe cleanup function.
   */
  public subscribe(
    topic: string,
    sendPayload: object | null,
    handler: WsMessageHandler
  ): () => void {
    let sub = this.subscriptions.get(topic);
    if (!sub) {
      sub = {
        topic,
        sendPayload,
        handlers: new Set(),
      };
      this.subscriptions.set(topic, sub);
    } else if (sendPayload) {
      sub.sendPayload = sendPayload;
    }

    sub.handlers.add(handler);

    // If socket is open, send payload immediately; if not connected, connect()
    if (this.isConnected && sendPayload) {
      this.send(sendPayload);
    } else if (!this.isConnected && !this.isConnecting) {
      this.connect();
    }

    return () => {
      const currentSub = this.subscriptions.get(topic);
      if (currentSub) {
        currentSub.handlers.delete(handler);
        if (currentSub.handlers.size === 0) {
          this.subscriptions.delete(topic);
        }
      }
    };
  }

  /**
   * Force update payload for an existing topic subscription (e.g. switching trading pair)
   */
  public updateSubscriptionPayload(topic: string, newPayload: object) {
    const sub = this.subscriptions.get(topic);
    if (sub) {
      sub.sendPayload = newPayload;
      if (this.isConnected) {
        this.send(newPayload);
      }
    }
  }

  public disconnect() {
    this.intentionalClose = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus(false);
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
