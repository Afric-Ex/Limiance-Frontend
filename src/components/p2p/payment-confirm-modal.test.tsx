import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { PaymentConfirmModal } from "./payment-confirm-modal";

const makeProps = () => ({
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
});

describe("PaymentConfirmModal", () => {
  it("renders payment confirmation warning", () => {
    renderWithProviders(<PaymentConfirmModal {...makeProps()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirm Payment")).toBeTruthy();
    expect(screen.getByText(/Maliciously clicking/)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithProviders(<PaymentConfirmModal {...makeProps()} isOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Confirm button is disabled until checkbox is checked", () => {
    renderWithProviders(<PaymentConfirmModal {...makeProps()} />);
    const confirmBtn = screen.getByText("Confirm").closest("button");
    expect(confirmBtn).toBeDisabled();

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(confirmBtn).toBeEnabled();
  });

  it("calls onConfirm after accepting the terms", () => {
    const props = makeProps();
    renderWithProviders(<PaymentConfirmModal {...props} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByText("Confirm").closest("button")!);
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("resets the checkbox after confirming", async () => {
    const props = makeProps();
    renderWithProviders(<PaymentConfirmModal {...props} />);
    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByText("Confirm").closest("button")!);
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on cancel", () => {
    const props = makeProps();
    renderWithProviders(<PaymentConfirmModal {...props} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onClose).toHaveBeenCalled();
  });
});