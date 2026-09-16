import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { usePortfolioWs } from "@/src/hooks/use-portfolio-ws";

vi.mock("@/src/hooks/use-portfolio-ws", () => ({
  usePortfolioWs: vi.fn(),
}));

import { FundingAccountTransferGate } from "./funding-account-transfer-gate";

const mockUsePortfolioWs = vi.mocked(usePortfolioWs);

function mockWs(coins: any[] = []) {
  mockUsePortfolioWs.mockReturnValue({
    coins,
    balances: {},
    isLoading: false,
    isAllocationsLoading: false,
    allocations: null,
    marginAccount: null,
    futuresPositions: [],
    isConnected: false,
    refreshBalances: () => {},
  } as any);
}

describe("FundingAccountTransferGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWs([]);
  });

  const makeProps = (overrides = {}) => ({
    isOpen: true,
    onClose: vi.fn(),
    asset: "BTC",
    onTransferComplete: vi.fn(),
    ...overrides,
  });

  it("renders the transfer gate", () => {
    renderWithProviders(<FundingAccountTransferGate {...makeProps()} />);
    expect(screen.getByText("Transfer to Funding Account")).toBeTruthy();
    expect(screen.getByText("Spot Account")).toBeInTheDocument();
    expect(screen.getByText("Funding Account")).toBeInTheDocument();
  });

  it("shows available balance from portfolio", () => {
    mockWs([{ symbol: "BTC", spotBalance: "1.5", fundingBalance: "0" }]);
    renderWithProviders(<FundingAccountTransferGate {...makeProps()} />);
    expect(screen.getByText(/Available: 1.5 BTC/)).toBeInTheDocument();
  });

  it("shows 0 available when no matching asset", () => {
    renderWithProviders(<FundingAccountTransferGate {...makeProps()} />);
    expect(screen.getByText(/Available: 0 BTC/)).toBeInTheDocument();
  });

  it("disables transfer until amount is valid", () => {
    renderWithProviders(<FundingAccountTransferGate {...makeProps()} />);
    const confirmBtn = screen.getByText("Confirm Transfer").closest("button");
    expect(confirmBtn).toBeDisabled();
  });

  it("calls onTransferComplete and onClose on confirm", () => {
    mockWs([{ symbol: "BTC", spotBalance: "1.5", fundingBalance: "0" }]);
    const props = makeProps();
    renderWithProviders(<FundingAccountTransferGate {...props} />);
    const amountInput = screen.getByPlaceholderText("0.00");
    fireEvent.change(amountInput, { target: { value: "1" } });
    const confirmBtn = screen.getByText("Confirm Transfer").closest("button");
    expect(confirmBtn).toBeEnabled();
    fireEvent.click(confirmBtn!);
    expect(props.onTransferComplete).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("prevents transfer amount exceeding balance", () => {
    mockWs([{ symbol: "BTC", spotBalance: "0.5", fundingBalance: "0" }]);
    renderWithProviders(<FundingAccountTransferGate {...makeProps()} />);
    const amountInput = screen.getByPlaceholderText("0.00");
    fireEvent.change(amountInput, { target: { value: "2" } });
    const confirmBtn = screen.getByText("Confirm Transfer").closest("button");
    expect(confirmBtn).toBeDisabled();
  });
});