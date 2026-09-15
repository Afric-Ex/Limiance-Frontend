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
  asset: {
    getExternalTransferCode: vi.fn(() => Promise.resolve({ data: "123456" })),
    externalTransfer: vi.fn(() => Promise.resolve({ data: {} })),
  },
  modalsOpen: vi.fn(),
  modalsCloseAll: vi.fn(),
  successNotification: vi.fn(),
  errorMessageHandler: vi.fn(),
  refreshBalances: vi.fn(),
}));

vi.mock("@/src/services/asset", () => ({
  asset: mocks.asset,
  assetKeys: {},
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
    coins: [],
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
        setSelectedCoin({ name: "Bitcoin", symbol: "BTC", image: "", contractAddress: "" })
      }
    >
      {selectedCoin?.symbol || "Select asset"}
    </button>
  ),
}));

import { ExternalTransfer } from "./external-transfer";

describe("ExternalTransfer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the transfer layout with the request step active", () => {
    renderWithProviders(<ExternalTransfer />);
    expect(screen.getByText("External Transfer")).toBeInTheDocument();
    expect(screen.getAllByText("Request Code").length).toBeGreaterThan(0);
    expect(screen.getByText("Transfer")).toBeInTheDocument();
    expect(screen.getByText("From Wallet")).toBeInTheDocument();
    expect(screen.getByText("Recipient Wallet")).toBeInTheDocument();
    expect(screen.getAllByText("Asset").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Amount").length).toBeGreaterThan(0);
    expect(screen.getByText("Recipient User ID")).toBeInTheDocument();
    expect(screen.getByText("Release Code")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Request Code" }).at(-1)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Continue to Transfer" })).toBeDisabled();
  });

  it("requests a release code and displays it", async () => {
    renderWithProviders(<ExternalTransfer />);
    fireEvent.click(screen.getAllByTestId("asset-dropdown")[0]);
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "1" } });

    const requestButton = screen.getAllByRole("button", { name: "Request Code" }).at(-1)!;
    expect(requestButton).not.toBeDisabled();
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(mocks.asset.getExternalTransferCode).toHaveBeenCalledWith("BTC");
    });
    await waitFor(() => {
      expect(mocks.successNotification).toHaveBeenCalled();
    });
    expect(screen.getByText("123456")).toBeInTheDocument();
    expect(screen.getByText("Transfer Receipt")).toBeInTheDocument();
  });

  it("creates the release code on error and surfaces the error", async () => {
    mocks.asset.getExternalTransferCode.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<ExternalTransfer />);
    fireEvent.click(screen.getAllByTestId("asset-dropdown")[0]);
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "1" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Request Code" }).at(-1)!);
    await waitFor(() => {
      expect(mocks.errorMessageHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it("executes the transfer with the release code", async () => {
    renderWithProviders(<ExternalTransfer />);
    fireEvent.click(screen.getAllByTestId("asset-dropdown")[0]);
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("Recipient user ID"), { target: { value: "u123" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Request Code" }).at(-1)!);

    await waitFor(() => {
      expect(screen.getByText("123456")).toBeInTheDocument();
    });
    expect(screen.getByText("Confirm Transfer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm Transfer" }));

    await waitFor(() => {
      expect(mocks.asset.externalTransfer).toHaveBeenCalledWith({
        toUserId: "u123",
        symbol: "BTC",
        fromBalance: "spot_balance",
        toBalance: "spot_balance",
        amount: "1",
        releaseCode: "123456",
      });
    });
    expect(mocks.successNotification).toHaveBeenCalledWith("Transfer successful");
    expect(mocks.modalsCloseAll).toHaveBeenCalled();
    expect(mocks.refreshBalances).toHaveBeenCalled();
  });
});