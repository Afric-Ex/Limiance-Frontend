import React from "react";
(globalThis as any).React = React;
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const { modals } = vi.hoisted(() => ({
  modals: { open: vi.fn(), closeAll: vi.fn(), confirm: vi.fn() },
}));

vi.mock("@mantine/modals", () => ({ modals }));

import { FeeDeduction } from "./fee-deduction";

describe("FeeDeduction", () => {
  it("renders the heading and all fee settings", () => {
    renderWithProviders(<FeeDeduction />);
    expect(screen.getByText("Trade ( Fee Deduction )")).toBeInTheDocument();
    expect(screen.getByText("Use BNB to pay fees")).toBeInTheDocument();
    expect(screen.getByText("Enjoy 25% discount")).toBeInTheDocument();
    expect(screen.getByText("Use BNB to pay Margin interests")).toBeInTheDocument();
    expect(screen.getByText("Use BNB to pay USDⓈ-M Futures fees")).toBeInTheDocument();
  });

  it("renders a Confirm button that is disabled", () => {
    renderWithProviders(<FeeDeduction />);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("closes the modal when Cancel is clicked", () => {
    renderWithProviders(<FeeDeduction />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(modals.closeAll).toHaveBeenCalled();
  });
});