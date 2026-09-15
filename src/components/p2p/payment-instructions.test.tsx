import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { PaymentInstructions } from "./payment-instructions";

const method = {
  method: "Bank Transfer",
  accountName: "John Doe",
  accountNumber: "1234567890",
  bankName: "Chase Bank",
};

describe("PaymentInstructions", () => {
  it("renders all payment details", () => {
    renderWithProviders(<PaymentInstructions method={method} />);
    expect(screen.getByText("Payment Information")).toBeInTheDocument();
    expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(screen.getByText("Chase Bank")).toBeInTheDocument();
  });

  it("renders the important warning notice", () => {
    renderWithProviders(<PaymentInstructions method={method} />);
    expect(screen.getByText(/Important/)).toBeInTheDocument();
    expect(screen.getByText(/Do not include crypto-related words/)).toBeInTheDocument();
  });

  it("calls clipboard.writeText when copy button is clicked", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText, readText: vi.fn() },
      configurable: true,
    });
    renderWithProviders(<PaymentInstructions method={method} />);
    // 3 copy buttons: accountName, accountNumber, bankName
    const copyButtons = screen.getAllByRole("button");
    fireEvent.click(copyButtons[0]);
    expect(writeText).toHaveBeenCalledWith("John Doe");
    fireEvent.click(copyButtons[1]);
    expect(writeText).toHaveBeenCalledWith("1234567890");
    fireEvent.click(copyButtons[2]);
    expect(writeText).toHaveBeenCalledWith("Chase Bank");
  });

  it("hides bank name when not provided", () => {
    const noBank = { ...method, bankName: "" };
    renderWithProviders(<PaymentInstructions method={noBank} />);
    expect(screen.queryByText("Bank Name")).not.toBeInTheDocument();
  });
});