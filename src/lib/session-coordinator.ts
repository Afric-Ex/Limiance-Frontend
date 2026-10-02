"use client";

import { clearSensitiveClientArtifacts } from "./pii-policy";

export type SessionLogoutReason = "manual" | "unauthorized" | "expired" | "account-switch" | "cross-tab";
export type SessionEvent = { type: "logout"; generation: number; reason: SessionLogoutReason };
export type SessionListener = (event: SessionEvent) => void;

export interface SessionCoordinator {
  subscribe(listener: SessionListener): () => void;
  getGeneration(): number;
  logout(reason?: SessionLogoutReason): void;
}

const CHANNEL_NAME = "limiance-session-events";
const STORAGE_EVENT_KEY = "limiance-session-event";

class BrowserSessionCoordinator implements SessionCoordinator {
  private generation = 0;
  private listeners = new Set<SessionListener>();
  private channel: BroadcastChannel | null = null;
  private initialized = false;

  private ensureInitialized() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.addEventListener("message", (event: MessageEvent<SessionEvent>) => {
        this.receive(event.data);
      });
    }
    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_EVENT_KEY || !event.newValue) return;
      try {
        this.receive(JSON.parse(event.newValue) as SessionEvent);
      } catch {
        // Ignore malformed cross-tab control messages.
      }
    });
  }

  private receive(event: SessionEvent) {
    if (!event || event.type !== "logout" || event.generation <= this.generation) return;
    this.generation = event.generation;
    clearSensitiveClientArtifacts();
    this.listeners.forEach((listener) => listener({ ...event, reason: "cross-tab" }));
  }

  subscribe(listener: SessionListener): () => void {
    this.ensureInitialized();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getGeneration(): number {
    this.ensureInitialized();
    return this.generation;
  }

  logout(reason: SessionLogoutReason = "manual") {
    this.ensureInitialized();
    this.generation += 1;
    const event: SessionEvent = { type: "logout", generation: this.generation, reason };
    clearSensitiveClientArtifacts();
    this.channel?.postMessage(event);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_EVENT_KEY, JSON.stringify(event));
        window.localStorage.removeItem(STORAGE_EVENT_KEY);
      } catch {
        // BroadcastChannel remains available when storage is blocked.
      }
    }
    this.listeners.forEach((listener) => listener(event));
  }
}

export const sessionCoordinator: SessionCoordinator = new BrowserSessionCoordinator();
