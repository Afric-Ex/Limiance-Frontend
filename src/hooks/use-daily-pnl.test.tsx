import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { useDailyPnl } from "./use-daily-pnl";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";
import { tradingService } from "@/src/services/trading";

vi.mock("@/src/hooks/use-portfolio-ws", () => ({
  usePortfolioWs: vi.fn(),
}));

vi.mock("@/src/services/trading", () => ({
  tradingService: { gainersLosers: vi.fn() },
}));

const mockUsePortfolioWs = vi.mocked(usePortfolioWs);
const mockGainersLosers = vi.mocked(tradingService.gainersLosers);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const coin = (overrides: Partial<Record<string, unknown>> = {}) => ({
  userId: "u1",
  symbol: "BTC",
  name: "Bitcoin",
  currencyPrice: "100",
  image: "",
  spotBalance: "0",
  futuresBalance: "0",
  fundingBalance: "0",
  marginBalance: "0",
  lockedBalance: "0",
  pnlBalance: "0",
  ...overrides,
});

const moversResponse = (gainers: unknown[] = [], losers: unknown[] = []) => ({
  data: { gainers, losers },
});

describe("useDailyPnl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    mockUsePortfolioWs.mockReturnValue({ coins: [], isLoading: false });
    mockGainersLosers.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns zero P&L and carries the portfolio loading state when there are no coins", async () => {
    mockUsePortfolioWs.mockReturnValue({ coins: [], isLoading: true });

    const { result } = renderHook(() => useDailyPnl(), { wrapper: createWrapper() });

    expect(result.current.pnl).toBe(0);
    expect(result.current.pnlPct).toBe(0);
    expect(result.current.isLoading).toBe(true);
  });

  it("computes P&L from backend movers for the overall portfolio", async () => {
    mockUsePortfolioWs.mockReturnValue({
      coins: [
        coin({ spotBalance: "2", marginBalance: "1", futuresBalance: "1", fundingBalance: "1" }),
      ],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue({
      data: [{ pair: "BTC/USDT", latest_price: "100", price_24h_ago: "50" }],
    });

    const { result } = renderHook(() => useDailyPnl(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.pnl).not.toBe(0));
    expect(result.current.pnl).toBe(250);
    expect(result.current.pnlPct).toBe(100);
  });

  it("only counts the spot wallet when account is spot", async () => {
    mockUsePortfolioWs.mockReturnValue({
      coins: [
        coin({ spotBalance: "2", marginBalance: "10", futuresBalance: "10", fundingBalance: "10" }),
      ],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue({
      data: [{ pair: "BTC/USDT", latest_price: "100", price_24h_ago: "50" }],
    });

    const { result } = renderHook(() => useDailyPnl("spot"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.pnl).not.toBe(0));
    expect(result.current.pnl).toBe(100);
  });

  it("only counts the margin wallet when account is margin", async () => {
    mockUsePortfolioWs.mockReturnValue({
      coins: [
        coin({ spotBalance: "2", marginBalance: "10", futuresBalance: "50", fundingBalance: "10" }),
      ],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue({
      data: [{ pair: "BTC/USDT", latest_price: "100", price_24h_ago: "50" }],
    });

    const { result } = renderHook(() => useDailyPnl("margin"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.pnl).not.toBe(0));
    expect(result.current.pnl).toBe(500);
  });

  it("only counts the futures wallet when account is futures", async () => {
    mockUsePortfolioWs.mockReturnValue({
      coins: [
        coin({ spotBalance: "2", marginBalance: "10", futuresBalance: "50", fundingBalance: "10" }),
      ],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue({
      data: [{ pair: "BTC/USDT", latest_price: "100", price_24h_ago: "50" }],
    });

    const { result } = renderHook(() => useDailyPnl("futures"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.pnl).not.toBe(0));
    expect(result.current.pnl).toBe(2500);
  });

  it("treats stablecoins as a 1:1 USD peg with no movement", async () => {
    mockUsePortfolioWs.mockReturnValue({
      coins: [coin({ symbol: "USDT", spotBalance: "3" })],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue({
      data: [{ pair: "USDT/USDT", latest_price: "1.2", price_24h_ago: "0.8" }],
    });

    const { result } = renderHook(() => useDailyPnl(), { wrapper: createWrapper() });

    await waitFor(() => expect(mockGainersLosers).toHaveBeenCalled());
    expect(result.current.pnl).toBe(0);
    expect(result.current.pnlPct).toBe(0);
  });

  it("uses the ws currencyPrice neutrally when there is no 24h reference", async () => {
    mockUsePortfolioWs.mockReturnValue({
      coins: [coin({ symbol: "ADA", spotBalance: "4", currencyPrice: "25" })],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useDailyPnl(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.pnl).toBe(0));
    expect(result.current.pnlPct).toBe(0);
  });

  it("falls back to CoinGecko prices when the backend movers list is empty", async () => {
    const jsonMock = vi.fn().mockResolvedValue({
      bitcoin: { usd: 100, usd_24h_change: 100 },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: jsonMock })
    );

    mockUsePortfolioWs.mockReturnValue({
      coins: [coin({ spotBalance: "2" })],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useDailyPnl(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.pnl).not.toBe(0));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("api.coingecko.com/api/v3/simple/price")
    );
    expect(result.current.pnl).toBe(100);
    expect(result.current.pnlPct).toBe(100);

    vi.unstubAllGlobals();
  });

  it("does not call CoinGecko when there are no non-stable portfolio symbols", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    mockUsePortfolioWs.mockReturnValue({
      coins: [coin({ symbol: "USDT", spotBalance: "2" })],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useDailyPnl(), { wrapper: createWrapper() });

    await waitFor(() => expect(mockGainersLosers).toHaveBeenCalled());
    expect(result.current.pnl).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("keeps pnl at zero when the CoinGecko request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    mockUsePortfolioWs.mockReturnValue({
      coins: [coin({ spotBalance: "2" })],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useDailyPnl(), { wrapper: createWrapper() });

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(result.current.pnl).toBe(0);

    vi.unstubAllGlobals();
  });

  it("keeps pnl at zero when the CoinGecko request rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    mockUsePortfolioWs.mockReturnValue({
      coins: [coin({ spotBalance: "2" })],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useDailyPnl(), { wrapper: createWrapper() });

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(result.current.pnl).toBe(0);

    vi.unstubAllGlobals();
  });

  it("dedupes symbols and filters stables before querying CoinGecko", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );

    mockUsePortfolioWs.mockReturnValue({
      coins: [
        coin({ symbol: "btc", spotBalance: "1" }),
        coin({ symbol: "BTC", spotBalance: "1" }),
        coin({ symbol: "USDC", spotBalance: "5" }),
        coin({ symbol: "SOL", spotBalance: "2" }),
      ],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useDailyPnl(), { wrapper: createWrapper() });

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("ids=bitcoin,solana");

    vi.unstubAllGlobals();
    expect(result.current.pnl).toBe(0);
  });

  it("parses gainers/losers wrappers and computes from percent_change_24h when no prev price", async () => {
    mockUsePortfolioWs.mockReturnValue({
      coins: [coin({ spotBalance: "2" })],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue(
      moversResponse(
        [{ pair: "BTC-USDT", latest_price: "120", percent_change_24h: "20" }],
        []
      )
    );

    const { result } = renderHook(() => useDailyPnl(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.pnl).not.toBe(0));
    expect(result.current.pnl).toBe(40);
  });

  it("handles undefined movers data as an empty backend payload", async () => {
    mockUsePortfolioWs.mockReturnValue({
      coins: [coin({ symbol: "BTC", spotBalance: "2", currencyPrice: "0" })],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue(undefined as never);

    const { result } = renderHook(() => useDailyPnl(), { wrapper: createWrapper() });

    await waitFor(() => expect(mockGainersLosers).toHaveBeenCalled());
    expect(result.current.pnl).toBe(0);
  });

  it("ignores malformed mover entries that carry no symbol or price", async () => {
    mockUsePortfolioWs.mockReturnValue({
      coins: [coin({ spotBalance: "2" })],
      isLoading: false,
    });
    mockGainersLosers.mockResolvedValue({
      data: [{ pair: "", latest_price: "100", price_24h_ago: "50" }],
    });

    const { result } = renderHook(() => useDailyPnl(), { wrapper: createWrapper() });

    await waitFor(() => expect(mockGainersLosers).toHaveBeenCalled());
    expect(result.current.pnl).toBe(0);
  });
});