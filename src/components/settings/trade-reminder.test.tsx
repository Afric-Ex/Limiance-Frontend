import React from "react";
(globalThis as any).React = React;
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const { modals } = vi.hoisted(() => ({
  modals: { open: vi.fn(), closeAll: vi.fn(), confirm: vi.fn() },
}));

vi.mock("@mantine/modals", () => ({ modals }));

import { TradeReminder } from "./trade-reminder";

describe("TradeReminder", () => {
  it("renders the heading and every reminder", () => {
    renderWithProviders(<TradeReminder />);
    expect(screen.getByText("Trade ( Order Confirmation Reminder)")).toBeInTheDocument();
    expect(screen.getByText("Limit Order")).toBeInTheDocument();
    expect(screen.getByText("Market Order")).toBeInTheDocument();
    expect(screen.getByText("Stop-Limit Order")).toBeInTheDocument();
    expect(screen.getByText("Auto Borrow/Repay for Margin")).toBeInTheDocument();
    expect(screen.getByText("Select All")).toBeInTheDocument();
  });

  it("keeps the Confirm button disabled", () => {
    renderWithProviders(<TradeReminder />);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("closes the modal when Cancel is clicked", () => {
    renderWithProviders(<TradeReminder />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(modals.closeAll).toHaveBeenCalled();
  });
});