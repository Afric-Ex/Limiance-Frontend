import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { EarnDropdown } from "./earn-dropdown";

describe("EarnDropdown", () => {
  it("renders all earn options", () => {
    render(<EarnDropdown />);
    for (const title of [
      "Simple earn",
      "Staking",
      "LaunchPad",
      "Pool Savings",
      "Dual Investment",
      "Smart Trend",
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("renders each subtitle", () => {
    render(<EarnDropdown />);
    expect(screen.getByText("Effortless earning insights at a glance")).toBeInTheDocument();
    expect(screen.getByText("Time the market and enjoy incredible yields")).toBeInTheDocument();
  });
});