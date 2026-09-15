import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { StatCell } from "./stat-cell";

describe("StatCell", () => {
  it("renders label and value", () => {
    render(<StatCell label="Total" value="$1,000" />);
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("$1,000")).toBeInTheDocument();
  });

  it("appends valueClassName to the value", () => {
    render(<StatCell label="Total" value="$1,000" valueClassName="text-green-5" />);
    expect(screen.getByText("$1,000").className).toContain("text-green-5");
  });
});