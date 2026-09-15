import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { NewsMarquee } from "./news-marquee";

describe("NewsMarquee", () => {
  it("repeats the news item four times", () => {
    render(<NewsMarquee />);
    expect(screen.getAllByText("Exciting News:")).toHaveLength(4);
  });

  it("does not render a close button by default", () => {
    render(<NewsMarquee />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("hides the marquee when the close button is clicked", () => {
    const { container } = render(<NewsMarquee withClose />);
    expect(screen.getByRole("button")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(container.firstChild).toBeNull();
  });
});