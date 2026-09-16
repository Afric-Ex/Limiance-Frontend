import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { getCookie } from "cookies-next";
import { api } from "@/src/lib/axios";
import { usePortfolioWs } from "./use-portfolio-ws";

vi.mock("cookies-next", () => ({
  getCookie: vi.fn(() => "mock-token"),
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
  close = vi.fn();
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

const mockCoins = [
  {
    userId: "u1",
    symbol: "BTC",
    name: "Bitcoin",
    currencyPrice: "67000",
    image: "btc.png",
    spotBalance: "1",
    futuresBalance: "0",
    fundingBalance: "2",
    marginBalance: "0",
    lockedBalance: "0",
    pnlBalance: "0",
  },
  {
    userId: "u1",
    symbol: "ETH",
    name: "Ethereum",
    currencyPrice: "3500",
    image: "eth.png",
    spotBalance: "10",
    futuresBalance: "0",
    fundingBalance: "0",
    marginBalance: "0",
    lockedBalance: "0",
    pnlBalance: "0",
  },
];

describe("usePortfolioWs", () => {
  let instances: FakeWebSocket[];

  beforeEach(() => {
    vi.clearAllMocks();
    getCookie.mockImplementation(() => "mock-token");
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
    instances.forEach((instance) => instance.onclose?.());
    instances = [];
    vi.unstubAllGlobals();
  });

  it("returns initial state", () => {
    const { result } = renderHook(() => usePortfolioWs());

    expect(result.current.coins).toEqual([]);
    expect(result.current.allocations).toBeNull();
    expect(result.current.marginAccount).toBeNull();
    expect(result.current.futuresPositions).toEqual([]);
    expect(result.current.balances).toEqual({});
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(typeof result.current.refreshBalances).toBe("function");
  });

  it("connects via websocket", () => {
    renderHook(() => usePortfolioWs());

    expect(instances.length).toBe(1);
    expect(instances[0].url).toContain("?auth-token=mock-token");
  });

  it("sets isConnected true on open and requests data", () => {
    const { result } = renderHook(() => usePortfolioWs());

    act(() => {
      instances[0].readyState = FakeWebSocket.OPEN;
      instances[0].onopen?.();
    });

    expect(result.current.isConnected).toBe(true);
    expect(instances[0].send).toHaveBeenCalledWith(
      JSON.stringify({ type: "get_portfolio", data: { page: "1", limit: "100", query: "" } }),
    );
  });

  it("updates coins and derives balances on portfolio message", async () => {
    const { result } = renderHook(() => usePortfolioWs());

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({ type: "portfolio", data: { data: mockCoins } }),
      });
    });

    expect(result.current.coins).toEqual(mockCoins);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.balances.spot.inUsd).toBe("102000.00000000");
  });

  it("updates total balance on portfolio_balance message", async () => {
    const { result } = renderHook(() => usePortfolioWs());

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({
          type: "portfolio_balance",
          data: { data: { inUsd: "5000", inBtc: "0.07", inNgn: "8000000", pnl: "10", pnlPercentage: "0.2" } },
        }),
      });
    });

    expect(result.current.balances.total).toEqual({
      inUsd: "5000",
      inBtc: "0.07",
      inNgn: "8000000",
      pnl: "10",
      pnlPercentage: "0.2",
    });
  });

  it("updates allocations", async () => {
    const { result } = renderHook(() => usePortfolioWs());

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({
          type: "portfolio_balance_allocations",
          data: {
            data: {
              totalValue: "10000",
              allocations: [{ symbol: "BTC", name: "Bitcoin", balance: "1", value: "67000", percentage: "67" }],
            },
          },
        }),
      });
    });

    expect(result.current.allocations).toEqual({
      totalValue: "10000",
      allocations: [{ symbol: "BTC", name: "Bitcoin", balance: "1", value: "67000", percentage: "67" }],
    });
    expect(result.current.isAllocationsLoading).toBe(false);
  });

  it("updates margin account", async () => {
    const { result } = renderHook(() => usePortfolioWs());

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({
          type: "margin_account",
          data: {
            data: { assets: [{ asset: "BTC", free: "1" }], equity_usd: "67000", mode: "cross" },
          },
        }),
      });
    });

    expect(result.current.marginAccount).toEqual({
      assets: [{ asset: "BTC", free: "1" }],
      equity_usd: "67000",
      mode: "cross",
    });
  });

  it("updates futures positions", async () => {
    const { result } = renderHook(() => usePortfolioWs());

    await act(async () => {
      instances[0].onmessage?.({
        data: JSON.stringify({
          type: "futures_positions",
          data: { data: [{ symbol: "BTC-USD", size: "0.5" }] },
        }),
      });
    });

    expect(result.current.futuresPositions).toEqual([{ symbol: "BTC-USD", size: "0.5" }]);
  });

  it("ignores malformed messages", async () => {
    const { result } = renderHook(() => usePortfolioWs());

    await act(async () => {
      instances[0].onmessage?.({ data: "not-json" });
    });

    expect(result.current.coins).toEqual([]);
  });

  it("falls back to HTTP on close", async () => {
    vi.resetModules();
    const { usePortfolioWs: FreshHook } = await import("./use-portfolio-ws");
    const { api: freshApi } = await import("@/src/lib/axios");

    freshApi.get.mockImplementation((url: string) => {
      const map: Record<string, any> = {
        "wallet/portfolio": { data: { data: mockCoins } },
        "wallet/balance_allocations": { data: { data: { totalValue: "1000", allocations: [] } } },
        "trading/margin/account": { data: { data: { assets: [] } } },
        "trading/futures/positions": { data: { data: [] } },
        "wallet/balance": { data: { data: { inUsd: "100", inBtc: "0.01", inNgn: "1", pnl: "0", pnlPercentage: "0" } } },
      };
      return Promise.resolve(map[url] || { data: {} });
    });

    const { result } = renderHook(() => FreshHook());

    act(() => {
      instances[0].onclose?.();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.coins).toEqual(mockCoins);
  });

  it("goes straight to HTTP when no auth token", async () => {
    getCookie.mockReturnValue(undefined);

    api.get.mockResolvedValue({ data: { data: [] } });

    const { result } = renderHook(() => usePortfolioWs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("handles HTTP fallback failure", async () => {
    vi.resetModules();
    const { usePortfolioWs: FreshHook } = await import("./use-portfolio-ws");
    const { api: freshApi } = await import("@/src/lib/axios");
    const { getCookie: freshGetCookie } = await import("cookies-next");
    freshGetCookie.mockReturnValue(undefined);
    freshApi.get.mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => FreshHook());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.coins).toEqual([]);
  });

  it("refreshBalances sends ws requests when connected", async () => {
    const { result } = renderHook(() => usePortfolioWs());

    act(() => {
      instances[0].onopen?.();
      instances[0].readyState = FakeWebSocket.OPEN;
    });

    act(() => {
      result.current.refreshBalances();
    });

    expect(instances[0].send).toHaveBeenCalledWith(
      JSON.stringify({ type: "get_portfolio_balance_allocations", data: {} }),
    );
  });

  it("does not close the shared socket on unmount", () => {
    const { unmount } = renderHook(() => usePortfolioWs());

    unmount();

    expect(instances[0].close).not.toHaveBeenCalled();
  });
});