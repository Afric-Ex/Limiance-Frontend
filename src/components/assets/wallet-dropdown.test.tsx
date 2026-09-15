import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { WalletDropdown } from "./wallet-dropdown";

describe("WalletDropdown", () => {
  it("shows the default Spot wallet selection", () => {
    renderWithProviders(<WalletDropdown setSelectedWallet={vi.fn()} />);
    expect(screen.getByText("Spot Wallet")).toBeInTheDocument();
  });

  it("sets the Spot wallet when the option is clicked", () => {
    const setSelectedWallet = vi.fn();
    renderWithProviders(<WalletDropdown setSelectedWallet={setSelectedWallet} />);
    fireEvent.click(screen.getByText("Spot Wallet"));
    const spotOption = screen.getAllByText("Spot Wallet")[1];
    fireEvent.click(spotOption);
    expect(setSelectedWallet).toHaveBeenCalledWith(0);
  });

  it("sets the Funding wallet when Funding is clicked", () => {
    const setSelectedWallet = vi.fn();
    renderWithProviders(<WalletDropdown setSelectedWallet={setSelectedWallet} />);
    fireEvent.click(screen.getByText("Spot Wallet"));
    fireEvent.click(screen.getByText("Funding Wallet"));
    expect(setSelectedWallet).toHaveBeenCalledWith(1);
  });
});