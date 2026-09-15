import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const mocks = vi.hoisted(() => ({
  modalsCloseAll: vi.fn(),
}));

vi.mock("@mantine/modals", () => ({
  modals: { closeAll: mocks.modalsCloseAll },
}));

import { SelectDepositMethod } from "./select-deposit-method";

describe("SelectDepositMethod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Add Funds header with both deposit options", () => {
    renderWithProviders(<SelectDepositMethod />);
    expect(screen.getByText("Add Funds")).toBeInTheDocument();
    expect(screen.getByText("P2P Trading")).toBeInTheDocument();
    expect(screen.getByText("Crypto Deposit")).toBeInTheDocument();
    expect(screen.getByText("0 Fees")).toBeInTheDocument();
  });

  it("links to the p2p and deposit routes", () => {
    renderWithProviders(<SelectDepositMethod />);
    const p2p = screen.getByText("P2P Trading").closest("a");
    expect(p2p).toHaveAttribute("href", "/trades/p2p");
    const deposit = screen.getByText("Crypto Deposit").closest("a");
    expect(deposit).toHaveAttribute("href", "/transactions/deposit");
  });

  it("closes all modals when a Go action or the close button is clicked", () => {
    renderWithProviders(<SelectDepositMethod />);
    const goButtons = screen.getAllByRole("button", { name: "Go" });
    fireEvent.click(goButtons[0]);
    expect(mocks.modalsCloseAll).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(mocks.modalsCloseAll).toHaveBeenCalledTimes(2);
  });
});