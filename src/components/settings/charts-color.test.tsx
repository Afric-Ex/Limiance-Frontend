import React from "react";
(globalThis as any).React = React;
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const { modals } = vi.hoisted(() => ({
  modals: { open: vi.fn(), closeAll: vi.fn(), confirm: vi.fn() },
}));

vi.mock("@mantine/modals", () => ({ modals }));

import { ChartsColor } from "./charts-color";

describe("ChartsColor", () => {
  it("renders the heading and both chart color options", () => {
    renderWithProviders(<ChartsColor />);
    expect(screen.getByText("Charts Color")).toBeInTheDocument();
    expect(screen.getByText("Green Up / Red down")).toBeInTheDocument();
    expect(screen.getByText("Red Up / Green down")).toBeInTheDocument();
  });

  it("renders sample percentages for both options", () => {
    renderWithProviders(<ChartsColor />);
    expect(screen.getAllByText("+3.12%")).toHaveLength(2);
    expect(screen.getAllByText("-1.12%")).toHaveLength(2);
  });

  it("keeps the Confirm button disabled and closes on Cancel", () => {
    renderWithProviders(<ChartsColor />);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(modals.closeAll).toHaveBeenCalled();
  });
});