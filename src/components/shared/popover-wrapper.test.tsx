import React from "react";
(globalThis as any).React = React;
import { fireEvent, waitFor } from "@testing-library/react";
import { PopoverWrapper } from "./popover-wrapper";
import { installTestGlobals, renderWithProviders } from "@/src/test/utils";

installTestGlobals();

describe("PopoverWrapper", () => {
  it("renders the target but not the content initially", () => {
    const { baseElement } = renderWithProviders(
      <PopoverWrapper target={({ toggle }) => <button onClick={toggle}>open</button>}>
        <div>popover content</div>
      </PopoverWrapper>
    );
    expect(baseElement.textContent).toContain("open");
    expect(baseElement.textContent).not.toContain("popover content");
  });

  it("toggles the content open", async () => {
    const { baseElement, getByText } = renderWithProviders(
      <PopoverWrapper target={({ toggle }) => <button onClick={toggle}>open</button>}>
        <div>popover content</div>
      </PopoverWrapper>
    );
    fireEvent.click(getByText("open"));
    await waitFor(() =>
      expect(baseElement.textContent).toContain("popover content")
    );
  });

  it("closes when the content is clicked", async () => {
    const { baseElement, getByText } = renderWithProviders(
      <PopoverWrapper target={({ toggle }) => <button onClick={toggle}>open</button>}>
        <div>popover content</div>
      </PopoverWrapper>
    );
    fireEvent.click(getByText("open"));
    await waitFor(() =>
      expect(baseElement.textContent).toContain("popover content")
    );
    fireEvent.click(getByText("popover content"));
    await waitFor(() =>
      expect(baseElement.textContent).not.toContain("popover content")
    );
  });
});