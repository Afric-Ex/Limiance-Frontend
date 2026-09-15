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

const { asset } = vi.hoisted(() => ({
  asset: {
    transactionHistory: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

vi.mock("@/src/services/asset", () => ({
  asset,
  assetKeys: {
    transactionHistory: (params?: any) => ["transaction-history", params],
  },
}));

import { Crypto } from "./crypto";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("Crypto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults["transaction-history"] = { data: [], isLoading: false };
  });

  it("queries deposit history by default", () => {
    renderWithProviders(<Crypto />);
    expect(asset.transactionHistory).toHaveBeenCalledWith({
      transaction_type: "deposit",
    });
  });

  it("renders the filters, search and reset controls", () => {
    renderWithProviders(<Crypto />);
    textPresent("Time");
    textPresent("Coin");
    textPresent("Type");
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    textPresent("Reset");
  });

  it("renders table headers and the empty state", () => {
    renderWithProviders(<Crypto />);
    for (const header of ["Time", "Type", "Wallet", "Coin", "Amount", "Destination", "Status"]) {
      textPresent(header);
    }
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });

  it("renders transaction rows", () => {
    queryResults["transaction-history"] = {
      data: [
        {
          id: "t1",
          createdAt: "2025-01-01T10:00:00Z",
          type: "Deposit",
          wallet: "Spot",
          coin: "BTC",
          amount: 1,
          destination: "0xabc",
          status: "Completed",
        },
      ],
      isLoading: false,
    };
    renderWithProviders(<Crypto />);
    expect(screen.getByText("Spot")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("0xabc")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.queryByText("No Records")).not.toBeInTheDocument();
  });
});