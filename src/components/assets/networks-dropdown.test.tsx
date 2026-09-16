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

const allChainsKey = JSON.stringify(["assets", "supported-chains", ""]);
const solChaKey = JSON.stringify(["assets", "supported-chains", "sol"]);

describe("NetworksDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults[allChainsKey] = { data: chains, isLoading: false };
  });

  it("shows the selected network name and the warning note when opened", async () => {
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
      await screen.findByText(/Ensure you select a network that matches/)
    ).toBeInTheDocument();
  });

  it("selects a network from the list", async () => {
    const setSelectedNetwork = vi.fn();
    renderWithProviders(
      <NetworksDropdown
        selectedNetwork={{ name: "Bitcoin", symbol: "BTC", blockchain: "bitcoin" }}
        setSelectedNetwork={setSelectedNetwork}
      />
    );
    fireEvent.click(screen.getByAltText("arrow"));
    await screen.findByText("SOL");
    fireEvent.click(screen.getByText("SOL"));
    expect(setSelectedNetwork).toHaveBeenCalledWith({
      name: "Solana",
      symbol: "SOL",
      blockchain: "solana",
    });
  });

  it("refetches the supported networks when the search query changes", async () => {
    queryResults[solChaKey] = { data: [chains[2]], isLoading: false };
    renderWithProviders(
      <NetworksDropdown
        selectedNetwork={{ name: "Bitcoin", symbol: "BTC", blockchain: "bitcoin" }}
        setSelectedNetwork={vi.fn()}
      />
    );
    fireEvent.click(screen.getByAltText("arrow"));
    const input = await screen.findByRole("textbox");
    fireEvent.change(input, { target: { value: "sol" } });
    await waitFor(() =>
      expect(mocks.fetchSupportedChains).toHaveBeenCalledWith({ q: "sol" })
    );
    expect(await screen.findByText("SOL")).toBeInTheDocument();
    expect(screen.queryByText("ERC20")).not.toBeInTheDocument();
  });
});