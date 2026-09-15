import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { useBalanceCloakStore } from "@/src/stores/balance-cloak-store";
import { useUserStore } from "@/src/stores/user-store";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  openDeposit: vi.fn(),
  openInternalTransfer: vi.fn(),
  openExternalTransfer: vi.fn(),
  modalsOpen: vi.fn(),
  balances: {
    total: { inUsd: "5000.00", inBtc: "0.07500000" },
    funding: { inUsd: "1234.56", inBtc: "0.01842000" },
    spot: { inUsd: "4000.00", inBtc: "0.06000000" },
    futures: { inUsd: "3000.00", inBtc: "0.04500000" },
    margin: { inUsd: "0", inBtc: "0" },
  },
  loading: false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/src/hooks/use-assets", () => ({
  useAssets: () => ({
    handleOpenDepositModal: mocks.openDeposit,
    handleOpenInternalTransferModal: mocks.openInternalTransfer,
    handleOpenExternalTransferModal: mocks.openExternalTransfer,
  }),
}));

vi.mock("@/src/hooks/use-portfolio-ws", () => ({
  usePortfolioWs: () => ({
    balances: mocks.balances,
    isLoading: mocks.loading,
  }),
}));

vi.mock("@/src/hooks/use-daily-pnl", () => ({
  useDailyPnl: () => ({ pnl: 42.129, pnlPct: 0.87 }),
}));

vi.mock("@mantine/modals", () => ({
  modals: { open: mocks.modalsOpen },
}));

import { WalletCard } from "./wallet-card";

describe("WalletCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loading = false;
    mocks.balances.total = { inUsd: "5000.00", inBtc: "0.07500000" };
    useBalanceCloakStore.setState({ enabled: false });
    useUserStore.setState({ hideBalance: false });
  });

  it("renders the default title and total balance with PnL", () => {
    renderWithProviders(<WalletCard />);
    expect(screen.getByText("Assets Overview")).toBeInTheDocument();
    expect(screen.getByText("5,000")).toBeInTheDocument();
    expect(screen.getByText("≈")).toBeInTheDocument();
    expect(screen.getByText("Today's P&L")).toBeInTheDocument();
    expect(screen.getByText("+42.12")).toBeInTheDocument();
    expect(screen.getByText("(+0.87%)")).toBeInTheDocument();
  });

  it("renders the requested account title and its balance", () => {
    renderWithProviders(<WalletCard title="Funding Account" />);
    expect(screen.getByText("Funding Account")).toBeInTheDocument();
    expect(screen.getByText("1,234.56")).toBeInTheDocument();
    expect(screen.queryByText("Convert")).not.toBeInTheDocument();
  });

  it("shows skeletons while balances are loading", () => {
    mocks.loading = true;
    const { container } = renderWithProviders(<WalletCard title="Spot" />);
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
    expect(screen.getByText("2,000")).toBeInTheDocument();
  });

  it("runs the Deposit, Withdraw and Ext. Transfer actions", () => {
    renderWithProviders(<WalletCard title="Spot" />);
    fireEvent.click(screen.getByRole("button", { name: "Deposit" }));
    expect(mocks.openDeposit).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    expect(mocks.push).toHaveBeenCalledWith("/transactions/withdrawal");
    fireEvent.click(screen.getByRole("button", { name: "Ext. Transfer" }));
    expect(mocks.openExternalTransfer).toHaveBeenCalled();
  });

  it("opens the external transfer modal for Futures transfers", () => {
    renderWithProviders(<WalletCard title="Futures" />);
    fireEvent.click(screen.getByRole("button", { name: "Transfer" }));
    expect(mocks.openInternalTransfer).toHaveBeenCalledWith("funding", "futures");
  });

  it("opens the convert asset modal for non-funding accounts", () => {
    renderWithProviders(<WalletCard title="Spot" />);
    fireEvent.click(screen.getByRole("button", { name: "Convert" }));
    expect(mocks.modalsOpen).toHaveBeenCalled();
  });
});