import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { OrderCancelledOverlay } from "./order-cancelled-overlay";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const baseProps = {
  orderId: "order-abc12345",
  cryptoAmount: 0.5,
  asset: "BTC",
  isBuyer: true,
  reason: "payment was not confirmed within the time limit.",
};

describe("OrderCancelledOverlay", () => {
  it("shows cancellation heading and reason", () => {
    renderWithProviders(<OrderCancelledOverlay {...baseProps} />);
    expect(screen.getByText("Order Cancelled")).toBeInTheDocument();
    expect(screen.getByText(/This order was automatically cancelled because/)).toBeInTheDocument();
  });

  it("shows order id and crypto amount", () => {
    renderWithProviders(<OrderCancelledOverlay {...baseProps} />);
    expect(screen.getByText("order-abc12345")).toBeInTheDocument();
    expect(screen.getByText("0.5 BTC")).toBeInTheDocument();
  });

  it("shows buyer message (no funds deducted)", () => {
    renderWithProviders(<OrderCancelledOverlay {...baseProps} isBuyer={true} />);
    expect(screen.getByText(/No funds were deducted/)).toBeInTheDocument();
  });

  it("shows seller message (crypto returned)", () => {
    renderWithProviders(<OrderCancelledOverlay {...baseProps} isBuyer={false} />);
    expect(screen.getByText(/safely returned to your Funding Account/)).toBeInTheDocument();
  });

  it("uses default reason when not provided", () => {
    const { reason: _ignored, ...noReason } = baseProps;
    renderWithProviders(<OrderCancelledOverlay {...noReason} />);
    expect(screen.getByText(/payment was not confirmed within the time limit/)).toBeInTheDocument();
  });

  it("routes back to marketplace", () => {
    renderWithProviders(<OrderCancelledOverlay {...baseProps} />);
    fireEvent.click(screen.getByText("Back to P2P Marketplace"));
    expect(pushMock).toHaveBeenCalledWith("/trades/p2p");
  });
});