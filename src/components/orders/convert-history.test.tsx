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
    convertHistory: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

vi.mock("@/src/services/trading", () => ({
  tradingService,
  tradingKeys: {
    convertHistory: ["convert-history"],
  },
}));

vi.mock("@/src/mocks/mock-trading", () => ({ mockTrading: {} }));

import { ConvertTable } from "./convert-history";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("ConvertTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults["convert-history"] = { data: [], isLoading: false };
  });

  it("renders the filters, search and reset controls", () => {
    renderWithProviders(<ConvertTable />);
    textPresent("Coin");
    textPresent("Time");
    textPresent("Wallet");
    expect(screen.getByPlaceholderText("Search order no.")).toBeInTheDocument();
    textPresent("Reset");
  });

  it("renders the empty state when there are no records", () => {
    renderWithProviders(<ConvertTable />);
    expect(screen.getByText("No conversion records found.")).toBeInTheDocument();
  });

  it("renders table headers when records exist", () => {
    queryResults["convert-history"] = {
      data: [
        {
          id: "c1",
          createdAt: "2025-01-01T10:00:00Z",
          from: "BTC",
          to: "USDT",
          fromAmount: "1",
          toAmount: "70000",
          rate: "70000",
          status: "Completed",
        },
      ],
      isLoading: false,
    };
    renderWithProviders(<ConvertTable />);
    for (const header of ["Conversion Time", "Wallet", "Trading Pair", "Type", "From", "To", "Price", "Status"]) {
      textPresent(header);
    }
  });

  it("queries the convert history service", () => {
    renderWithProviders(<ConvertTable />);
    expect(tradingService.convertHistory).toHaveBeenCalledTimes(1);
  });

  it("renders conversion rows", () => {
    queryResults["convert-history"] = {
      data: [
        {
          id: "c1",
          createdAt: "2025-01-01T10:00:00Z",
          from: "BTC",
          to: "USDT",
          fromAmount: "1",
          toAmount: "70000",
          rate: "70000",
          status: "Completed",
        },
      ],
      isLoading: false,
    };
    renderWithProviders(<ConvertTable />);
    expect(screen.getByText("BTC/USDT")).toBeInTheDocument();
    expect(screen.getAllByText("Convert")).toHaveLength(1);
    expect(screen.getByText("- 1 BTC")).toBeInTheDocument();
    expect(screen.getByText("+ 70000 USDT")).toBeInTheDocument();
    expect(screen.getByText("70,000")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.queryByText("No conversion records found.")).not.toBeInTheDocument();
  });
});