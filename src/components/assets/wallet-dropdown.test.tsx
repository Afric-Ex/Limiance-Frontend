import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { WalletDropdown } from "./wallet-dropdown";

describe("WalletDropdown", () => {
  it("shows the default Spot wallet selection", () => {
    renderWithProviders(<WalletDropdown setSelectedWallet={vi.fn()} />);
    expect(screen.getByText("Spot Wallet")).toBeInTheDocument();
  });

  it("sets the Spot wallet when the option is clicked", async () => {
    const setSelectedWallet = vi.fn();
    renderWithProviders(<WalletDropdown setSelectedWallet={setSelectedWallet} />);
    fireEvent.click(screen.getByText("Spot Wallet"));
    await waitFor(() => {
      expect(screen.getAllByText("Spot Wallet").length).toBeGreaterThanOrEqual(2);
    });
    fireEvent.click(screen.getAllByText("Spot Wallet")[1]);
    expect(setSelectedWallet).toHaveBeenCalledWith(0);
  });

  it("sets the Funding wallet when Funding is clicked", async () => {
    const setSelectedWallet = vi.fn();
    renderWithProviders(<WalletDropdown setSelectedWallet={setSelectedWallet} />);
    fireEvent.click(screen.getByText("Spot Wallet"));
    const fundingOption = await screen.findByText("Funding Wallet");
    fireEvent.click(fundingOption);
    expect(setSelectedWallet).toHaveBeenCalledWith(1);
  });
});