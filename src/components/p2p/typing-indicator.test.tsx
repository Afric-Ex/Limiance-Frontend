import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { TypingIndicator } from "./typing-indicator";

describe("TypingIndicator", () => {
  it("renders three bouncing dots", () => {
    renderWithProviders(<TypingIndicator />);
    const dots = screen.getAllByText("", { selector: "span" });
    expect(dots.length).toBe(3);
  });

  it("renders a container with correct layout", () => {
    const { container } = renderWithProviders(<TypingIndicator />);
    expect(container.querySelector(".animate-bounce")).toBeTruthy();
  });
});
