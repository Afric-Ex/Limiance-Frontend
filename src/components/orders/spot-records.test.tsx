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

import { SpotRecords } from "./spot-records";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("SpotRecords", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults["order-history"] = { data: [], isLoading: false };
  });

  it("renders the filters", () => {
    renderWithProviders(<SpotRecords />);
    textPresent("Date");
    textPresent("Time");
    textPresent("Coin");
    textPresent("Side");
  });

  it("renders table headers and the empty state", () => {
    renderWithProviders(<SpotRecords />);
    for (const header of ["Pair", "Side", "Time", "Price", "Quantity", "Status"]) {
      textPresent(header);
    }
    expect(screen.getByText("No Spot records found.")).toBeInTheDocument();
  });

  it("queries the spot order history service", () => {
    renderWithProviders(<SpotRecords />);
    expect(tradingService.spotOrderHistory).toHaveBeenCalledTimes(1);
  });

  it("renders record rows", () => {
    queryResults["order-history"] = {
      data: [
        {
          id: "r1",
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
    renderWithProviders(<SpotRecords />);
    expect(screen.getByText("BTC/USDT")).toBeInTheDocument();
    expect(screen.getByText("buy")).toBeInTheDocument();
    expect(screen.getByText("50,000")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("filled")).toBeInTheDocument();
    expect(screen.queryByText("No Spot records found.")).not.toBeInTheDocument();
  });
});