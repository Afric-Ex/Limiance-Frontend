import React from "react";
(globalThis as any).React = React;
import { render } from "@testing-library/react";
import { Apple } from "./apple";

describe("Apple", () => {
  it("renders an svg", () => {
    const { container } = render(<Apple />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});