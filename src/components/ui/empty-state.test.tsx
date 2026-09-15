import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders default caption", () => {
    render(<EmptyState />);
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });

  it("renders a custom caption", () => {
    render(<EmptyState caption="Nothing here yet" />);
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(<EmptyState icon={<span>EMPTY</span>} />);
    expect(screen.getByText("EMPTY")).toBeInTheDocument();
  });

  it("omits icon container when not provided", () => {
    const { container } = render(<EmptyState caption="x" />);
    expect(container.querySelector(".text-\\[var\\(--color-text-disabled\\)\\]")).not.toBeInTheDocument();
  });
});