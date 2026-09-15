import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Info } from "./info";

describe("Info", () => {
  it("renders an svg with an (i) badge structure", () => {
    const { container } = render(<Info />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "12");
    expect(svg).toHaveAttribute("height", "12");
  });
});