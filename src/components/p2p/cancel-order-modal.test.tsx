import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { CancelOrderModal } from "./cancel-order-modal";

const makeProps = (overrides = {}) => ({
  opened: true,
  onClose: vi.fn(),
  isBuyer: true,
  orderId: "order-1234567890",
  cryptoAmount: 0.5,
  asset: "BTC",
  isUpdating: false,
  handleCancel: vi.fn(),
  ...overrides,
});

describe("CancelOrderModal", () => {
  it("renders order details", () => {
    const props = makeProps();
    renderWithProviders(<CancelOrderModal {...props} />);
    expect(screen.getAllByText("Cancel Order").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(props.orderId.slice(-8).toUpperCase())).toBeInTheDocument();
    expect(screen.getByText(/0.5 BTC/)).toBeInTheDocument();
  });

  it("shows buyer info and buyer reasons", () => {
    renderWithProviders(<CancelOrderModal {...makeProps()} />);
    expect(screen.getByText(/No funds will be deducted/)).toBeInTheDocument();
    expect(screen.getAllByText("I made a mistake").length).toBeGreaterThan(0);
  });

  it("shows seller warning and seller reasons for sellers", () => {
    renderWithProviders(<CancelOrderModal {...makeProps({ isBuyer: false })} />);
    expect(screen.getByText(/will be immediately returned/)).toBeInTheDocument();
    expect(screen.getAllByText(/Buyer is not responding in chat/).length).toBeGreaterThan(0);
  });

  it("shows the allowed-cancellations note only for buyers", () => {
    renderWithProviders(<CancelOrderModal {...makeProps()} />);
    expect(screen.getByText(/You have cancelled 0 of 3 allowed orders/)).toBeInTheDocument();
  });

  it("disables Cancel Order button until a reason is chosen", () => {
    renderWithProviders(<CancelOrderModal {...makeProps()} />);
    const cancelOrderBtn = screen.getAllByText("Cancel Order")[1]?.closest("button");
    expect(cancelOrderBtn).toBeDisabled();
  });

  it("calls handleCancel with selected reason", () => {
    const props = makeProps();
    renderWithProviders(<CancelOrderModal {...props} />);
    const selectInput = screen.getByPlaceholderText("Choose a reason");
    fireEvent.click(selectInput);
    fireEvent.click(screen.getAllByText("I made a mistake")[0]);

    const cancelBtn = screen.getAllByText("Cancel Order")[1]?.closest("button");
    fireEvent.click(cancelBtn!);
    expect(props.handleCancel).toHaveBeenCalledWith("I made a mistake");
  });

  it("calls onClose when Keep Order is clicked", () => {
    const props = makeProps();
    renderWithProviders(<CancelOrderModal {...props} />);
    fireEvent.click(screen.getByText("Keep Order"));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("does not call handleCancel without a reason", () => {
    const props = makeProps();
    renderWithProviders(<CancelOrderModal {...props} />);
    const cancelBtn = screen.getAllByText("Cancel Order")[1]?.closest("button");
    fireEvent.click(cancelBtn!);
    expect(props.handleCancel).not.toHaveBeenCalled();
  });
});
