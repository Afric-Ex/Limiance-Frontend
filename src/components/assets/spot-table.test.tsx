import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  modalsOpen: vi.fn(),
  portfolio: [
    {
      symbol: "BTC",
      name: "Bitcoin",
      image: "/btc.png",
      spotBalance: "1",
      currencyPrice: "60000",
    },
    {
      symbol: "SHIB",
      name: "Shiba Inu",
      image: "",
      spotBalance: "100000",
      currencyPrice: "0.000005",
    },
    {
      symbol: "USDT",
      name: "Tether",
      image: "",
      spotBalance: "0",
      currencyPrice: "1",
    },
  ],
  loading: false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@mantine/modals", () => ({
  modals: { open: mocks.modalsOpen },
}));

vi.mock("@/src/hooks/use-portfolio-ws", () => ({
  usePortfolioWs: () => ({ coins: mocks.portfolio, isLoading: mocks.loading }),
}));

vi.mock("@/src/utils/crypto-icons", () => ({
  getCryptoIcon: (symbol: string, fallback: string) => fallback || `/icons/${symbol}.png`,
}));

import { SpotTable } from "./spot-table";

describe("SpotTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loading = false;
  });

  it("renders the spot table with coin amounts and prices", () => {
    renderWithProviders(<SpotTable />);
    expect(screen.getByText("Spot")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getAllByText("$60,000.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
  });

  it("hides assets under $1 when the checkbox is enabled", () => {
    renderWithProviders(<SpotTable />);
    expect(screen.getAllByText("SHIB").length).toBe(1);
    fireEvent.click(screen.getByLabelText("Hide Asset <$1"));
    expect(screen.queryByText("SHIB")).not.toBeInTheDocument();
    expect(screen.getAllByText("BTC").length).toBeGreaterThan(0);
  });

  it("navigates to spot trading when Trade is clicked", () => {
    renderWithProviders(<SpotTable />);
    fireEvent.click(screen.getAllByText("Trade")[0]);
    expect(mocks.push).toHaveBeenCalledWith("/trades/spot");
  });

  it("opens the convert modal when Convert is clicked", () => {
    renderWithProviders(<SpotTable />);
    fireEvent.click(screen.getAllByText("Convert")[0]);
    expect(mocks.modalsOpen).toHaveBeenCalled();
  });

  it("renders the inline loader while loading", () => {
    mocks.loading = true;
    renderWithProviders(<SpotTable />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});