import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";

vi.mock("@/src/hooks/use-portfolio-ws", () => ({
  usePortfolioWs: vi.fn(),
}));

const mocks = vi.hoisted(() => ({
  modalsOpen: vi.fn(),
}));

vi.mock("@mantine/modals", () => ({
  modals: { open: mocks.modalsOpen },
}));

import { CoinAssets } from "./coin-assets";

const mockUsePortfolioWs = vi.mocked(usePortfolioWs);

const portfolio = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    image: "/btc.png",
    spotBalance: "0.5",
    fundingBalance: "0.2",
    futuresBalance: "0",
    lockedBalance: "0",
    marginBalance: "0",
    currencyPrice: "60000",
  },
];

function mockWs(coins: any[] = [], isLoading = false) {
  mockUsePortfolioWs.mockReturnValue({
    coins,
    isLoading,
    isAllocationsLoading: false,
    allocations: null,
    marginAccount: null,
    futuresPositions: [],
    balances: {},
    isConnected: false,
    refreshBalances: () => {},
  } as any);
}

describe("CoinAssets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWs(portfolio);
  });

  it("renders coin rows with aggregated balances", () => {
    renderWithProviders(<CoinAssets />);
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("0.7")).toBeInTheDocument();
    expect(screen.getByText("$60000")).toBeInTheDocument();
  });

  it("opens the convert modal", () => {
    renderWithProviders(<CoinAssets />);
    fireEvent.click(screen.getByText("Convert"));
    expect(mocks.modalsOpen).toHaveBeenCalled();
  });

  it("shows the inline loader while loading", () => {
    mockWs([], true);
    renderWithProviders(<CoinAssets />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});