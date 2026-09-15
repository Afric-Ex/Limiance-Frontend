import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Sort } from "./sort";

describe("Sort", () => {
  it("renders with the default muted state", () => {
    const { container } = render(<Sort />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(container.querySelectorAll("path").length).toBe(2);
  });

  it("uses the ascending color when state is asc", () => {
    const { container } = render(<Sort state="asc" />);
    expect(container.querySelector("path")).toHaveAttribute("fill", "#4D77F0");
  });

  it("uses the descending color when state is desc", () => {
    const { container } = render(<Sort state="desc" />);
    expect(container.querySelector("path")).toHaveAttribute("fill", "#848E9C");
  });
});