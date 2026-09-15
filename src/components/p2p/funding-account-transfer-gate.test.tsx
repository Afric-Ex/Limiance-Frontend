import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { queryResults } from "@/src/test/react-query-mock";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const { fetchPortfolio } = vi.hoisted(() => ({
  fetchPortfolio: vi.fn(() => Promise.resolve({ data: [] })),
}));

vi.mock("@/src/services/asset", () => ({
  asset: { fetchPortfolio },
  assetKeys: { portfolio: () => ["portfolio"] },
}));

import { FundingAccountTransferGate } from "./funding-account-transfer-gate";

describe("FundingAccountTransferGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults["portfolio"] = { data: [], isLoading: false };
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
    queryResults["portfolio"] = {
      data: [{ symbol: "BTC", spotBalance: "1.5", fundingBalance: "0" }],
      isLoading: false,
    };
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
    queryResults["portfolio"] = {
      data: [{ symbol: "BTC", spotBalance: "1.5", fundingBalance: "0" }],
      isLoading: false,
    };
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
    queryResults["portfolio"] = {
      data: [{ symbol: "BTC", spotBalance: "0.5", fundingBalance: "0" }],
      isLoading: false,
    };
    renderWithProviders(<FundingAccountTransferGate {...makeProps()} />);
    const amountInput = screen.getByPlaceholderText("0.00");
    fireEvent.change(amountInput, { target: { value: "2" } });
    const confirmBtn = screen.getByText("Confirm Transfer").closest("button");
    expect(confirmBtn).toBeDisabled();
  });
});