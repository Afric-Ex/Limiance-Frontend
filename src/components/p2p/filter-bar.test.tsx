import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { FilterBar } from "./filter-bar";
import { AdFilters } from "@/src/stores/p2p-store";

const { setAdFilters } = vi.hoisted(() => ({
  setAdFilters: vi.fn(),
}));

const defaultFilters: AdFilters = {
  type: "BUY",
  asset: "USDT",
  fiat: "USD",
  amount: "",
  paymentMethod: "All",
};

vi.mock("@/src/stores/p2p-store", () => ({
  useP2PStore: () => ({
    adFilters: defaultFilters,
    setAdFilters,
  }),
}));

describe("FilterBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Buy/Sell tabs", () => {
    renderWithProviders(<FilterBar />);
    expect(screen.getByText("Buy")).toBeInTheDocument();
    expect(screen.getByText("Sell")).toBeInTheDocument();
  });

  it("renders amount input and selects", () => {
    renderWithProviders(<FilterBar />);
    expect(screen.getByPlaceholderText("Enter Amount")).toBeInTheDocument();
    expect(screen.getAllByText("USD").length).toBeGreaterThan(0);
    expect(screen.getByText("USDT")).toBeInTheDocument();
  });

  it("switches to SELL filter", () => {
    renderWithProviders(<FilterBar />);
    fireEvent.click(screen.getByText("Sell"));
    expect(setAdFilters).toHaveBeenCalledWith({ type: "SELL" });
  });

  it("switches to BUY filter", () => {
    renderWithProviders(<FilterBar />);
    fireEvent.click(screen.getByText("Buy"));
    expect(setAdFilters).toHaveBeenCalledWith({ type: "BUY" });
  });
});