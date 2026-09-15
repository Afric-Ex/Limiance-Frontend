import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { BuyerPendingPanel } from "./buyer-pending-panel";

const makeProps = (overrides = {}) => ({
  orderId: "order-abc123456789",
  fiatAmount: 2500,
  fiat: "USD",
  paymentMethod: {
    method: "Bank Transfer",
    data: {
      bankName: "Chase",
      accountName: "John Doe",
      accountNumber: "123456789",
    },
  },
  deadlineStr: new Date(Date.now() + 600_000).toISOString(),
  setCancelModalOpen: vi.fn(),
  setPaymentModalOpen: vi.fn(),
  copyToClipboard: vi.fn(),
  ...overrides,
});

describe("BuyerPendingPanel", () => {
  it("shows countdown and payment instructions", () => {
    renderWithProviders(<BuyerPendingPanel {...makeProps()} />);
    expect(screen.getByText(/Pay within/)).toBeInTheDocument();
    expect(screen.getByText("Payment Instructions")).toBeInTheDocument();
    expect(screen.getByText("Chase")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("123456789")).toBeInTheDocument();
    expect(screen.getByText(/2,500.00 USD/)).toBeInTheDocument();
  });

  it("shows the order reference for payment narration", () => {
    renderWithProviders(<BuyerPendingPanel {...makeProps()} />);
    expect(screen.getByText("23456789")).toBeInTheDocument();
  });

  it("copies account number", () => {
    const props = makeProps();
    renderWithProviders(<BuyerPendingPanel {...props} />);
    fireEvent.click(screen.getAllByText("Copy")[0]);
    expect(props.copyToClipboard).toHaveBeenCalledWith("123456789");
  });

  it("copies fiat amount", () => {
    const props = makeProps();
    renderWithProviders(<BuyerPendingPanel {...props} />);
    const copies = screen.getAllByText("Copy");
    fireEvent.click(copies[1]);
    expect(props.copyToClipboard).toHaveBeenCalledWith("2500");
  });

  it("opens payment modal", () => {
    const props = makeProps();
    renderWithProviders(<BuyerPendingPanel {...props} />);
    fireEvent.click(screen.getByText("I Have Paid"));
    expect(props.setPaymentModalOpen).toHaveBeenCalledWith(true);
  });

  it("opens cancel modal", () => {
    const props = makeProps();
    renderWithProviders(<BuyerPendingPanel {...props} />);
    fireEvent.click(screen.getByText("Cancel Order"));
    expect(props.setCancelModalOpen).toHaveBeenCalledWith(true);
  });

  it("does not render payment block without paymentMethod", () => {
    renderWithProviders(
      <BuyerPendingPanel {...makeProps({ paymentMethod: null })} />
    );
    expect(screen.queryByText("Payment Instructions")).not.toBeInTheDocument();
  });
});
