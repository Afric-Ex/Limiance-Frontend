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
    allTransactionHistory: vi.fn(() => Promise.resolve({ data: [] })),
  },
}));

vi.mock("@/src/services/asset", () => ({
  asset,
  assetKeys: {},
}));

import { FundingWallet } from "./funding-wallet";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("FundingWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults["funding-history"] = { data: [], isLoading: false };
  });

  it("renders the filter selects", () => {
    renderWithProviders(<FundingWallet />);
    textPresent("Time");
    textPresent("Coin");
    textPresent("Transaction Type");
  });

  it("renders table headers and the empty state", () => {
    renderWithProviders(<FundingWallet />);
    for (const header of ["Coin", "Time", "Transaction Type", "Change", "Status"]) {
      textPresent(header);
    }
    expect(screen.getByText("No Funding transactions found.")).toBeInTheDocument();
  });

  it("queries the all transaction history service", () => {
    renderWithProviders(<FundingWallet />);
    expect(asset.allTransactionHistory).toHaveBeenCalledTimes(1);
  });

  it("renders transaction rows", () => {
    queryResults["funding-history"] = {
      data: [
        {
          id: "f1",
          coin: "USDT",
          createdAt: "2025-01-01T10:00:00Z",
          type: "deposit",
          amount: 50,
          status: "Completed",
        },
      ],
      isLoading: false,
    };
    renderWithProviders(<FundingWallet />);
    expect(screen.getAllByText("USDT").length).toBeGreaterThan(0);
    expect(screen.getByText("deposit")).toBeInTheDocument();
    expect(screen.getByText("+50")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.queryByText("No Funding transactions found.")).not.toBeInTheDocument();
  });
});