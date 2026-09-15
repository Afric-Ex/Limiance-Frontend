import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { queryResults } from "@/src/test/react-query-mock";
import { useUserStore } from "@/src/stores/user-store";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const mocks = vi.hoisted(() => ({
  fetchSupportedTokens: vi.fn(() => Promise.resolve({ data: [] })),
}));

vi.mock("@/src/services/asset", () => ({
  asset: { fetchSupportedTokens: mocks.fetchSupportedTokens },
  assetKeys: {
    supportedTokensKey: (q: string) => ["assets", "supported-tokens", q],
  },
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

import { SupportedListingsDropdown } from "./supported-pairs-dropdown";

const tokensKey = JSON.stringify(["assets", "supported-tokens", "all"]);

const tokens = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    image: "/btc.png",
    contractAddress: "",
    blockchain: "bitcoin",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    image: "/eth.png",
    contractAddress: "0x",
    blockchain: "ethereum",
  },
  { name: "Solana", symbol: "SOL", image: "/sol.png", contractAddress: "", blockchain: "solana" },
];

describe("SupportedListingsDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults[tokensKey] = { data: tokens, isLoading: false };
    useUserStore.setState({ selectedCoinsHistory: [""] });
  });

  const renderOpen = (overrides = {}) => {
    const setSelectedCoin = vi.fn();
    const utils = renderWithProviders(
      <SupportedListingsDropdown
        selectedCoin={{ name: "", symbol: "", image: "", contractAddress: "" }}
        setSelectedCoin={setSelectedCoin}
        {...overrides}
      />
    );
    fireEvent.click(screen.getByAltText("arrow"));
    return { setSelectedCoin, utils };
  };

  it("renders the selected coin once chosen", () => {
    renderWithProviders(
      <SupportedListingsDropdown
        selectedCoin={{ name: "Bitcoin", symbol: "BTC", image: "/btc.png", contractAddress: "" }}
        setSelectedCoin={vi.fn()}
      />
    );
    expect(screen.getByText("BTC")).toBeInTheDocument();
  });

  it("lists the supported tokens when the popover is open", () => {
    const { setSelectedCoin } = renderOpen();
    expect(mocks.fetchSupportedTokens).toHaveBeenCalledWith({ limit: 200 });
    fireEvent.click(screen.getByText("ETH"));
    expect(setSelectedCoin).toHaveBeenCalledWith({
      name: "Ethereum",
      symbol: "ETH",
      image: "/eth.png",
      contractAddress: "0x",
      blockchain: "ethereum",
    });
  });

  it("filters the coin list by search query", () => {
    renderOpen();
    expect(screen.getByText("SOL")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Search"), {
      target: { value: "SOL" },
    });
    expect(screen.getAllByText("SOL").length).toBeGreaterThan(0);
    expect(screen.queryByText("ETH")).not.toBeInTheDocument();
  });

  it("shows the coin history chips when present", () => {
    useUserStore.setState({ selectedCoinsHistory: ["BTC", "ETH"] });
    renderOpen();
    expect(screen.getByText("BTC")).toBeInTheDocument();
  });
});