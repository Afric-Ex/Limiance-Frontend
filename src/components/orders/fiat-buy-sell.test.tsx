import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { queryResults } from "@/src/test/react-query-mock";

vi.setConfig({ testTimeout: 20000 });

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const { tradingService } = vi.hoisted(() => ({
  tradingService: {
    fiatOrderHistory: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

vi.mock("@/src/services/trading", () => ({
  tradingService,
  tradingKeys: {
    fiatOrderHistory: ["fiat-order-history"],
  },
}));

vi.mock("@/src/mocks/mock-trading", () => ({ mockTrading: {} }));

import { FiatBuySell } from "./fiat-buy-sell";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("FiatBuySell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults["fiat-order-history"] = { data: [], isLoading: false };
  });

  it("renders the filters, search and reset controls", () => {
    renderWithProviders(<FiatBuySell />);
    textPresent("Coin");
    textPresent("Category");
    textPresent("Time");
    textPresent("Currency");
    expect(screen.getByPlaceholderText("Search order no.")).toBeInTheDocument();
    textPresent("Reset");
  });

  it("renders the empty state when there are no orders", () => {
    renderWithProviders(<FiatBuySell />);
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });

  it("renders table headers when orders exist", () => {
    queryResults["fiat-order-history"] = {
      data: [
        {
          id: "f1",
          createdAt: "2025-01-01T10:00:00Z",
          type: "buy",
          rate: "1000",
          currency: "USD",
          fiatAmount: "100",
          assetAmount: "0.1",
          asset: "BTC",
          status: "Completed",
        },
      ],
      isLoading: false,
    };
    renderWithProviders(<FiatBuySell />);
    for (const header of ["Order ID", "Time", "Category", "Price", "Fiat/Crypto Amount", "Received", "Status"]) {
      textPresent(header);
    }
  });

  it("queries the fiat order history service", () => {
    renderWithProviders(<FiatBuySell />);
    expect(tradingService.fiatOrderHistory).toHaveBeenCalledTimes(1);
  });

  it("renders fiat order rows", () => {
    queryResults["fiat-order-history"] = {
      data: [
        {
          id: "f1",
          createdAt: "2025-01-01T10:00:00Z",
          type: "buy",
          rate: "1000",
          currency: "USD",
          fiatAmount: "100",
          assetAmount: "0.1",
          asset: "BTC",
          status: "Completed",
        },
      ],
      isLoading: false,
    };
    renderWithProviders(<FiatBuySell />);
    expect(screen.getByText("f1")).toBeInTheDocument();
    expect(screen.getByText("BUY")).toBeInTheDocument();
    expect(screen.getByText("1,000 USD")).toBeInTheDocument();
    expect(screen.getByText("100 USD")).toBeInTheDocument();
    expect(screen.getByText("0.1 BTC")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.queryByText("No Records")).not.toBeInTheDocument();
  });
});