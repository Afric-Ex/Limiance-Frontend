import React from "react";
(globalThis as any).React = React;
import { fireEvent, render, screen } from "@testing-library/react";
import { HeroIconContainer } from "./hero-icon-container";

describe("HeroIconContainer", () => {
  it("renders children", () => {
    render(
      <HeroIconContainer>
        <span>ICON</span>
      </HeroIconContainer>
    );
    expect(screen.getByText("ICON")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <HeroIconContainer onClick={onClick}>
        <span>ICON</span>
      </HeroIconContainer>
    );
    fireEvent.click(screen.getByText("ICON"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});