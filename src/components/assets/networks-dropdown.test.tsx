import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { queryResults } from "@/src/test/react-query-mock";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const mocks = vi.hoisted(() => ({
  fetchSupportedChains: vi.fn(() => Promise.resolve({ data: [] })),
}));

vi.mock("@/src/services/asset", () => ({
  asset: { fetchSupportedChains: mocks.fetchSupportedChains },
  assetKeys: {
    supportedChainsKey: (q: string) => ["assets", "supported-chains", q],
  },
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

import { NetworksDropdown } from "./networks-dropdown";

const chains = [
  { name: "Bitcoin", symbol: "BTC", blockchain: "bitcoin", standard: "Bitcoin" },
  { name: "Ethereum", symbol: "ERC20", blockchain: "ethereum", standard: "ERC20" },
  { name: "Solana", symbol: "SOL", blockchain: "solana", standard: "SOL" },
];

describe("NetworksDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults[JSON.stringify(["assets", "supported-chains", ""])] = {
      data: chains,
      isLoading: false,
    };
  });

  it("shows the selected network name and the warning note when opened", () => {
    const setSelectedNetwork = vi.fn();
    renderWithProviders(
      <NetworksDropdown
        selectedNetwork={{ name: "Ethereum", symbol: "ERC20", blockchain: "ethereum" }}
        setSelectedNetwork={setSelectedNetwork}
      />
    );
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
    fireEvent.click(screen.getByAltText("arrow"));
    expect(
      screen.getByText(/Ensure you select a network that matches/)
    ).toBeInTheDocument();
  });

  it("selects a network from the list", () => {
    const setSelectedNetwork = vi.fn();
    renderWithProviders(
      <NetworksDropdown
        selectedNetwork={{ name: "Bitcoin", symbol: "BTC", blockchain: "bitcoin" }}
        setSelectedNetwork={setSelectedNetwork}
      />
    );
    fireEvent.click(screen.getByAltText("arrow"));
    fireEvent.click(screen.getByText("SOL"));
    expect(setSelectedNetwork).toHaveBeenCalledWith({
      name: "Solana",
      symbol: "SOL",
      blockchain: "solana",
    });
  });

  it("filters networks by the search query", () => {
    renderWithProviders(
      <NetworksDropdown
        selectedNetwork={{ name: "Bitcoin", symbol: "BTC", blockchain: "bitcoin" }}
        setSelectedNetwork={vi.fn()}
      />
    );
    fireEvent.click(screen.getByAltText("arrow"));
    fireEvent.change(screen.getByPlaceholderText("Search"), {
      target: { value: "sol" },
    });
    expect(screen.queryByText("ERC20")).not.toBeInTheDocument();
    expect(screen.getByText("SOL")).toBeInTheDocument();
  });
});