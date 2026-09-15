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
  fetchPortfolio: vi.fn(() => Promise.resolve({ data: [] })),
  modalsOpen: vi.fn(),
}));

vi.mock("@/src/services/asset", () => ({
  asset: { fetchPortfolio: mocks.fetchPortfolio },
  assetKeys: {
    portfolio: (uid?: string) => ["portfolio", uid],
    balance: (params?: any) => ["balance", params],
    transactionHistory: (params?: any) => ["transaction-history", params],
    allWallets: (params?: any) => ["all-wallets", params],
  },
}));

vi.mock("@mantine/modals", () => ({
  modals: { open: mocks.modalsOpen },
}));

import { CoinAssets } from "./coin-assets";

const portfolioKey = JSON.stringify(["portfolio", "u1"]);

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

describe("CoinAssets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults[portfolioKey] = { data: portfolio, isLoading: false };
  });

  it("renders coin rows with aggregated balances", () => {
    renderWithProviders(<CoinAssets />);
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("0.7")).toBeInTheDocument();
    expect(screen.getByText("$60000")).toBeInTheDocument();
    expect(mocks.fetchPortfolio).toHaveBeenCalled();
  });

  it("opens the convert modal", () => {
    renderWithProviders(<CoinAssets />);
    fireEvent.click(screen.getByText("Convert"));
    expect(mocks.modalsOpen).toHaveBeenCalled();
  });

  it("shows the inline loader while loading", () => {
    queryResults[portfolioKey] = { data: undefined, isLoading: true };
    renderWithProviders(<CoinAssets />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});