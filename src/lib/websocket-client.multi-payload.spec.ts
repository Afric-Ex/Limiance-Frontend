import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeSocket {
  static instances: FakeSocket[] = [];
  static OPEN = 1;
  readyState = 0;
  sent: string[] = [];
  onopen: null | (() => void) = null;
  onmessage: null | ((e: { data: string }) => void) = null;
  onclose: null | (() => void) = null;
  onerror: null | (() => void) = null;
  constructor(public url: string) {
    FakeSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  drop() {
    this.readyState = 3;
    this.onclose?.();
  }
  emit(type: string, data: unknown) {
    this.onmessage?.({ data: JSON.stringify({ type, data }) });
  }
  payloads() {
    return this.sent.map((s) => JSON.parse(s));
  }
  pairs() {
    return this.payloads().map((p) => p.data.pair);
  }
}

async function freshClient() {
  vi.resetModules();
  const mod = await import("./websocket-client");
  return mod.wsClient;
}

describe("WebSocketClient multi-payload subscriptions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeSocket.instances = [];
    process.env.NEXT_PUBLIC_WS_URL = "ws://localhost:9999";
    (globalThis as any).WebSocket = FakeSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("re-sends every distinct payload for one topic after a reconnect", async () => {
    const wsClient = await freshClient();
    const unsubA = wsClient.subscribe(
      "candle",
      { type: "get_spot_candles", data: { pair: "BTC-USDT", interval: "1m" } },
      vi.fn()
    );
    const unsubB = wsClient.subscribe(
      "candle",
      { type: "get_spot_candles", data: { pair: "ETH-USDT", interval: "1m" } },
      vi.fn()
    );

    const first = FakeSocket.instances[0];
    first.open();

    // Both payloads go out on initial connect.
    expect(new Set(first.pairs())).toEqual(new Set(["BTC-USDT", "ETH-USDT"]));

    // Force a real reconnect: drop the socket, let backoff elapse, reopen.
    first.drop();
    const sentBeforeReconnect = first.sent.length;
    await vi.advanceTimersByTimeAsync(3000);
    const second = FakeSocket.instances[1];
    second.open();

    // BOTH payloads re-sent — this is the assertion that fails before the fix.
    expect(sentBeforeReconnect).toBe(2);
    expect(new Set(second.pairs())).toEqual(new Set(["BTC-USDT", "ETH-USDT"]));
    expect(second.sent).toHaveLength(2);

    unsubA();
    unsubB();
  });

  it("collapses identical payloads regardless of key insertion order", async () => {
    const wsClient = await freshClient();
    const h = vi.fn();
    const unsubA = wsClient.subscribe(
      "spot_margin_markets",
      { type: "get_market_data", data: { pair: "BTC-USDT", page: 1 } },
      h
    );
    const unsubB = wsClient.subscribe(
      "spot_margin_markets",
      { data: { page: 1, pair: "BTC-USDT" }, type: "get_market_data" },
      h
    );

    const sock = FakeSocket.instances[0];
    sock.open();
    // Same payload -> one entry -> one frame, despite two subscribe() calls.
    expect(sock.sent).toHaveLength(1);

    unsubA();
    unsubB();
  });

  it("fans one server frame out to every handler under the topic", async () => {
    const wsClient = await freshClient();
    const a = vi.fn();
    const b = vi.fn();
    wsClient.subscribe(
      "candle",
      { type: "get_spot_candles", data: { pair: "BTC-USDT", interval: "1m" } },
      a
    );
    wsClient.subscribe(
      "candle",
      { type: "get_spot_candles", data: { pair: "ETH-USDT", interval: "1m" } },
      b
    );
    const sock = FakeSocket.instances[0];
    sock.open();
    sock.emit("candle", { candles: [{ t: 1, o: 1, h: 1, l: 1, c: 1, v: 1 }] });

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("unsubscribing one payload leaves its siblings intact", async () => {
    const wsClient = await freshClient();
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = wsClient.subscribe(
      "candle",
      { type: "get_spot_candles", data: { pair: "BTC-USDT", interval: "1m" } },
      a
    );
    wsClient.subscribe(
      "candle",
      { type: "get_spot_candles", data: { pair: "ETH-USDT", interval: "1m" } },
      b
    );
    const sock = FakeSocket.instances[0];
    sock.open();

    unsubA();
    sock.emit("candle", { candles: [] });

    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("stops reconnecting once the last payload for a topic is gone", async () => {
    const wsClient = await freshClient();
    const unsubA = wsClient.subscribe(
      "candle",
      { type: "get_spot_candles", data: { pair: "BTC-USDT", interval: "1m" } },
      vi.fn()
    );
    const unsubB = wsClient.subscribe(
      "candle",
      { type: "get_spot_candles", data: { pair: "ETH-USDT", interval: "1m" } },
      vi.fn()
    );
    const sock = FakeSocket.instances[0];
    sock.open();
    expect(sock.sent).toHaveLength(2);

    unsubA();
    unsubB();

    // Topic index and payload map are both fully cleaned up, so a drop must not
    // schedule another reconnect.
    sock.drop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(FakeSocket.instances).toHaveLength(1);
  });
});
