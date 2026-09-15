import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { queryResults, queryClientMock } from "@/src/test/react-query-mock";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const mocks = vi.hoisted(() => ({
  getActiveBots: vi.fn(() => Promise.resolve({ data: [] })),
  stopBot: vi.fn(() => Promise.resolve({ data: {} })),
  errorMessageHandler: vi.fn(),
}));

vi.mock("@/src/services/bot", () => ({
  botService: {
    getActiveBots: mocks.getActiveBots,
    stopBot: mocks.stopBot,
  },
  botKeys: {
    activeBots: (type: string) => ["active-bots", type],
    tradingHistory: (type: string) => ["bot-history", type],
  },
}));

vi.mock("@/src/lib/error-handler", () => ({ errorMessageHandler: mocks.errorMessageHandler }));

import { TradingBotFutures } from "./trading-bot-futures";

const activeKey = JSON.stringify(["active-bots", "futures"]);

const bot = { id: "f1", pair: "SOL/USDT", strategy: "TWAP", investmentAmount: 2000, roi: 3.4, pnl: 68, status: "active" };

describe("TradingBotFutures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults[activeKey] = { data: [bot], isLoading: false };
  });

  it("renders the futures bot summary and row data", () => {
    renderWithProviders(<TradingBotFutures />);
    expect(screen.getByText("1 Active Bot")).toBeInTheDocument();
    expect(screen.getByText("$2,000 invested")).toBeInTheDocument();
    expect(screen.getByText("SOL/USDT")).toBeInTheDocument();
    expect(screen.getByText("TWAP")).toBeInTheDocument();
    expect(screen.getByText("$1,800")).toBeInTheDocument();
    expect(screen.getByText("+3.40%")).toBeInTheDocument();
  });

  it("stops a futures bot", async () => {
    renderWithProviders(<TradingBotFutures />);
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(mocks.stopBot).toHaveBeenCalledWith("f1");
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["active-bots", "futures"],
    });
  });

  it("renders the empty state when there are no bots", () => {
    queryResults[activeKey] = { data: [], isLoading: false };
    renderWithProviders(<TradingBotFutures />);
    expect(screen.getByText("No active bots")).toBeInTheDocument();
  });

  it("filters bots by searching the pair", () => {
    renderWithProviders(<TradingBotFutures />);
    fireEvent.change(screen.getByPlaceholderText("Search pair"), {
      target: { value: "NOPE" },
    });
    expect(screen.getByText("No active bots")).toBeInTheDocument();
  });
});