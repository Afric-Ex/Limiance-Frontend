import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { asset } from "../services/asset";
import { useDeposit } from "./use-deposit";

vi.mock("../services/asset", () => ({
  asset: {
    fetchSupportedTokens: vi.fn().mockResolvedValue({ data: [] }),
    allWallets: vi.fn().mockResolvedValue({ data: [] }),
    generateWallet: vi.fn().mockResolvedValue({ data: { address: "0xGenerated", id: "gen-1" } }),
    initiateDeposit: vi.fn(),
  },
  assetKeys: {
    supportedTokensKey: (q: string) => ["supported-tokens", q],
    allWallets: () => ["all-wallets"],
    generateWalletKeys: (n: string, t: number) => ["generate-wallet", n, t],
  },
}));

vi.mock("../stores/user-store", () => ({
  useUserStore: vi.fn(() => ({
    id: "user-1",
  })),
}));

vi.mock("../utils/network-mapper", () => ({
  mapSymbolToWalletChain: vi.fn((s: string) => {
    if (!s) return "";
    const map: Record<string, string> = { BTC: "bitcoin", ETH: "evm", SOL: "solana", BSC: "bsc" };
    return map[s] || s.toLowerCase();
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("useDeposit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns initial state correctly", () => {
    const { result } = renderHook(() => useDeposit(), {
      wrapper: createWrapper(),
    });

    expect(result.current.selectedCoin.symbol).toBe("");
    expect(result.current.selectedNetwork.symbol).toBe("");
    expect(result.current.walletAddress).toBeUndefined();
    expect(result.current.walletLoading).toBe(true);
    expect(result.current.walletError).toBe(false);
    expect(typeof result.current.setSelectedCoin).toBe("function");
    expect(typeof result.current.setSelectedNetwork).toBe("function");
  });

  it("setSelectedCoin updates selected coin", () => {
    const { result } = renderHook(() => useDeposit(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedCoin({
        name: "Ethereum",
        image: "eth.png",
        symbol: "ETH",
        contractAddress: "",
      });
    });

    expect(result.current.selectedCoin.symbol).toBe("ETH");
  });

  it("setSelectedNetwork updates selected network", () => {
    const { result } = renderHook(() => useDeposit(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedNetwork({
        name: "Ethereum",
        symbol: "ETH",
        blockchain: "Ethereum",
      });
    });

    expect(result.current.selectedNetwork.symbol).toBe("ETH");
  });

  it("setWalletType updates wallet type", () => {
    const { result } = renderHook(() => useDeposit(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setWalletType(1);
    });

    expect(result.current.walletType).toBe(1);
  });

  it("uses existing wallet when available", async () => {
        asset.allWallets.mockResolvedValue({
      data: [{ id: "w1", chain: "evm", address: "0xExistingWallet" }],
    });

    const { result } = renderHook(() => useDeposit(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedCoin({
        name: "Ethereum",
        image: "eth.png",
        symbol: "ETH",
        contractAddress: "",
      });
      result.current.setSelectedNetwork({
        name: "Ethereum",
        symbol: "ETH",
        blockchain: "Ethereum",
      });
    });

    await waitFor(() => {
      expect(result.current.walletAddress).toBe("0xExistingWallet");
    });
  });

  it("generates wallet when no existing wallet found", async () => {
        asset.allWallets.mockResolvedValue({ data: [] });
    asset.generateWallet.mockResolvedValue({
      data: { address: "0xNewWallet", id: "gen-1" },
    });

    const { result } = renderHook(() => useDeposit(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedCoin({
        name: "Solana",
        image: "sol.png",
        symbol: "SOL",
        contractAddress: "",
      });
      result.current.setSelectedNetwork({
        name: "Solana",
        symbol: "SOL",
        blockchain: "Solana",
      });
    });

    await waitFor(() => {
      expect(asset.generateWallet).toHaveBeenCalled();
    });
  });

  it("sets walletError when generation fails", async () => {
        asset.allWallets.mockResolvedValue({ data: [] });
    asset.generateWallet.mockRejectedValue(new Error("Generation failed"));

    const { result } = renderHook(() => useDeposit(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedCoin({
        name: "Solana",
        image: "sol.png",
        symbol: "SOL",
        contractAddress: "",
      });
      result.current.setSelectedNetwork({
        name: "Solana",
        symbol: "SOL",
        blockchain: "Solana",
      });
    });

    await waitFor(() => {
      expect(result.current.walletError).toBe(true);
    });
  });

  it("does not call initiateDeposit when no wallet", async () => {
        asset.allWallets.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useDeposit(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.walletAddress).toBeUndefined();
    });

    expect(asset.initiateDeposit).not.toHaveBeenCalled();
  });

  it("walletLoading is true when allWallets is loading", () => {
        asset.allWallets.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useDeposit(), {
      wrapper: createWrapper(),
    });

    expect(result.current.walletLoading).toBe(true);
  });
});
