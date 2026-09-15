import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Favourite } from "./favourite";

describe("Favourite", () => {
  it("renders a star-shaped favourite icon", () => {
    const { container } = render(<Favourite />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "12");
    expect(svg).toHaveAttribute("height", "12");
  });
});