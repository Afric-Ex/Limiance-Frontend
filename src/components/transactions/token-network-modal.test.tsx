import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { queryResults } from "@/src/test/react-query-mock";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const { asset } = vi.hoisted(() => ({
  asset: {
    fetchSupportedTokens: vi.fn(() => Promise.resolve({ data: [] })),
    fetchSupportedChains: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

vi.mock("@/src/services/asset", () => ({
  asset,
  assetKeys: {
    supportedTokensKey: (q: string) => ["assets", "supported-tokens", q],
    supportedChainsKey: (q: string) => ["assets", "supported-chains", q],
  },
}));

import { TokenNetworkModal } from "./token-network-modal";

const tokensKey = JSON.stringify(["assets", "supported-tokens", "all"]);
const chainsKey = JSON.stringify(["assets", "supported-chains", ""]);

const tokens = [
  { name: "Bitcoin", symbol: "BTC", image: "", contractAddress: "", blockchain: "bitcoin" },
  { name: "Ethereum", symbol: "ETH", image: "", contractAddress: "0x", blockchain: "ethereum" },
  { name: "Tether", symbol: "USDT", image: "", contractAddress: "0x", blockchain: "ethereum" },
  { name: "Ripple", symbol: "XRP", image: "", contractAddress: "", blockchain: "xrp" },
];

const chains = [
  { name: "Bitcoin", symbol: "BTC", blockchain: "bitcoin", standard: "Bitcoin" },
  { name: "Ethereum", symbol: "ERC20", blockchain: "ethereum", standard: "ERC20" },
  { name: "XRP Ledger", symbol: "XRP", blockchain: "xrp", standard: "XRP" },
];

describe("TokenNetworkModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults[tokensKey] = { data: tokens, isLoading: false };
    queryResults[chainsKey] = { data: chains, isLoading: false };
  });

  it("renders the coin list from the supported tokens", () => {
    renderWithProviders(
      <TokenNetworkModal opened={true} onClose={vi.fn()} onSelect={vi.fn()} />
    );
    expect(screen.getByText("Select Coin")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search coin name or symbol…")).toBeInTheDocument();
    expect(asset.fetchSupportedTokens).toHaveBeenCalledWith({ limit: 200 });
    expect(asset.fetchSupportedChains).toHaveBeenCalledWith({ limit: 100 });
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
  });

  it("removes tokens and chains on unsupported networks", () => {
    renderWithProviders(
      <TokenNetworkModal opened={true} onClose={vi.fn()} onSelect={vi.fn()} />
    );
    expect(screen.queryByText("XRP")).not.toBeInTheDocument();
    expect(screen.queryByText("Ripple")).not.toBeInTheDocument();
  });

  it("filters coins by search", () => {
    renderWithProviders(
      <TokenNetworkModal opened={true} onClose={vi.fn()} onSelect={vi.fn()} />
    );
    fireEvent.change(screen.getByPlaceholderText("Search coin name or symbol…"), {
      target: { value: "ETH" },
    });
    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.queryByText("BTC")).not.toBeInTheDocument();
  });

  it("renders the networks view after selecting a coin and calls onSelect", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(
      <TokenNetworkModal opened={true} onClose={onClose} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByText("BTC"));
    expect(screen.getByText("Select Network")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Bitcoin")[0]);
    expect(onSelect).toHaveBeenCalledTimes(1);
    const [coin, network] = onSelect.mock.calls[0];
    expect(coin.symbol).toBe("BTC");
    expect(network.symbol).toBe("BTC");
    expect(onClose).toHaveBeenCalled();
  });

  it("filters networks by search", () => {
    renderWithProviders(
      <TokenNetworkModal opened={true} onClose={vi.fn()} onSelect={vi.fn()} />
    );
    fireEvent.click(screen.getByText("ETH"));
    fireEvent.change(screen.getByPlaceholderText("Search network…"), {
      target: { value: "trx" },
    });
    expect(screen.getByText("No networks found")).toBeInTheDocument();
  });

  it("renders the coin view when a coin is selected and the back arrow is used", () => {
    renderWithProviders(
      <TokenNetworkModal opened={true} onClose={vi.fn()} onSelect={vi.fn()} />
    );
    fireEvent.click(screen.getByText("ETH"));
    expect(screen.getByText("Select Network")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Select Network"));
    expect(screen.getByText("Select Coin")).toBeInTheDocument();
  });

  it("shows the no coins found empty state", () => {
    queryResults[tokensKey] = { data: [], isLoading: false };
    renderWithProviders(
      <TokenNetworkModal opened={true} onClose={vi.fn()} onSelect={vi.fn()} />
    );
    expect(screen.getByText("No coins found")).toBeInTheDocument();
  });
});