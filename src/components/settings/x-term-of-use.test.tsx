import React from "react";
(globalThis as any).React = React;
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const { modals } = vi.hoisted(() => ({
  modals: { open: vi.fn(), closeAll: vi.fn(), confirm: vi.fn() },
}));

vi.mock("@mantine/modals", () => ({ modals }));

import { XTermOfUse } from "./x-term-of-use";

describe("XTermOfUse", () => {
  it("renders the terms of use heading and body text", () => {
    renderWithProviders(<XTermOfUse />);
    expect(screen.getByText("Terms of use")).toBeInTheDocument();
    expect(
      screen.getByText(/After clicking on the Link button below/)
    ).toBeInTheDocument();
  });

  it("renders the consent checkbox and Link Account Now button", () => {
    renderWithProviders(<XTermOfUse />);
    expect(
      screen.getByLabelText("I understand, agree, and consent to the terms above.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Link Account Now" })).toBeInTheDocument();
  });

  it("closes the modal via the close icon", () => {
    renderWithProviders(<XTermOfUse />);
    fireEvent.click(document.querySelector("svg")!);
    expect(modals.closeAll).toHaveBeenCalled();
  });
});