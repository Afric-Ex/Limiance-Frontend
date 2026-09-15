import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { useBalanceCloakStore } from "@/src/stores/balance-cloak-store";
import { useUserStore } from "@/src/stores/user-store";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  handleOpenDepositModal: vi.fn(),
  handleOpenInternalTransferModal: vi.fn(),
  modalsOpen: vi.fn(),
  walletBalances: {
    funding: { inUsd: "1234.56", inBtc: "0.01842000" },
    trading: { inUsd: "4000.00", inBtc: "0.06000000" },
    isLoading: false,
    isConnected: true,
  },
  toastLoading: vi.fn(),
  toastDismiss: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/src/hooks/use-assets", () => ({
  useAssets: () => ({
    handleOpenDepositModal: mocks.handleOpenDepositModal,
    handleOpenInternalTransferModal: mocks.handleOpenInternalTransferModal,
  }),
}));

vi.mock("@mantine/modals", () => ({
  modals: { open: mocks.modalsOpen },
}));

vi.mock("@/src/hooks/use-wallet-balances", () => ({
  useWalletBalances: () => mocks.walletBalances,
}));

vi.mock("react-hot-toast", () => ({
  default: {
    loading: (...args: any[]) => mocks.toastLoading(...args),
    dismiss: (...args: any[]) => mocks.toastDismiss(...args),
  },
}));

import { MyWallet } from "./my-wallet";

describe("MyWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useBalanceCloakStore.setState({ enabled: false });
    useUserStore.setState({ hideBalance: false });
    mocks.walletBalances = {
      funding: { inUsd: "1234.56", inBtc: "0.01842000" },
      trading: { inUsd: "4000.00", inBtc: "0.06000000" },
      isLoading: false,
      isConnected: true,
    };
  });

  it("renders Funding and Unified Trading rows with balances", () => {
    renderWithProviders(<MyWallet />);
    expect(screen.getByText("Funding")).toBeInTheDocument();
    expect(screen.getByText("Unified Trading")).toBeInTheDocument();
    // Funding balances - BalanceCloak uses toLocaleString so btc truncated to 3 decimals
    // btc values are inside "≈ 0.018" spans, so use regex substring match
    expect(screen.getByText("1,234.56")).toBeInTheDocument();
    expect(screen.getByText(/0\.018/)).toBeInTheDocument();
    // Trading balances
    expect(screen.getByText("4,000")).toBeInTheDocument();
    expect(screen.getByText(/0\.06/)).toBeInTheDocument();
  });

  it("shows skeletons when loading", () => {
    mocks.walletBalances = {
      funding: null,
      trading: null,
      isLoading: true,
      isConnected: false,
    };
    const { container } = renderWithProviders(<MyWallet />);
    // skeletons have class skeleton
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
  });

  it("cloak toggle hides and shows balances", () => {
    renderWithProviders(<MyWallet />);
    // initially visible
    expect(screen.getByText("1,234.56")).toBeInTheDocument();
    const toggle = screen.getByTestId("cloak-toggle");
    fireEvent.click(toggle);
    // after cloak, balances hidden
    expect(screen.getAllByText("****").length).toBeGreaterThan(0);
    fireEvent.click(toggle);
    expect(screen.getByText("1,234.56")).toBeInTheDocument();
  });

  it("Funding row has 4 actions: Deposit, Withdraw, Transfer, Convert", () => {
    renderWithProviders(<MyWallet />);
    // Funding row actions are first 4 buttons with titles
    expect(screen.getByTitle("Deposit")).toBeInTheDocument();
    expect(screen.getByTitle("Withdraw")).toBeInTheDocument();
    // There are two Transfer buttons (Funding + Trading)
    expect(screen.getAllByTitle("Transfer").length).toBe(2);
    expect(screen.getAllByTitle("Convert").length).toBe(2);
  });

  it("Trading row Trade button navigates to /trade", () => {
    renderWithProviders(<MyWallet />);
    const tradeBtn = screen.getByRole("button", { name: "Trade" });
    fireEvent.click(tradeBtn);
    expect(mocks.push).toHaveBeenCalledWith("/trade");
  });

  it("calls correct handlers for Deposit, Withdraw, Transfer, Convert", () => {
    renderWithProviders(<MyWallet />);
    fireEvent.click(screen.getByTitle("Deposit"));
    expect(mocks.handleOpenDepositModal).toHaveBeenCalled();

    fireEvent.click(screen.getByTitle("Withdraw"));
    expect(mocks.push).toHaveBeenCalledWith("/transactions/withdrawal");

    fireEvent.click(screen.getAllByTitle("Transfer")[0]);
    expect(mocks.handleOpenInternalTransferModal).toHaveBeenCalled();

    fireEvent.click(screen.getAllByTitle("Convert")[0]);
    expect(mocks.modalsOpen).toHaveBeenCalled();
  });

  it("shows green dot when connected, red when disconnected, yellow when connecting", () => {
    // connected
    mocks.walletBalances.isConnected = true;
    mocks.walletBalances.isLoading = false;
    const { rerender } = renderWithProviders(<MyWallet />);
    let dot = screen.getByTestId("ws-status");
    expect(dot.className).toContain("bg-green-500");
    expect(dot).toHaveAttribute("aria-label", "Real-time balances connected");

    // connecting (loading && not connected)
    mocks.walletBalances.isConnected = false;
    mocks.walletBalances.isLoading = true;
    rerender(<MyWallet />);
    dot = screen.getByTestId("ws-status");
    expect(dot.className).toContain("bg-yellow-500");
    expect(dot).toHaveAttribute("aria-label", "Connecting...");

    // disconnected
    mocks.walletBalances.isConnected = false;
    mocks.walletBalances.isLoading = false;
    rerender(<MyWallet />);
    dot = screen.getByTestId("ws-status");
    expect(dot.className).toContain("bg-red-500");
    expect(dot).toHaveAttribute("aria-label", expect.stringContaining("Disconnected"));
  });

  it("is accessible: header toggle has aria-label and title", () => {
    renderWithProviders(<MyWallet />);
    const toggle = screen.getByTestId("cloak-toggle");
    expect(toggle).toHaveAttribute("aria-label", "Hide balances");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-label", "Show balances");
  });
});
