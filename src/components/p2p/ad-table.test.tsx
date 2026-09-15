import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { AdTable } from "./ad-table";
import { Ad } from "@/src/stores/p2p-store";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const makeAd = (id: string, advertiserId: string, type: "BUY" | "SELL" = "BUY"): Ad => ({
  id,
  type,
  asset: "USDT",
  fiat: "USD",
  price: 100,
  availableQuantity: 5000,
  minQuantity: 50,
  maxQuantity: 1000,
  paymentMethods: ["Bank Transfer"],
  advertiser: {
    id: advertiserId,
    name: "Alice",
    verified: true,
    trades: 10,
    completionRate: 95,
    responseTime: "10 mins",
  },
});

describe("AdTable", () => {
  it("shows empty state when no ads", () => {
    renderWithProviders(<AdTable ads={[]} />);
    expect(screen.getByText("No ads found")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your filters")).toBeInTheDocument();
  });

  it("renders each ad", () => {
    const ads = [
      makeAd("ad-1", "adv-1"),
      makeAd("ad-2", "adv-2", "SELL"),
    ];
    renderWithProviders(<AdTable ads={ads} />);
    expect(screen.getByText("Sell USDT")).toBeInTheDocument();
    expect(screen.getByText("Buy USDT")).toBeInTheDocument();
  });

  it("navigates to create order for other advertisers' ads", () => {
    const ads = [makeAd("ad-1", "adv-other")];
    renderWithProviders(<AdTable ads={ads} currentUserId="me-1" />);
    fireEvent.click(screen.getByText("Sell USDT"));
    expect(pushMock).toHaveBeenCalledWith("/p2p/order/create?adId=ad-1");
  });

  it("navigates to edit for own ads", () => {
    const ads = [makeAd("ad-own", "me-1")];
    renderWithProviders(<AdTable ads={ads} currentUserId="me-1" />);
    // Own ad shows Edit Ad instead of Sell/Buy
    fireEvent.click(screen.getByText("Edit Ad"));
    expect(pushMock).toHaveBeenCalledWith("/p2p/ads/edit/ad-own");
  });
});