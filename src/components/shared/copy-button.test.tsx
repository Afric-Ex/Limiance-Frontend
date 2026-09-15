import React from "react";
(globalThis as any).React = React;
import { fireEvent, render, screen, act } from "@testing-library/react";
import { CopyButton } from "./copy-button";
import { mockClipboard, installTestGlobals } from "@/src/test/utils";
import { vi } from "vitest";

installTestGlobals();

describe("CopyButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockClipboard();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the Copy label", () => {
    render(<CopyButton text="hello" />);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("copies text and toggles to Copied", async () => {
    render(<CopyButton text="hello" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
  });

  it("reverts to Copy after two seconds", async () => {
    render(<CopyButton text="hello" />);
    await fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });
});