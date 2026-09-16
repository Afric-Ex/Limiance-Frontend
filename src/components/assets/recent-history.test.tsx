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

const mocks = vi.hoisted(() => ({
  transactionHistory: vi.fn(() => Promise.resolve({ data: [] })),
}));

vi.mock("@/src/services/asset", () => ({
  asset: { transactionHistory: mocks.transactionHistory },
  assetKeys: {
    transactionHistory: (params?: any) => ["transaction-history", params],
  },
}));

import { RecentHistory } from "./recent-history";

const historyKey = JSON.stringify(["transaction-history", { page: 1, limit: 5 }]);

const history = [
  {
    id: "t1",
    type: "deposit",
    completedAt: "2026-09-01",
    amount: "0.02",
    asset: "BTC",
    status: "completed",
  },
  {
    id: "t2",
    type: "withdrawal",
    completedAt: "2026-09-02",
    amount: "50",
    asset: "USDT",
    status: "pending",
  },
];

describe("RecentHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete queryResults[historyKey];
  });

  it("renders the section header and an All link", () => {
    queryResults[historyKey] = { data: history, isLoading: false };
    renderWithProviders(<RecentHistory />);
    expect(screen.getByText("Recent Deposit & Withdrawal History")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All →" })).toHaveAttribute(
      "href",
      "/transactions/deposit"
    );
  });

  it("lists the most recent transactions", () => {
    queryResults[historyKey] = { data: history, isLoading: false };
    renderWithProviders(<RecentHistory />);
    expect(screen.getAllByText(/deposit/i).length).toBeGreaterThan(0);
    expect(screen.getByText("0.02")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getAllByText(/withdrawal/i).length).toBeGreaterThan(0);
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("USDT")).toBeInTheDocument();
  });

  it("shows the empty state when there is no history", () => {
    queryResults[historyKey] = { data: [], isLoading: false };
    renderWithProviders(<RecentHistory />);
    expect(screen.getByText("No recent history found.")).toBeInTheDocument();
  });
});