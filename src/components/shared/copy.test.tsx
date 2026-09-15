import React from "react";
(globalThis as any).React = React;
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Copy } from "./copy";
import { mockClipboard, renderWithProviders } from "@/src/test/utils";
import { installTestGlobals } from "@/src/test/utils";

installTestGlobals();

describe("Copy", () => {
  beforeEach(() => {
    mockClipboard();
  });

  it("copies text to the clipboard on click", async () => {
    renderWithProviders(<Copy text="abc-123" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("abc-123");
  });

  it("copies an empty string for undefined text", async () => {
    renderWithProviders(<Copy text={undefined} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("");
  });

  it("shows a state change after copying", async () => {
    renderWithProviders(<Copy text="x" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(screen.getByRole("button").className).toContain("text-success-6");
  });
});