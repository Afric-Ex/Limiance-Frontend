import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { useUserStore } from "@/src/stores/user-store";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const mocks = vi.hoisted(() => ({
  asset: {
    internalTransfer: vi.fn(() => Promise.resolve({ data: {} })),
  },
  modalsOpen: vi.fn(),
  modalsCloseAll: vi.fn(),
  errorNotification: vi.fn(),
  errorMessageHandler: vi.fn(),
  refreshBalances: vi.fn(),
}));

vi.mock("@/src/services/asset", () => ({
  asset: mocks.asset,
}));

vi.mock("@mantine/modals", () => ({
  modals: { open: mocks.modalsOpen, closeAll: mocks.modalsCloseAll },
}));

vi.mock("@/src/lib/notification-handler", () => ({
  errorNotification: mocks.errorNotification,
}));

vi.mock("@/src/lib/error-handler", () => ({ errorMessageHandler: mocks.errorMessageHandler }));

vi.mock("@/src/hooks/use-portfolio-ws", () => ({
  usePortfolioWs: () => ({
    coins: [
      {
        symbol: "BTC",
        name: "Bitcoin",
        image: "",
        spotBalance: "0.5",
        fundingBalance: "1",
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
        setSelectedCoin({ name: "Bitcoin", symbol: "BTC", image: "", contractAddress: "" })
      }
    >
      {selectedCoin?.symbol || "Select asset"}
    </button>
  ),
}));

vi.mock("@/src/components/login/verify-email-success", () => ({
  SuccessModal: () => <div>Success Modal</div>,
}));

import { InternalTransfer } from "./internal-transfer";

const successArgs = () => mocks.modalsOpen.mock.calls[0][0];

describe("InternalTransfer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({ user: null });
  });

  it("renders the transfer form with default wallets", () => {
    renderWithProviders(<InternalTransfer />);
    expect(screen.getByText("Internal Transfer")).toBeInTheDocument();
    expect(screen.getByText("Move funds between your accounts")).toBeInTheDocument();
    expect(screen.getByText("Select Coin")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Available for transfer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm Transfer" })).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toHaveTextContent("Spot");
    expect(buttons[3]).toHaveTextContent("Funding");
  });

  it("swaps the source and destination wallets", () => {
    renderWithProviders(<InternalTransfer />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toHaveTextContent("Spot");
    expect(buttons[3]).toHaveTextContent("Funding");
    fireEvent.click(buttons[2]);
    expect(screen.getAllByRole("button")[1]).toHaveTextContent("Funding");
    expect(screen.getAllByRole("button")[3]).toHaveTextContent("Spot");
  });

  it("blocks transferring between the same wallet", () => {
    renderWithProviders(<InternalTransfer defaultFrom="spot" defaultTo="spot" />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm Transfer" }));
    expect(mocks.errorNotification).toHaveBeenCalledWith(
      "You cannot transfer between the same wallet"
    );
    expect(mocks.asset.internalTransfer).not.toHaveBeenCalled();
  });

  it("executes the internal transfer and opens the success modal", async () => {
    renderWithProviders(<InternalTransfer />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm Transfer" }));

    await waitFor(() => {
      expect(mocks.asset.internalTransfer).toHaveBeenCalledWith({
        symbol: "",
        fromBalance: "spot",
        toBalance: "funding",
        amount: "",
        totpCode: undefined,
      });
    });
    expect(mocks.modalsOpen).toHaveBeenCalledTimes(1);
    expect(successArgs().children.type.name).toBe("SuccessModal");
    expect(mocks.refreshBalances).toHaveBeenCalled();
  });

  it("opens the authenticator modal when 2FA is enabled", () => {
    useUserStore.setState({
      user: { twoFaEnabled: true, email: "a@b.com" } as any,
    });
    renderWithProviders(<InternalTransfer />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm Transfer" }));
    expect(mocks.asset.internalTransfer).not.toHaveBeenCalled();
    expect(mocks.modalsOpen).toHaveBeenCalledTimes(1);
    expect(successArgs().children.type.name).toBe("AuthenticatorVerificationModal");
  });
});