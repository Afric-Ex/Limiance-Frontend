import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const mocks = vi.hoisted(() => ({
  trading: {
    placeLimitOrder: vi.fn(() => Promise.resolve({ data: {} })),
    placeMarketOrder: vi.fn(() => Promise.resolve({ data: {} })),
    placeStopOrder: vi.fn(() => Promise.resolve({ data: {} })),
  },
  modalsOpen: vi.fn(),
  modalsCloseAll: vi.fn(),
  successNotification: vi.fn(),
  errorMessageHandler: vi.fn(),
  refreshBalances: vi.fn(),
}));

vi.mock("@/src/services/trading", () => ({
  tradingService: mocks.trading,
  tradingKeys: {
    orderBooks: ["order-books"],
    openOrders: (pair?: string) => ["open-orders", pair],
    orderHistory: (params?: any) => ["order-history", params],
    klineData: (symbol: string, interval: string) => ["kline", symbol, interval],
    gainersLosers: ["gainers-losers"],
    marginOrderHistory: ["margin-order-history"],
    marginBorrowHistory: ["margin-borrow-history"],
    marginLiquidationHistory: ["margin-liquidation-history"],
    convertHistory: ["convert-history"],
    fiatOrderHistory: ["fiat-order-history"],
    paymentHistory: ["payment-history"],
    listedTokens: (params?: any) => ["listed-tokens", params],
  },
}));

vi.mock("@mantine/modals", () => ({
  modals: { open: mocks.modalsOpen, closeAll: mocks.modalsCloseAll },
}));

vi.mock("@/src/lib/notification-handler", () => ({
  successNotification: mocks.successNotification,
}));

vi.mock("@/src/lib/error-handler", () => ({ errorMessageHandler: mocks.errorMessageHandler }));

vi.mock("@/src/hooks/use-portfolio-ws", () => ({
  usePortfolioWs: () => ({
    coins: [
      {
        symbol: "USDT",
        name: "Tether",
        spotBalance: "10000",
        marginBalance: "0",
        futuresBalance: "0",
        fundingBalance: "0",
        currencyPrice: "1",
      },
      {
        symbol: "BTC",
        name: "Bitcoin",
        spotBalance: "1",
        marginBalance: "0",
        futuresBalance: "0",
        fundingBalance: "0",
        currencyPrice: "60000",
      },
    ],
    balances: {},
    isLoading: false,
    marginAccount: undefined,
    refreshBalances: mocks.refreshBalances,
  }),
}));

import { queryClientMock } from "@/src/test/react-query-mock";
import { PlaceSpot } from "./place-spot";

describe("PlaceSpot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the spot order layout with buy and sell columns", () => {
    renderWithProviders(<PlaceSpot pair="BTC/USDT" mode="spot" />);
    expect(screen.getByText("Limit")).toBeInTheDocument();
    expect(screen.getByText("Market")).toBeInTheDocument();
    expect(screen.getByText(/Stop/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buy BTC" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sell BTC" })).toBeDisabled();
    expect(screen.getAllByText(/10,000\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1\.000000/).length).toBeGreaterThan(0);
    expect(screen.getByText("TP/SL")).toBeInTheDocument();
    expect(screen.getByText("Transfer")).toBeInTheDocument();
  });

  it("places a buy limit order and resets the form", async () => {
    renderWithProviders(<PlaceSpot pair="BTC/USDT" mode="spot" />);
    const inputs = screen.getAllByPlaceholderText("0.00");
    fireEvent.change(inputs[0], { target: { value: "50000" } });
    fireEvent.change(inputs[1], { target: { value: "1" } });

    fireEvent.click(screen.getByRole("button", { name: "Buy BTC" }));

    await waitFor(() => {
      expect(mocks.trading.placeLimitOrder).toHaveBeenCalledWith({
        side: "buy",
        base: "BTC",
        quote: "USDT",
        type: "buy_limit",
        price: 50000,
        quantity: 1,
        leverage: 1,
        stopPrice: 50000,
      });
    });
    expect(mocks.successNotification).toHaveBeenCalledWith("Buy order placed");
    expect(mocks.refreshBalances).toHaveBeenCalled();
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["open-orders", undefined],
    });
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["open-orders", "BTC/USDT"],
    });
  });

  it("places a sell limit order", async () => {
    renderWithProviders(<PlaceSpot pair="BTC/USDT" mode="spot" />);
    const inputs = screen.getAllByPlaceholderText("0.00");
    fireEvent.change(inputs[3], { target: { value: "50000" } });
    fireEvent.change(inputs[4], { target: { value: "0.5" } });

    fireEvent.click(screen.getByRole("button", { name: "Sell BTC" }));

    await waitFor(() => {
      expect(mocks.trading.placeLimitOrder).toHaveBeenCalledWith({
        side: "sell",
        base: "BTC",
        quote: "USDT",
        type: "sell_limit",
        price: 50000,
        quantity: 0.5,
        leverage: 1,
        stopPrice: 50000,
      });
    });
    expect(mocks.successNotification).toHaveBeenCalledWith("Sell order placed");
  });

  it("fills the qty from the Max button in buy mode", () => {
    renderWithProviders(<PlaceSpot pair="BTC/USDT" mode="spot" />);
    const inputs = screen.getAllByPlaceholderText("0.00");
    fireEvent.change(inputs[0], { target: { value: "50000" } });
    const maxButtons = screen.getAllByText("Max");
    fireEvent.click(maxButtons[0]);
    const qtyInput = inputs[1] as HTMLInputElement;
    expect(qtyInput.value).toBe("0.2");
  });

  it("shows TP/SL fields after toggling the TP/SL control", () => {
    renderWithProviders(<PlaceSpot pair="BTC/USDT" mode="spot" />);
    expect(screen.queryByText("TP")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("TP/SL"));
    expect(screen.getAllByText("TP").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SL").length).toBeGreaterThan(0);
  });

  it("renders the leverage selector in cross mode", () => {
    renderWithProviders(<PlaceSpot pair="BTC/USDT" mode="cross" leverage={3} />);
    expect(screen.getByText("Leverage")).toBeInTheDocument();
    expect(screen.getAllByText("3x").length).toBeGreaterThan(0);
    expect(screen.getByText("OCO")).toBeInTheDocument();
    expect(screen.getByText("Borrow")).toBeInTheDocument();
  });
});