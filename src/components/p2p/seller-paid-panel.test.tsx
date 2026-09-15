import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { SellerPaidPanel } from "./seller-paid-panel";

const makeProps = (overrides = {}) => ({
  counterpartyName: "Bob",
  fiatAmount: 50000,
  fiat: "USD",
  paymentMethod: { method: "Bank Transfer", data: { bankName: "Chase" } },
  updatedAt: "2025-06-15T12:00:00Z",
  setReleaseModalOpen: vi.fn(),
  onDisputeOpen: vi.fn(),
  ...overrides,
});

describe("SellerPaidPanel", () => {
  it("shows buyer confirmed payment banner", () => {
    renderWithProviders(<SellerPaidPanel {...makeProps()} />);
    expect(screen.getByText(/Buyer Has Confirmed Payment/)).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText(/50,000.00 USD/)).toBeInTheDocument();
  });

  it("shows the check-bank warning", () => {
    renderWithProviders(<SellerPaidPanel {...makeProps()} />);
    expect(screen.getByText(/Check your Chase account NOW/)).toBeInTheDocument();
  });

  it("shows irreversible release warning", () => {
    renderWithProviders(<SellerPaidPanel {...makeProps()} />);
    expect(screen.getByText("Releasing crypto is IRREVERSIBLE. Once released, it cannot be undone.")).toBeInTheDocument();
  });

  it("opens release modal", () => {
    const props = makeProps();
    renderWithProviders(<SellerPaidPanel {...props} />);
    fireEvent.click(screen.getByText("Release Crypto"));
    expect(props.setReleaseModalOpen).toHaveBeenCalledWith(true);
  });

  it("opens dispute panel", () => {
    const props = makeProps();
    renderWithProviders(<SellerPaidPanel {...props} />);
    fireEvent.click(screen.getByText("File Dispute"));
    expect(props.onDisputeOpen).toHaveBeenCalled();
  });
});