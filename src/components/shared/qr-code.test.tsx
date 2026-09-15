import React from "react";
(globalThis as any).React = React;
import { render } from "@testing-library/react";
import { QrCode } from "./qr-code";

describe("QrCode", () => {
  it("renders an svg", () => {
    const { container } = render(<QrCode />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "32");
  });
});