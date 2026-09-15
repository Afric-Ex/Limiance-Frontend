import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { api } from "@/src/lib/axios";
import { useOrderBook } from "./use-order-book";

vi.mock("cookies-next", () => ({
  getCookie: vi.fn(() => "mock-token"),
}));

vi.mock("@/src/mocks", () => ({
  MOCK_MODE: { orderBook: false },
}));

vi.mock("@/src/mocks/data/market-data", () => ({
  MOCK_PRICES: { "BTC/USDT": { price: 67000 } },
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

describe("useOrderBook", () => {
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
      value: { protocol: "http:", host: "localhost:3000" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => useOrderBook("BTC/USDT"));

    expect(result.current.buyOrders).toEqual([]);
    expect(result.current.sellOrders).toEqual([]);
    expect(result.current.buyPercentage).toBeNull();
    expect(result.current.sellPercentage).toBeNull();
    expect(result.current.totalBuyVolume).toBeNull();
    expect(result.current.totalSellVolume).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastUpdated).toBeNull();
  });

  it("connects via websocket and sets isConnected on open", async () => {
    const { result } = renderHook(() => useOrderBook("BTC/USDT"));

    expect(instances.length).toBe(1);
    expect(instances[0].url).toContain("ws://");

    act(() => {
      instances[0].onopen?.();
    });

    expect(result.current.isConnected).toBe(true);
    expect(instances[0].send).toHaveBeenCalled();
  });

  it("updates order book data on message", async () => {
    const { result } = renderHook(() => useOrderBook("BTC/USDT"));

    act(() => {
      instances[0].onopen?.();
    });

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({
          type: "order_book_update",
          data: {
            orderBook: {
              buyOrders: [{ price: 67000, quantity: 1 }],
              sellOrders: [{ price: 67100, quantity: 2 }],
              buyPercentage: 33.3,
              sellPercentage: 66.7,
              totalBuyVolume: 1,
              totalSellVolume: 2,
            },
          },
        }),
      });
    });

    expect(result.current.buyOrders).toEqual([{ price: 67000, quantity: 1 }]);
    expect(result.current.sellOrders).toEqual([{ price: 67100, quantity: 2 }]);
    expect(result.current.buyPercentage).toBe(33.3);
    expect(result.current.sellPercentage).toBe(66.7);
    expect(result.current.totalBuyVolume).toBe(1);
    expect(result.current.totalSellVolume).toBe(2);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it("ignores messages with wrong type", async () => {
    const { result } = renderHook(() => useOrderBook("BTC/USDT"));

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({ type: "something_else", data: { orderBook: { buyOrders: [{ price: 1, quantity: 1 }] } } }),
      });
    });

    expect(result.current.buyOrders).toEqual([]);
  });

  it("ignores malformed JSON messages", async () => {
    const { result } = renderHook(() => useOrderBook("BTC/USDT"));

    await act(async () => {
      instances[0].onmessage?.({ data: "{invalid json" });
    });

    expect(result.current.buyOrders).toEqual([]);
    expect(result.current.isConnected).toBe(false);
  });

  it("treats null buyOrders as empty arrays", async () => {
    const { result } = renderHook(() => useOrderBook("BTC/USDT"));

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({
          type: "order_book_update",
          data: { orderBook: { buyOrders: null, sellOrders: null } },
        }),
      });
    });

    expect(result.current.buyOrders).toEqual([]);
    expect(result.current.sellOrders).toEqual([]);
  });

  it("falls back to HTTP when ws closes", async () => {
        api.get.mockResolvedValue({
      data: {
        data: {
          bids: [
            { price: "67000", quantity: "1" },
            ["67100", "2"],
          ],
          asks: [
            { price: "67200", quantity: "3" },
            ["67300", "4"],
          ],
        },
      },
    });

    const { result } = renderHook(() => useOrderBook("BTC/USDT"));

    act(() => {
      instances[0].onclose?.();
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("trading/spot/orderbook", {
        params: { pair: "BTC-USDT" },
      });
    });

    expect(result.current.buyOrders).toEqual([
      { price: 67000, quantity: 1 },
      { price: 67100, quantity: 2 },
    ]);
    expect(result.current.sellOrders).toEqual([
      { price: 67200, quantity: 3 },
      { price: 67300, quantity: 4 },
    ]);
    expect(result.current.totalBuyVolume).toBe(3);
    expect(result.current.totalSellVolume).toBe(7);
    expect(result.current.buyPercentage).toBe(30);
    expect(result.current.sellPercentage).toBe(70);
    expect(result.current.isConnected).toBe(false);
  });

  it("handles HTTP fallback failure gracefully", async () => {
        api.get.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useOrderBook("BTC/USDT"));

    act(() => {
      instances[0].onclose?.();
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    expect(result.current.buyOrders).toEqual([]);
    expect(result.current.isConnected).toBe(false);
  });

  it("sends normalized pair on open", async () => {
    renderHook(() => useOrderBook("ETH/USDT"));

    act(() => {
      instances[0].onopen?.();
    });

    expect(instances[0].send).toHaveBeenCalledWith(
      JSON.stringify({ type: "get_spot_order_books", data: { pair: "ETH-USDT" } }),
    );
  });

  it("closes websocket on unmount", () => {
    const { unmount } = renderHook(() => useOrderBook("BTC/USDT"));

    unmount();

    expect(instances[0].close).toHaveBeenCalled();
  });
});