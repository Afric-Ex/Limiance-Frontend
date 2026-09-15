import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { asset } from "../services/asset";
import { tradingService } from "../services/trading";
import { useP2P } from "./use-p2p";

const formCache = new Map<string, any>();
vi.mock("@mantine/form", () => ({
  useForm: vi.fn((config: any) => {
    const makeForm = () => {
      const values: Record<string, any> = { ...config.initialValues };
      return {
        values,
        setFieldValue: vi.fn((field: string, value: any) => {
          values[field] = value;
        }),
        getInputProps: vi.fn(() => ({})),
        reset: vi.fn(() => Object.assign(values, config.initialValues)),
        onSubmit: vi.fn((fn: any) => fn),
      };
    };
    const key = JSON.stringify(config.initialValues);
    if (!formCache.has(key)) formCache.set(key, makeForm());
    return formCache.get(key);
  }),
}));

vi.mock("../services/asset", () => ({
  asset: {
    fetchPortfolio: vi.fn(),
  },
  assetKeys: {
    portfolio: () => ["portfolio"],
  },
}));

vi.mock("../services/trading", () => ({
  tradingService: {
    listedTokens: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useP2P", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    formCache.clear();
    asset.fetchPortfolio.mockResolvedValue({ data: [] });
    tradingService.listedTokens.mockResolvedValue({ data: [] });
  });

  it("returns forms with initial values", () => {
    const { result } = renderHook(() => useP2P(), {
      wrapper: createWrapper(),
    });

    expect(result.current.postAdsForm.values).toBeDefined();
    expect(result.current.addPaymentMethodForm.values).toBeDefined();
    expect(result.current.postAdsForm.values.type).toBe("Buy");
    expect(result.current.addPaymentMethodForm.values.accountNumber).toBe("");
  });

  it("provides default fallback tokens when no tokens returned", async () => {
    const { result } = renderHook(() => useP2P(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingTokens).toBe(false);
    });

    expect(result.current.listedTokens).toHaveLength(5);
    expect(result.current.listedTokens.map((t: any) => t.symbol)).toEqual([
      "USDT",
      "BTC",
      "ETH",
      "NGN",
      "USD",
    ]);
  });

  it("maps listed tokens to objects", async () => {
        tradingService.listedTokens.mockResolvedValue({
      data: [
        { symbol: "BTC", name: "Bitcoin", logo: "btc.png" },
        { symbol: "ETH", name: "Ethereum", logo: "eth.png" },
      ],
    });

    const { result } = renderHook(() => useP2P(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.listedTokens.length).toBe(2);
    });

    expect(result.current.listedTokens[0].symbol).toBe("BTC");
    expect(result.current.listedTokens[0].name).toBe("Bitcoin");
  });

  it("falls back to name for tokens without symbol", async () => {
    tradingService.listedTokens.mockResolvedValue({
      data: [{ symbol: "BTC" }, { name: "NoSymbol" }],
    });

    const { result } = renderHook(() => useP2P(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.listedTokens.length).toBe(2);
    });

    expect(result.current.listedTokens[0].symbol).toBe("BTC");
    expect(result.current.listedTokens[1].symbol).toBe("NoSymbol");
  });

  it("availableBalance returns 0 when asset not in portfolio", async () => {
        asset.fetchPortfolio.mockResolvedValue({
      data: [{ symbol: "BTC", fundingBalance: "1.5" }],
    });

    const { result } = renderHook(() => useP2P(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.listedTokens.length).toBe(5);
    });

    expect(result.current.availableBalance).toBe("0");
  });

  it("availableBalance finds balance for selected asset", async () => {
        asset.fetchPortfolio.mockResolvedValue({
      data: [
        { symbol: "BTC", fundingBalance: "1.5" },
        { symbol: "USDT", fundingBalance: "100" },
      ],
    });

    const { result } = renderHook(() => useP2P(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.postAdsForm.values.asset = "BTC";
    });

    await waitFor(() => {
      expect(result.current.availableBalance).toBe("1.5");
    });
  });

  it("handles empty portfolio gracefully", async () => {
        asset.fetchPortfolio.mockResolvedValue({ data: null });

    const { result } = renderHook(() => useP2P(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.availableBalance).toBe("0");
    });
  });
});