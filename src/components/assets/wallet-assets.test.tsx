import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const mocks = vi.hoisted(() => ({
  allocations: {
    totalValue: "125000.50",
    allocations: [
      { symbol: "BTC", name: "Bitcoin", balance: "0.05", value: "4500.00", percentage: "3.6" },
      { symbol: "USDT", name: "Tether", balance: "100", value: "100.00", percentage: "0.08" },
    ],
  },
  loading: false,
}));

vi.mock("@/src/hooks/use-portfolio-ws", () => ({
  usePortfolioWs: () => ({
    allocations: mocks.allocations,
    isAllocationsLoading: mocks.loading,
  }),
}));

import { WalletAssets } from "./wallet-assets";

describe("WalletAssets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loading = false;
  });

  it("renders the total value and allocation rows", () => {
    renderWithProviders(<WalletAssets />);
    expect(screen.getByText("Total Value")).toBeInTheDocument();
    expect(screen.getByText("₦125,000.50")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("0.05")).toBeInTheDocument();
    expect(screen.getByText("₦4,500.00")).toBeInTheDocument();
    expect(screen.getByText("3.6%")).toBeInTheDocument();
    expect(screen.getByText("USDT")).toBeInTheDocument();
  });

  it("shows the empty state when there are no allocations", () => {
    mocks.allocations = { totalValue: "", allocations: [] };
    renderWithProviders(<WalletAssets />);
    expect(screen.getByText("No allocation data")).toBeInTheDocument();
  });

  it("shows the inline loader while allocations load", () => {
    mocks.loading = true;
    renderWithProviders(<WalletAssets />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});