import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { FinalReleaseConfirmModal } from "./final-release-confirm-modal";

const makeProps = (overrides = {}) => ({
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  cryptoAmount: 0.5,
  asset: "BTC",
  fiatAmount: 50000,
  fiat: "USD",
  buyerName: "Alice",
  isProcessing: false,
  ...overrides,
});

describe("FinalReleaseConfirmModal", () => {
  it("renders the final confirmation details", () => {
    renderWithProviders(<FinalReleaseConfirmModal {...makeProps()} />);
    expect(screen.getByText(/Final Confirmation/)).toBeInTheDocument();
    expect(screen.getByText("0.5 BTC")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText(/50,000.00 USD/)).toBeInTheDocument();
  });

  it("shows irreversible warning", () => {
    renderWithProviders(<FinalReleaseConfirmModal {...makeProps()} />);
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
  });

  it("calls onConfirm on Release Now", () => {
    const props = makeProps();
    renderWithProviders(<FinalReleaseConfirmModal {...props} />);
    fireEvent.click(screen.getByText("Release Now"));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Cancel", () => {
    const props = makeProps();
    renderWithProviders(<FinalReleaseConfirmModal {...props} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("shows Releasing state while processing", () => {
    const props = makeProps({ isProcessing: true });
    renderWithProviders(<FinalReleaseConfirmModal {...props} />);
    expect(screen.getByText("Releasing...")).toBeInTheDocument();
    const cancelBtn = screen.getByText("Cancel").closest("button");
    expect(cancelBtn).toBeDisabled();
  });

  it("prevents onClose while processing", () => {
    const props = makeProps({ isProcessing: true });
    renderWithProviders(<FinalReleaseConfirmModal {...props} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onClose).not.toHaveBeenCalled();
  });
});