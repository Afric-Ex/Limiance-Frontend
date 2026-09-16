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
  fetchProducts: vi.fn(() => Promise.resolve({ data: [] })),
  myPositions: vi.fn(() => Promise.resolve({ data: [] })),
  subscribe: vi.fn(() => Promise.resolve({ data: {} })),
  unstake: vi.fn(() => Promise.resolve({ data: {} })),
  successNotification: vi.fn(),
  errorMessageHandler: vi.fn(),
}));

vi.mock("@/src/mocks", () => ({
  MOCK_MODE: { earn: false },
}));

vi.mock("@/src/services/earn", () => ({
  earnService: {
    fetchProducts: mocks.fetchProducts,
    myPositions: mocks.myPositions,
    subscribe: mocks.subscribe,
    unstake: mocks.unstake,
  },
  earnKeys: {
    products: ["earn-products"],
    myPositions: ["earn-my-positions"],
  },
}));

vi.mock("@/src/lib/notification-handler", () => ({
  successNotification: mocks.successNotification,
  errorNotification: vi.fn(),
}));

vi.mock("@/src/lib/error-handler", () => ({ errorMessageHandler: mocks.errorMessageHandler }));

import { EarnTab } from "./earn-tab";

const productsKey = JSON.stringify(["earn-products"]);
const positionsKey = JSON.stringify(["earn-my-positions"]);

const products = [
  { id: "sp-1", asset: "USDT", image: "/usdt.png", apy: 5.5, minAmount: "10", lockDays: 7, type: "fixed" },
  { id: "sp-2", asset: "ETH", image: "/eth.png", apy: 2.1, minAmount: "0.1", lockDays: 0, type: "flexible" },
];

const positions = [
  {
    id: "pos-1",
    asset: "USDT",
    image: "/usdt.png",
    lockDays: 7,
    apy: 5.5,
    amount: "100",
    earned: "1.2",
    endDate: "2026-12-31T00:00:00Z",
    status: "staking",
  },
];

describe("EarnTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults[productsKey] = { data: products, isLoading: false };
    queryResults[positionsKey] = { data: positions, isLoading: false };
  });

  it("renders the product tabs and staking products", () => {
    renderWithProviders(<EarnTab />);
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("My Positions")).toBeInTheDocument();
    expect(screen.getByText("Simple Earn")).toBeInTheDocument();
    expect(screen.getByText("Staking")).toBeInTheDocument();
    expect(screen.getAllByText("USDT").length).toBeGreaterThan(0);
    expect(screen.getByText("5.5% APY")).toBeInTheDocument();
  });

  it("shows the no records empty state when there are no products", () => {
    queryResults[productsKey] = { data: [], isLoading: false };
    renderWithProviders(<EarnTab />);
    expect(screen.getAllByText("No Records").length).toBeGreaterThan(0);
  });

  it("stakes a product from the Simple Earn tab", async () => {
    renderWithProviders(<EarnTab />);
    fireEvent.click(screen.getAllByRole("button", { name: "Stake" })[0]);
    await waitFor(() => {
      expect(screen.getByText("Stake USDT")).toBeInTheDocument();
    });
    const amountInput = screen.getByPlaceholderText("0.00");
    fireEvent.change(amountInput, { target: { value: "42" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(mocks.subscribe).toHaveBeenCalledWith({ productId: "sp-1", amount: "42" });
    });
    expect(mocks.successNotification).toHaveBeenCalledWith("Staking subscription created");
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["earn-my-positions"],
    });
  });

  it("blocks staking below the product minimum", async () => {
    renderWithProviders(<EarnTab />);
    fireEvent.click(screen.getAllByRole("button", { name: "Stake" })[0]);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("0.00")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "1" } });
    expect(screen.getByText("Minimum stake is 10 USDT")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("shows My Positions and unstakes", async () => {
    renderWithProviders(<EarnTab />);
    fireEvent.click(screen.getByText("My Positions"));
    expect(screen.getByText("100 USDT")).toBeInTheDocument();
    expect(screen.getByText("+1.2 earned")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Unstake" }));

    await waitFor(() => {
      expect(mocks.unstake).toHaveBeenCalledWith({ subscriptionId: "pos-1" });
    });
    expect(mocks.successNotification).toHaveBeenCalledWith("Unstaked successfully");
    expect(queryClientMock.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["earn-my-positions"],
    });
  });

  it("renders alternate product tabs with table headers", () => {
    renderWithProviders(<EarnTab />);
    fireEvent.click(screen.getByText("Staking"));
    expect(screen.getByText("Redemption Date")).toBeInTheDocument();
  });
});