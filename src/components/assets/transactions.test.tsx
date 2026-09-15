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

import { Transactions } from "./transactions";

const historyKey = JSON.stringify(["transaction-history", { page: 1, limit: 30 }]);

const history = [
  {
    id: "tx-1",
    completedAt: "2026-09-01 10:00:00",
    asset: "btc",
    amount: "0.01",
    type: "deposit",
    hash: "0xabc123",
    chain: "bitcoin",
    status: "completed",
  },
  {
    id: "tx-2",
    completedAt: "2026-09-02 11:00:00",
    asset: "eth",
    amount: "1.5",
    type: "withdrawal",
    hash: "0xdef456",
    chain: "evm",
    status: "pending",
  },
];

describe("Transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete queryResults[historyKey];
  });

  it("renders the table headers and transaction rows", () => {
    queryResults[historyKey] = { data: history, isLoading: false };
    renderWithProviders(<Transactions />);
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Date & Time")).toBeInTheDocument();
    expect(screen.getByText("0xabc12...")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("BITCOIN")).toBeInTheDocument();
    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
  });

  it("shows the pending tooltip badge for pending transactions", () => {
    queryResults[historyKey] = { data: history, isLoading: false };
    renderWithProviders(<Transactions />);
    expect(screen.getAllByText("Pending").length).toBe(1);
  });

  it("renders the no records empty state when empty", () => {
    queryResults[historyKey] = { data: [], isLoading: false };
    renderWithProviders(<Transactions />);
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });
});