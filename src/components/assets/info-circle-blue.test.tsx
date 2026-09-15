import React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { InfoCircleBlue } from "./info-circle-blue";

describe("InfoCircleBlue", () => {
  it("renders a blue info circle svg", () => {
    const { container } = render(<InfoCircleBlue />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "18");
    expect(svg).toHaveAttribute("height", "16");
  });
});