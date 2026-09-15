import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { SellerPendingPanel } from "./seller-pending-panel";

const makeProps = (overrides = {}) => ({
  fiatAmount: 50000,
  fiat: "USD",
  paymentMethod: {
    method: "Bank Transfer",
    data: {
      bankName: "Chase",
      accountName: "John Doe",
      accountNumber: "123456789",
    },
  },
  setCancelModalOpen: vi.fn(),
  copyToClipboard: vi.fn(),
  ...overrides,
});

describe("SellerPendingPanel", () => {
  it("shows waiting for buyer message", () => {
    renderWithProviders(<SellerPendingPanel {...makeProps()} />);
    expect(screen.getByText("Waiting for Buyer")).toBeInTheDocument();
    expect(screen.getByText(/The buyer is currently making payment/)).toBeInTheDocument();
  });

  it("renders payment details when provided", () => {
    renderWithProviders(<SellerPendingPanel {...makeProps()} />);
    expect(screen.getByText("Chase")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("123456789")).toBeInTheDocument();
    expect(screen.getByText(/50,000.00 USD/)).toBeInTheDocument();
  });

  it("copies account number to clipboard", () => {
    const props = makeProps();
    renderWithProviders(<SellerPendingPanel {...props} />);
    fireEvent.click(screen.getByText("Copy"));
    expect(props.copyToClipboard).toHaveBeenCalledWith("123456789");
  });

  it("does not render payment details block when paymentMethod missing", () => {
    renderWithProviders(
      <SellerPendingPanel {...makeProps({ paymentMethod: null })} />
    );
    expect(screen.queryByText("Your Payment Details")).not.toBeInTheDocument();
    expect(screen.queryByText("Copy")).not.toBeInTheDocument();
  });

  it("opens cancel modal", () => {
    const props = makeProps();
    renderWithProviders(<SellerPendingPanel {...props} />);
    fireEvent.click(screen.getByText("Cancel Order"));
    expect(props.setCancelModalOpen).toHaveBeenCalledWith(true);
  });
});