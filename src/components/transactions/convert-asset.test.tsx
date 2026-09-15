import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { queryResults } from "@/src/test/react-query-mock";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const mocks = vi.hoisted(() => ({
  asset: {
    convertAsset: vi.fn(() => Promise.resolve({ data: {} })),
  },
  tradingService: {
    conversionRate: vi.fn(() => Promise.resolve({ data: {} })),
  },
  modalsOpen: vi.fn(),
  modalsCloseAll: vi.fn(),
  errorMessageHandler: vi.fn(),
  refreshBalances: vi.fn(),
}));

vi.mock("@/src/services/asset", () => ({
  asset: mocks.asset,
  assetKeys: {},
}));

vi.mock("@/src/services/trading", () => ({ tradingService: mocks.tradingService }));

vi.mock("@mantine/modals", () => ({
  modals: { open: mocks.modalsOpen, closeAll: mocks.modalsCloseAll },
}));

vi.mock("@/src/lib/error-handler", () => ({ errorMessageHandler: mocks.errorMessageHandler }));

vi.mock("@/src/hooks/use-portfolio-ws", () => ({
  usePortfolioWs: () => ({
    coins: [
      {
        symbol: "BTC",
        name: "Bitcoin",
        image: "",
        spotBalance: "2",
        fundingBalance: "100",
        futuresBalance: "0",
        marginBalance: "0",
      },
    ],
    isLoading: false,
    refreshBalances: mocks.refreshBalances,
  }),
}));

vi.mock("@/src/components/assets/supported-pairs-dropdown", () => ({
  SupportedListingsDropdown: ({ selectedCoin, setSelectedCoin }: any) => (
    <button
      type="button"
      data-testid="asset-dropdown"
      onClick={() =>
        setSelectedCoin({ name: "Tether", symbol: "USDT", image: "", contractAddress: "" })
      }
    >
      {selectedCoin?.symbol || "Select asset"}
    </button>
  ),
}));

vi.mock("@/src/components/login/verify-email-success", () => ({
  SuccessModal: () => <div>Success Modal</div>,
}));

import { ConvertAsset } from "./convert-asset";

describe("ConvertAsset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults["conversion-rate-preview"] = {
      data: { baseInQuote: "70000", baseRate: "70000" },
      isFetching: false,
      isError: false,
    };
  });

  it("renders the convert form with the submit disabled", () => {
    renderWithProviders(<ConvertAsset />);
    expect(screen.getAllByText("Convert").length).toBeGreaterThan(0);
    expect(screen.getByText("Swap one asset for another instantly")).toBeInTheDocument();
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("To")).toBeInTheDocument();
    expect(screen.getByText("Source Account")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Convert" })).toBeDisabled();
  });

  it("hydrates the from asset and shows the available balance", () => {
    renderWithProviders(<ConvertAsset defaultFromAsset="BTC" />);
    expect(screen.getByText(/Available:/)).toBeInTheDocument();
    expect(screen.getAllByText("100 BTC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BTC").length).toBeGreaterThan(0);
  });

  it("requests a conversion rate once both assets and an amount are set", () => {
    renderWithProviders(<ConvertAsset defaultFromAsset="BTC" />);
    fireEvent.click(screen.getAllByTestId("asset-dropdown")[1]);
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "10" } });
    expect(mocks.tradingService.conversionRate).toHaveBeenLastCalledWith({
      fromAsset: "BTC",
      toAsset: "USDT",
      quantity: "10",
    });
    expect(screen.getByText("1 BTC ≈ 70,000 USDT")).toBeInTheDocument();
  });

  it("converts the asset and opens the success modal", async () => {
    renderWithProviders(<ConvertAsset defaultFromAsset="BTC" />);
    fireEvent.click(screen.getAllByTestId("asset-dropdown")[1]);
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "10" } });

    const convertButton = screen.getByRole("button", { name: "Convert" });
    expect(convertButton).not.toBeDisabled();
    fireEvent.click(convertButton);

    await waitFor(() => {
      expect(mocks.asset.convertAsset).toHaveBeenCalledWith({
        fromAsset: "BTC",
        toAsset: "USDT",
        amount: "10",
        sourceWallet: "funding",
      });
    });
    expect(mocks.modalsOpen).toHaveBeenCalledTimes(1);
    expect(mocks.modalsOpen.mock.calls[0][0].children.type.name).toBe("SuccessModal");
    expect(mocks.refreshBalances).toHaveBeenCalled();
  });
});