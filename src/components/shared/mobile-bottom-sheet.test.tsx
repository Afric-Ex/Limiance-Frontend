import React from "react";
(globalThis as any).React = React;
import { waitFor } from "@testing-library/react";
import { MobileBottomSheet } from "./mobile-bottom-sheet";
import { installTestGlobals, renderWithProviders } from "@/src/test/utils";

installTestGlobals();

describe("MobileBottomSheet", () => {
  it("renders title and children when opened", async () => {
    const { baseElement } = renderWithProviders(
      <MobileBottomSheet opened onClose={vi.fn()} title="Sheet title">
        <div>sheet body</div>
      </MobileBottomSheet>
    );
    await waitFor(() => {
      expect(baseElement.textContent).toContain("Sheet title");
      expect(baseElement.textContent).toContain("sheet body");
    });
  });

  it("renders children without a title", async () => {
    const { baseElement } = renderWithProviders(
      <MobileBottomSheet opened onClose={vi.fn()}>
        <div>only body</div>
      </MobileBottomSheet>
    );
    await waitFor(() => {
      expect(baseElement.textContent).toContain("only body");
    });
  });

  it("does not render content when closed", async () => {
    const { baseElement } = renderWithProviders(
      <MobileBottomSheet opened={false} onClose={vi.fn()} title="Hidden">
        <div>hidden body</div>
      </MobileBottomSheet>
    );
    await waitFor(() => {
      expect(baseElement.textContent).not.toContain("hidden body");
    });
  });

  it("unmounts content when closed after being open", async () => {
    const { baseElement, rerender } = renderWithProviders(
      <MobileBottomSheet opened onClose={vi.fn()} title="Toggle">
        <div>toggle body</div>
      </MobileBottomSheet>
    );
    await waitFor(() =>
      expect(baseElement.textContent).toContain("toggle body")
    );
    rerender(
      <MobileBottomSheet opened={false} onClose={vi.fn()} title="Toggle">
        <div>toggle body</div>
      </MobileBottomSheet>
    );
    await waitFor(() =>
      expect(baseElement.textContent).not.toContain("toggle body")
    );
  });
});