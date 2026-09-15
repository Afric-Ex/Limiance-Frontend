import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { queryResults } from "@/src/test/react-query-mock";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const { tradingService } = vi.hoisted(() => ({
  tradingService: {
    spotOrderHistory: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

vi.mock("@/src/services/trading", () => ({
  tradingService,
  tradingKeys: {
    orderHistory: () => ["order-history"],
  },
}));

vi.mock("@/src/mocks/mock-trading", () => ({ mockTrading: {} }));

import { OrderHistory } from "./order-history";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("OrderHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults["order-history"] = { data: [], isLoading: false };
  });

  it("renders the filters", () => {
    renderWithProviders(<OrderHistory />);
    textPresent("Date");
    textPresent("Base Asset");
    textPresent("Quote Asset");
    textPresent("Trade Side");
    textPresent("Sort By");
  });

  it("renders the empty state when there are no orders", () => {
    renderWithProviders(<OrderHistory />);
    expect(screen.getByText("No orders found matching your criteria.")).toBeInTheDocument();
  });

  it("renders table headers when orders exist", () => {
    queryResults["order-history"] = {
      data: [{ id: "o1" }],
      isLoading: false,
    };
    renderWithProviders(<OrderHistory />);
    for (const header of ["Time", "Pair", "Side", "Type", "Price", "Amount", "Filled", "Total", "Status"]) {
      textPresent(header);
    }
  });

  it("queries the spot order history service", () => {
    renderWithProviders(<OrderHistory />);
    expect(tradingService.spotOrderHistory).toHaveBeenCalledTimes(1);
  });

  it("renders orders with formatted values", () => {
    queryResults["order-history"] = {
      data: [
        {
          id: "o1",
          pair: "BTC/USDT",
          side: "buy",
          type: "limit",
          price: 50000,
          amount: 2,
          filled: 1,
          total: 100000,
          status: "filled",
          createdAt: "2025-01-01T10:00:00Z",
        },
      ],
      isLoading: false,
    };
    renderWithProviders(<OrderHistory />);
    expect(screen.getByText("BTC/USDT")).toBeInTheDocument();
    expect(screen.getByText("BUY")).toBeInTheDocument();
    expect(screen.getByText("limit")).toBeInTheDocument();
    expect(screen.getByText("50,000")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("100,000")).toBeInTheDocument();
    expect(screen.getByText("filled")).toBeInTheDocument();
    expect(screen.queryByText("No orders found matching your criteria.")).not.toBeInTheDocument();
  });
});