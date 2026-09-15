import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { queryResults, queryClientMock } from "@/src/test/react-query-mock";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const { tradingService, successNotification, errorMessageHandler } = vi.hoisted(() => ({
  tradingService: {
    fetchOpenOrders: vi.fn(() => Promise.resolve({ data: [] })),
    closeSpotOrder: vi.fn(() => Promise.resolve({})),
  },
  successNotification: vi.fn(),
  errorMessageHandler: vi.fn(),
}));

vi.mock("@/src/services/trading", () => ({
  tradingService,
  tradingKeys: {
    openOrders: (pair?: string) => ["open-orders", pair],
  },
}));

vi.mock("@/src/mocks/mock-trading", () => ({ mockTrading: {} }));

vi.mock("@/src/lib/notification-handler", () => ({
  successNotification,
  errorNotification: vi.fn(),
}));

vi.mock("@/src/lib/error-handler", () => ({ errorMessageHandler }));

import { OpenTab } from "./history-tab";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

const openOrder = {
  id: "o1",
  pair: "BTC/USDT",
  side: "buy",
  type: "limit",
  price: 50000,
  amount: 2,
  filled: 0,
  total: 100000,
  status: "OPEN",
  createdAt: "2025-01-01T10:00:00Z",
};

describe("OpenTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults["open-orders"] = { data: [], isLoading: false };
  });

  it("renders the filter selects", () => {
    renderWithProviders(<OpenTab />);
    textPresent("Order");
    textPresent("Base");
    textPresent("Qoute");
    textPresent("Trade");
  });

  it("renders the empty state when there are no orders", () => {
    renderWithProviders(<OpenTab />);
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });

  it("renders table headers when orders exist", () => {
    queryResults["open-orders"] = { data: [openOrder] };
    renderWithProviders(<OpenTab />);
    for (const header of ["Pair", "Side", "Type", "Price", "Amount", "Filled", "Total", "Status", "Time", "Action"]) {
      textPresent(header);
    }
  });

  it("queries the open orders service", () => {
    renderWithProviders(<OpenTab />);
    expect(tradingService.fetchOpenOrders).toHaveBeenCalledTimes(1);
  });

  it("renders open order rows and a cancel action", () => {
    queryResults["open-orders"] = { data: [openOrder] };
    renderWithProviders(<OpenTab />);
    expect(screen.getByText("BTC/USDT")).toBeInTheDocument();
    expect(screen.getByText("BUY")).toBeInTheDocument();
    expect(screen.getByText("OPEN")).toBeInTheDocument();
    const cancel = screen.getAllByText("Cancel");
    expect(cancel.length).toBeGreaterThan(0);
    expect(screen.queryByText("No Records")).not.toBeInTheDocument();
  });

  it("cancels an order through the service and invalidates open orders", async () => {
    queryResults["open-orders"] = { data: [openOrder] };
    renderWithProviders(<OpenTab />);
    fireEvent.click(screen.getAllByText("Cancel")[0]);

    await waitFor(() => {
      expect(tradingService.closeSpotOrder).toHaveBeenCalledWith("o1");
    });
    await waitFor(() => {
      expect(successNotification).toHaveBeenCalledWith("Order cancelled");
    });
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["open-orders", undefined],
    });
  });

  it("reports cancellation errors", async () => {
    tradingService.closeSpotOrder.mockRejectedValueOnce(new Error("boom"));
    queryResults["open-orders"] = { data: [openOrder] };
    renderWithProviders(<OpenTab />);
    fireEvent.click(screen.getAllByText("Cancel")[0]);
    await waitFor(() => {
      expect(errorMessageHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});