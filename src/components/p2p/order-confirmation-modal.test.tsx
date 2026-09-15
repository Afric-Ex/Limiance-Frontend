import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { OrderConfirmationModal } from "./order-confirmation-modal";

const makeProps = (overrides = {}) => ({
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  type: "BUY" as const,
  asset: "BTC",
  fiat: "USD",
  cryptoAmount: 0.5,
  fiatAmount: 52000,
  price: 104000,
  isLoading: false,
  ...overrides,
});

describe("OrderConfirmationModal", () => {
  it("renders nothing when closed", () => {
    renderWithProviders(<OrderConfirmationModal {...makeProps({ isOpen: false })} />);
    expect(screen.queryByText("Confirm Order")).not.toBeInTheDocument();
  });

  it("renders buy order summary", () => {
    renderWithProviders(<OrderConfirmationModal {...makeProps()} />);
    expect(screen.getByText("Confirm Order")).toBeInTheDocument();
    expect(screen.getByText("buy")).toBeInTheDocument();
    expect(screen.getByText("0.5")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText(/52,000.00 USD/)).toBeInTheDocument();
    expect(screen.getByText("104,000 USD")).toBeInTheDocument();
    expect(screen.getByText("BUY")).toBeInTheDocument();
  });

  it("renders sell order with sell button label", () => {
    renderWithProviders(
      <OrderConfirmationModal {...makeProps({ type: "SELL" })} />
    );
    expect(screen.getByText("sell")).toBeInTheDocument();
    expect(screen.getByText("Confirm SELL")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button clicked", () => {
    const props = makeProps();
    renderWithProviders(<OrderConfirmationModal {...props} />);
    fireEvent.click(screen.getByText("Confirm BUY"));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables confirm and shows Processing while loading", () => {
    renderWithProviders(
      <OrderConfirmationModal {...makeProps({ isLoading: true })} />
    );
    const confirmBtn = screen.getByText("Processing...");
    expect(confirmBtn).toBeDisabled();
  });

  it("calls onClose on cancel button", () => {
    const props = makeProps();
    renderWithProviders(<OrderConfirmationModal {...props} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("calls onClose when X clicked", () => {
    const props = makeProps();
    renderWithProviders(<OrderConfirmationModal {...props} />);
    fireEvent.click(screen.getByText("×"));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("calls onClose when backdrop clicked", () => {
    const props = makeProps();
    const { container } = renderWithProviders(<OrderConfirmationModal {...props} />);
    const backdrop = container.querySelector('[class*="bg-black"]') as HTMLElement;
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);
    expect(props.onClose).toHaveBeenCalled();
  });
});
