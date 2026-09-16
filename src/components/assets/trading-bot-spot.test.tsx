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

const mocks = vi.hoisted(() => ({
  getActiveBots: vi.fn(() => Promise.resolve({ data: [] })),
  tradingHistory: vi.fn(() => Promise.resolve({ data: [] })),
  stopBot: vi.fn(() => Promise.resolve({ data: {} })),
  errorMessageHandler: vi.fn(),
}));

vi.mock("@/src/services/bot", () => ({
  botService: {
    getActiveBots: mocks.getActiveBots,
    tradingHistory: mocks.tradingHistory,
    stopBot: mocks.stopBot,
  },
  botKeys: {
    activeBots: (type: string) => ["active-bots", type],
    tradingHistory: (type: string) => ["bot-history", type],
  },
}));

vi.mock("@/src/lib/error-handler", () => ({ errorMessageHandler: mocks.errorMessageHandler }));

import { TradingBotSpot } from "./trading-bot-spot";

const activeKey = JSON.stringify(["active-bots", "spot"]);

const bots = [
  { id: "b1", pair: "BTC/USDT", strategy: "DCA", investmentAmount: 1000, roi: 5.2, pnl: 52.1, status: "active" },
  { id: "b2", pair: "ETH/USDT", strategy: "Grid", investmentAmount: 500, roi: -2.1, pnl: -10.5, status: "paused" },
];

describe("TradingBotSpot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults[activeKey] = { data: bots, isLoading: false };
  });

  it("renders the bot summary and table rows", () => {
    renderWithProviders(<TradingBotSpot />);
    expect(screen.getByText("2 Active Bots")).toBeInTheDocument();
    expect(screen.getByText("$1,500 invested")).toBeInTheDocument();
    expect(screen.getByText("(+41.60 PnL)")).toBeInTheDocument();
    expect(screen.getByText("BTC/USDT")).toBeInTheDocument();
    expect(screen.getByText("DCA")).toBeInTheDocument();
    expect(screen.getByText("+5.20%")).toBeInTheDocument();
    expect(screen.getByText("-2.10%")).toBeInTheDocument();
  });

  it("shows a singular bot label for one bot", () => {
    queryResults[activeKey] = { data: [bots[0]], isLoading: false };
    renderWithProviders(<TradingBotSpot />);
    expect(screen.getByText("1 Active Bot")).toBeInTheDocument();
  });

  it("filters bots by searching the pair", () => {
    renderWithProviders(<TradingBotSpot />);
    fireEvent.change(screen.getByPlaceholderText("Search pair"), {
      target: { value: "ETH" },
    });
    expect(screen.getByText("ETH/USDT")).toBeInTheDocument();
    expect(screen.queryByText("BTC/USDT")).not.toBeInTheDocument();
  });

  it("stops a bot via the Stop action and invalidates queries", async () => {
    renderWithProviders(<TradingBotSpot />);
    fireEvent.click(screen.getAllByRole("button", { name: "Stop" })[0]);
    expect(mocks.stopBot).toHaveBeenCalledWith("b1");
    await waitFor(() => {
      expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["active-bots", "spot"],
      });
      expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["bot-history", "spot"],
      });
    });
  });

  it("renders the empty state when there are no bots", () => {
    queryResults[activeKey] = { data: [], isLoading: false };
    renderWithProviders(<TradingBotSpot />);
    expect(screen.getByText("No active bots")).toBeInTheDocument();
    expect(screen.getByText("0 Active Bots")).toBeInTheDocument();
  });
});