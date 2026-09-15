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
  tradingKeys: {},
}));

import { MarginRecords } from "./margin-records";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("MarginRecords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults["margin-order-history"] = { data: [], isLoading: false };
  });

  it("renders the account filter tabs and the filter selects", () => {
    renderWithProviders(<MarginRecords />);
    textPresent("Cross");
    textPresent("Isolated");
    textPresent("Date");
    textPresent("Time");
    textPresent("Coin");
    textPresent("Category");
  });

  it("renders table headers and the empty state", () => {
    renderWithProviders(<MarginRecords />);
    for (const header of ["Pair", "Side", "Time", "Price", "Quantity", "Status"]) {
      textPresent(header);
    }
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });

  it("queries the margin order history service", () => {
    renderWithProviders(<MarginRecords />);
    expect(tradingService.marginOrderHistory).toHaveBeenCalledTimes(1);
  });

  it("renders record rows", () => {
    queryResults["margin-order-history"] = {
      data: [
        {
          id: "m1",
          pair: "BTC/USDT",
          side: "buy",
          createdAt: "2025-01-01T10:00:00Z",
          price: 50000,
          quantity: 2,
          status: "filled",
        },
      ],
      isLoading: false,
    };
    renderWithProviders(<MarginRecords />);
    expect(screen.getByText("BTC/USDT")).toBeInTheDocument();
    expect(screen.getByText("buy")).toBeInTheDocument();
    expect(screen.getByText("50,000")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("filled")).toBeInTheDocument();
    expect(screen.queryByText("No Records")).not.toBeInTheDocument();
  });
});