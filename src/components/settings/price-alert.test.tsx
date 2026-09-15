import React from "react";
(globalThis as any).React = React;
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const { modals } = vi.hoisted(() => ({
  modals: { open: vi.fn(), closeAll: vi.fn(), confirm: vi.fn() },
}));

vi.mock("@mantine/modals", () => ({ modals }));

import { PriceAlert } from "./price-alert";

describe("PriceAlert", () => {
  it("renders the heading and every alert setting", () => {
    renderWithProviders(<PriceAlert />);
    expect(screen.getByText("Price Alerts")).toBeInTheDocument();
    expect(screen.getByText("Notification On")).toBeInTheDocument();
    expect(screen.getByText("Sound On")).toBeInTheDocument();
    expect(screen.getAllByRole("switch")).toHaveLength(2);
  });

  it("keeps the Confirm button disabled", () => {
    renderWithProviders(<PriceAlert />);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
  });

  it("closes the modal when Cancel is clicked", () => {
    renderWithProviders(<PriceAlert />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(modals.closeAll).toHaveBeenCalled();
  });
});