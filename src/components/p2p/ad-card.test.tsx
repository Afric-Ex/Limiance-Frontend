import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { AdCard } from "./ad-card";
import { Ad } from "@/src/stores/p2p-store";

const makeAd = (overrides = {}): Ad => ({
  id: "ad-1",
  type: "BUY",
  asset: "USDT",
  fiat: "USD",
  price: 100,
  availableQuantity: 5000,
  minQuantity: 50,
  maxQuantity: 1000,
  paymentMethods: ["Bank Transfer", "PayPal"],
  advertiser: {
    id: "adv-1",
    name: "Alice",
    firstName: "Alice",
    verified: true,
    trades: 150,
    completionRate: 98,
    responseTime: "5 mins",
  },
  ...overrides,
});

describe("AdCard", () => {
  it("renders advertiser info and price", () => {
    renderWithProviders(<AdCard ad={makeAd()} onActionClick={vi.fn()} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText(/100.00 USD/)).toBeInTheDocument();
    expect(screen.getByText(/5,000 USDT/)).toBeInTheDocument();
    expect(screen.getByText(/50 - 1,000 USDT/)).toBeInTheDocument();
  });

  it("renders payment method badges", () => {
    renderWithProviders(<AdCard ad={makeAd()} onActionClick={vi.fn()} />);
    expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
    expect(screen.getByText("PayPal")).toBeInTheDocument();
  });

  it("shows Sell button for BUY ads", () => {
    renderWithProviders(<AdCard ad={makeAd()} onActionClick={vi.fn()} />);
    expect(screen.getByText("Sell USDT")).toBeInTheDocument();
  });

  it("shows Buy button for SELL ads", () => {
    renderWithProviders(
      <AdCard ad={makeAd({ type: "SELL" })} onActionClick={vi.fn()} />
    );
    expect(screen.getByText("Buy USDT")).toBeInTheDocument();
  });

  it("calls onActionClick with the ad", () => {
    const onActionClick = vi.fn();
    renderWithProviders(<AdCard ad={makeAd()} onActionClick={onActionClick} />);
    fireEvent.click(screen.getByText("Sell USDT"));
    expect(onActionClick).toHaveBeenCalledWith(makeAd());
  });

  it("renders Your Ad badge and Edit button for own ads", () => {
    renderWithProviders(
      <AdCard ad={makeAd()} onActionClick={vi.fn()} isOwnAd={true} />
    );
    expect(screen.getByText("Your Ad")).toBeInTheDocument();
    expect(screen.getByText("Edit Ad")).toBeInTheDocument();
  });

  it("shows verified icon for verified advertisers", () => {
    const { container } = renderWithProviders(
      <AdCard ad={makeAd()} onActionClick={vi.fn()} />
    );
    expect(container.querySelector(".text-buy")).toBeTruthy();
  });
});