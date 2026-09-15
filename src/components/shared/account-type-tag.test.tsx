import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { AccountTypeTag } from "./account-type-tag";

describe("AccountTypeTag", () => {
  it("renders the Regular label", () => {
    render(<AccountTypeTag />);
    expect(screen.getByText("Regular")).toBeInTheDocument();
  });

  it("renders an svg icon", () => {
    const { container } = render(<AccountTypeTag />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});