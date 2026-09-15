import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { WithCurvedImageBorder } from "./with-curved-image-border";

describe("WithCurvedImageBorder", () => {
  it("renders children and a visible border svg by default", () => {
    const { container } = render(
      <WithCurvedImageBorder>
        <span>content</span>
      </WithCurvedImageBorder>
    );
    expect(screen.getByText("content")).toBeInTheDocument();
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg?.classList.contains("invisible")).toBe(false);
  });

  it("hides the border svg when display is false", () => {
    const { container } = render(
      <WithCurvedImageBorder display={false}>
        <span>content</span>
      </WithCurvedImageBorder>
    );
    expect(container.querySelector("svg")?.classList.contains("invisible")).toBe(
      true
    );
  });
});