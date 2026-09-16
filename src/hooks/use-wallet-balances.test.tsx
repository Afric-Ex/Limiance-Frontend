import { renderHook } from "@testing-library/react";
import { useWalletBalances } from "./use-wallet-balances";
import { usePortfolioWs } from "./use-portfolio-ws";

vi.mock("./use-portfolio-ws", () => ({
  usePortfolioWs: vi.fn(),
}));

describe("useWalletBalances", () => {
  const mockUsePortfolioWs = vi.mocked(usePortfolioWs);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMock = (overrides: Partial<ReturnType<typeof usePortfolioWs>> = {}) => {
    mockUsePortfolioWs.mockReturnValue({
      balances: {},
      isLoading: false,
      isConnected: true,
      isAllocationsLoading: false,
      coins: [],
      allocations: null,
      marginAccount: null,
      futuresPositions: [],
      refreshBalances: vi.fn(),
      ...overrides,
    });
  };

  it("returns loading and disconnected initially", () => {
    setupMock({ isLoading: true, isConnected: false, balances: {} });

    const { result } = renderHook(() => useWalletBalances());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.funding).toBeNull();
    expect(result.current.trading).toBeNull();
  });

  it("derives funding balance from balances.funding", () => {
    setupMock({
      balances: {
        funding: { inUsd: "1234.56", inBtc: "0.01842", inNgn: "1000000", pnl: "0", pnlPercentage: "0" },
        total: { inUsd: "5000", inBtc: "0.0745", inNgn: "4000000", pnl: "10", pnlPercentage: "0.2" },
      },
      isLoading: false,
      isConnected: true,
    });

    const { result } = renderHook(() => useWalletBalances());

    expect(result.current.funding).toEqual({
      inUsd: "1234.56",
      inBtc: "0.01842000",
    });
  });

  it("derives trading balance as total - funding", () => {
    setupMock({
      balances: {
        funding: { inUsd: "1000", inBtc: "0.015", inNgn: "1000000", pnl: "0", pnlPercentage: "0" },
        total: { inUsd: "5000", inBtc: "0.075", inNgn: "5000000", pnl: "10", pnlPercentage: "0.2" },
      },
      isLoading: false,
      isConnected: true,
    });

    const { result } = renderHook(() => useWalletBalances());

    expect(result.current.trading).toEqual({
      inUsd: "4000.00",
      inBtc: "0.06000000",
    });
  });

  it("clamps trading balance to zero when funding exceeds total", () => {
    setupMock({
      balances: {
        funding: { inUsd: "6000", inBtc: "0.09", inNgn: "1000000", pnl: "0", pnlPercentage: "0" },
        total: { inUsd: "5000", inBtc: "0.075", inNgn: "5000000", pnl: "10", pnlPercentage: "0.2" },
      },
      isLoading: false,
      isConnected: true,
    });

    const { result } = renderHook(() => useWalletBalances());

    expect(result.current.trading).toEqual({
      inUsd: "0.00",
      inBtc: "0.00000000",
    });
  });

  it("returns null for funding when balances.funding is missing", () => {
    setupMock({
      balances: {
        total: { inUsd: "5000", inBtc: "0.075", inNgn: "5000000", pnl: "10", pnlPercentage: "0.2" },
      },
      isLoading: false,
      isConnected: true,
    });

    const { result } = renderHook(() => useWalletBalances());

    expect(result.current.funding).toBeNull();
    expect(result.current.trading).toBeNull();
  });

  it("returns null for trading when total is missing", () => {
    setupMock({
      balances: {
        funding: { inUsd: "1000", inBtc: "0.015", inNgn: "1000000", pnl: "0", pnlPercentage: "0" },
      },
      isLoading: false,
      isConnected: true,
    });

    const { result } = renderHook(() => useWalletBalances());

    expect(result.current.trading).toBeNull();
  });

  it("handles NaN values gracefully", () => {
    setupMock({
      balances: {
        funding: { inUsd: "invalid", inBtc: "also-invalid", inNgn: "0", pnl: "0", pnlPercentage: "0" },
        total: { inUsd: "5000", inBtc: "0.075", inNgn: "5000000", pnl: "10", pnlPercentage: "0.2" },
      },
      isLoading: false,
      isConnected: true,
    });

    const { result } = renderHook(() => useWalletBalances());

    expect(result.current.funding).toEqual({
      inUsd: "0.00",
      inBtc: "0.00000000",
    });
    expect(result.current.trading).toEqual({
      inUsd: "5000.00",
      inBtc: "0.07500000",
    });
  });

  it("reflects WebSocket connection state", () => {
    setupMock({ isConnected: false, isLoading: false, balances: {} });

    const { result, rerender } = renderHook(() => useWalletBalances());

    expect(result.current.isConnected).toBe(false);

    setupMock({ isConnected: true, isLoading: false, balances: {} });
    rerender();

    expect(result.current.isConnected).toBe(true);
  });
});