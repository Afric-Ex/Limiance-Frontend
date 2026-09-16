import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { api } from "@/src/lib/axios";
import { useMarketFeed } from "./use-market-feed";

vi.mock("cookies-next", () => ({
  getCookie: vi.fn(() => "mock-token"),
}));

vi.mock("@/src/mocks", () => ({
  MOCK_MODE: { marketFeed: false },
}));

vi.mock("@/src/mocks/data/market-data", () => ({
  MOCK_PRICES: {
    "BTC/USDT": {
      price: 67000,
      change24h: 100,
      changePercent24h: 1.5,
      high24h: 68000,
      low24h: 66000,
      volume24h: 1000,
    },
  },
}));

vi.mock("@/src/lib/axios", () => ({
  api: {
    get: vi.fn(),
  },
}));

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState = FakeWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = FakeWebSocket.CLOSED;
    this.trigger("close");
  });
  private handlers: Record<string, Function[]> = {};

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(type: string, cb: Function) {
    (this.handlers[type] ||= []).push(cb);
  }

  removeEventListener(type: string, cb: Function) {
    this.handlers[type] = (this.handlers[type] || []).filter((h) => h !== cb);
  }

  trigger(type: string, event?: any) {
    if (type === "message") {
      this.onmessage?.(event || { data: "{}" });
    } else if (type === "close") {
      this.onclose?.();
    } else if (type === "error") {
      this.onerror?.();
    }
    for (const h of this.handlers[type] || []) {
      h(event || { data: "{}" });
    }
  }
}

describe("useMarketFeed", () => {
  let instances: FakeWebSocket[];

  beforeEach(() => {
    vi.clearAllMocks();
    instances = [];
    vi.stubGlobal("WebSocket", class extends FakeWebSocket {
      constructor(url: string) {
        super(url);
        instances.push(this);
      }
    });
    Object.defineProperty(window, "location", {
      value: { protocol: "https:", host: "exchange.com" },
      writable: true,
    });
  });

  afterEach(() => {
    instances.forEach((instance) => instance.onclose?.());
    instances = [];
    vi.unstubAllGlobals();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useMarketFeed("BTC/USDT"));

    expect(result.current.price).toBeNull();
    expect(result.current.change24h).toBeNull();
    expect(result.current.changePercent24h).toBeNull();
    expect(result.current.high24h).toBeNull();
    expect(result.current.low24h).toBeNull();
    expect(result.current.volume24h).toBeNull();
    expect(result.current.fundingRate).toBeNull();
    expect(result.current.nextFundingTime).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastUpdated).toBeNull();
    expect(result.current.markets).toEqual([]);
  });

  it("uses wss protocol on https", () => {
    renderHook(() => useMarketFeed("BTC/USDT"));

    expect(instances.length).toBe(1);
    expect(instances[0].url).toContain("wss://");
  });

  it("connects and requests market data on open", () => {
    const { result } = renderHook(() => useMarketFeed("BTC/USDT"));

    act(() => {
      instances[0].readyState = FakeWebSocket.OPEN;
      instances[0].onopen?.();
    });

    expect(result.current.isConnected).toBe(true);
    expect(instances[0].send).toHaveBeenCalledWith(
      JSON.stringify({ type: "get_market_data", data: { pair: "BTC-USDT" } }),
    );
  });

  it("updates market data on message", async () => {
    const { result } = renderHook(() => useMarketFeed("BTC/USDT"));

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({
          type: "spot_margin_markets",
          data: {
            data: [
              {
                symbol: "BTC/USDT",
                last_price: 67123.45,
                price_change: 123.45,
                percent_change: 1.89,
                high_24h: 67890,
                low_24h: 65430,
                volume: 28456,
                funding_rate: 0.01,
                next_funding_time: "2026-01-01T00:00:00Z",
              },
            ],
          },
        }),
      });
    });

    expect(result.current.price).toBe(67123.45);
    expect(result.current.change24h).toBe(123.45);
    expect(result.current.changePercent24h).toBe(1.89);
    expect(result.current.high24h).toBe(67890);
    expect(result.current.low24h).toBe(65430);
    expect(result.current.volume24h).toBe(28456);
    expect(result.current.fundingRate).toBe(0.01);
    expect(result.current.nextFundingTime).toBe("2026-01-01T00:00:00Z");
    expect(result.current.isConnected).toBe(true);
    expect(result.current.markets).toHaveLength(1);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it("uses camelCase fallback properties on message", async () => {
    const { result } = renderHook(() => useMarketFeed("BTC/USDT"));

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({
          type: "spot_margin_markets",
          data: {
            data: [
              {
                pair: "BTC/USDT",
                lastPrice: 60000,
                priceChange: 100,
                priceChangePercent: 2,
                highPrice: 61000,
                lowPrice: 59000,
                change24h: 100,
              },
            ],
          },
        }),
      });
    });

    expect(result.current.price).toBe(60000);
    expect(result.current.changePercent24h).toBe(2);
    expect(result.current.high24h).toBe(61000);
    expect(result.current.low24h).toBe(59000);
  });

  it("ignores messages with wrong type", async () => {
    const { result } = renderHook(() => useMarketFeed("BTC/USDT"));

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({
          type: "other_type",
          data: { data: [{ symbol: "BTC/USDT", last_price: 123 }] },
        }),
      });
    });

    expect(result.current.price).toBeNull();
    expect(result.current.markets).toEqual([]);
  });

  it("handles malformed messages gracefully", async () => {
    const { result } = renderHook(() => useMarketFeed("BTC/USDT"));

    await act(async () => {
      instances[0].onmessage?.({ data: "not json" });
    });

    expect(result.current.isConnected).toBe(false);
  });

  it("handles empty markets array on message", async () => {
    const { result } = renderHook(() => useMarketFeed("BTC/USDT"));

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({ type: "spot_margin_markets", data: { data: [] } }),
      });
    });

    expect(result.current.price).toBeNull();
    expect(result.current.markets).toEqual([]);
    expect(result.current.isConnected).toBe(true);
  });

  it("falls back to HTTP when ws closes", async () => {
        api.get.mockResolvedValue({
      data: {
        data: [
          {
            symbol: "BTC/USDT",
            last_price: 67234.5,
            price_change: 1245.3,
            percent_change: 1.89,
            high_24h: 67890,
            low_24h: 65430,
            volume: 28456,
          },
        ],
      },
    });

    const { result } = renderHook(() => useMarketFeed("BTC/USDT"));

    act(() => {
      instances[0].onclose?.();
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("trading/24_hours_movers", {
        params: { limit: 100 },
      });
    });

    expect(result.current.price).toBe(67234.5);
    expect(result.current.change24h).toBe(1245.3);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.markets).toHaveLength(1);
  });

  it("keeps previous price when HTTP returns no match", async () => {
        api.get.mockResolvedValue({ data: { data: [{ symbol: "ETH/USDT", last_price: 3500 }] } });

    const { result } = renderHook(() => useMarketFeed("BTC/USDT"));

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({
          type: "spot_margin_markets",
          data: { data: [{ symbol: "BTC/USDT", last_price: 99000 }] },
        }),
      });
    });

    expect(result.current.price).toBe(99000);

    act(() => {
      instances[0].onclose?.();
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    expect(result.current.price).toBe(99000);
  });

  it("handles HTTP fallback failure gracefully", async () => {
        api.get.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useMarketFeed("BTC/USDT"));

    act(() => {
      instances[0].onclose?.();
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    expect(result.current.price).toBeNull();
  });

  it("does not close the shared socket on unmount", () => {
    const { unmount } = renderHook(() => useMarketFeed("BTC/USDT"));

    unmount();

    expect(instances[0].close).not.toHaveBeenCalled();
  });
});