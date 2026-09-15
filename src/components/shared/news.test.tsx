import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { News } from "./news";

describe("News", () => {
  it("renders the announcement copy", () => {
    render(<News />);
    expect(screen.getByText("Exciting News:")).toBeInTheDocument();
    expect(
      screen.getByText("$LUMI is Now Live on Limiance! Start trading with zero fees today.")
    ).toBeInTheDocument();
  });

  it("renders a megaphone icon", () => {
    const { container } = render(<News />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});