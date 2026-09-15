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
    marginOrderHistory: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

vi.mock("@/src/services/trading", () => ({
  tradingService,
  tradingKeys: {
    marginOrderHistory: ["margin-order-history"],
  },
}));

vi.mock("@/src/mocks/mock-trading", () => ({ mockTrading: {} }));

import { MarginOrderHistory } from "./margin-order-history";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("MarginOrderHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults["margin-order-history"] = { data: [], isLoading: false };
  });

  it("renders the filter tabs, search and reset controls", () => {
    renderWithProviders(<MarginOrderHistory />);
    textPresent("Cross");
    textPresent("Isolated");
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    textPresent("Reset");
  });

  it("renders the filter selects", () => {
    renderWithProviders(<MarginOrderHistory />);
    textPresent("Order");
    textPresent("Date");
    textPresent("Trading Pair");
    textPresent("Trade");
    textPresent("Sort By");
  });

  it("renders the empty state when there are no orders", () => {
    renderWithProviders(<MarginOrderHistory />);
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });

  it("renders table headers when orders exist", () => {
    queryResults["margin-order-history"] = {
      data: [
        {
          id: "mh1",
          pair: "BTC/USDT",
          type: "limit",
          side: "buy",
          price: 50000,
          filled: 1,
          amount: 2,
          status: "filled",
        },
      ],
    };
    renderWithProviders(<MarginOrderHistory />);
    for (const header of ["Order Time", "Trading Pair", "Type", "Side", "Average", "Price", "Executed", "Amount", "Triggers Condition", "Status"]) {
      textPresent(header);
    }
  });

  it("queries the margin order history service", () => {
    renderWithProviders(<MarginOrderHistory />);
    expect(tradingService.marginOrderHistory).toHaveBeenCalledTimes(1);
  });

  it("renders rows", () => {
    queryResults["margin-order-history"] = {
      data: [
        {
          id: "mh1",
          createdAt: "2025-01-01T10:00:00Z",
          pair: "BTC/USDT",
          type: "limit",
          side: "buy",
          price: 50000,
          filled: 1,
          amount: 2,
          status: "filled",
        },
      ],
    };
    renderWithProviders(<MarginOrderHistory />);
    expect(screen.getByText("BTC/USDT")).toBeInTheDocument();
    expect(screen.getByText("limit")).toBeInTheDocument();
    expect(screen.getByText("BUY")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("filled")).toBeInTheDocument();
    expect(screen.queryByText("No Records")).not.toBeInTheDocument();
  });
});