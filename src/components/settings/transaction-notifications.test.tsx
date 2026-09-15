import React from "react";
(globalThis as any).React = React;
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const { modals } = vi.hoisted(() => ({
  modals: { open: vi.fn(), closeAll: vi.fn(), confirm: vi.fn() },
}));

vi.mock("@mantine/modals", () => ({ modals }));

import { TransactionNotifications } from "./transaction-notifications";

describe("TransactionNotifications", () => {
  it("renders the heading and every notification setting", () => {
    renderWithProviders(<TransactionNotifications />);
    expect(screen.getByText("Transaction Notifications")).toBeInTheDocument();
    expect(screen.getByText("Futures trading notifications")).toBeInTheDocument();
    expect(screen.getByText("Futures notification sounds")).toBeInTheDocument();
    expect(screen.getByText("Spot trading notifications")).toBeInTheDocument();
    expect(screen.getByText("Spot notification sounds")).toBeInTheDocument();
  });

  it("keeps the Confirm button disabled", () => {
    renderWithProviders(<TransactionNotifications />);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("closes the modal when Cancel is clicked", () => {
    renderWithProviders(<TransactionNotifications />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(modals.closeAll).toHaveBeenCalled();
  });
});