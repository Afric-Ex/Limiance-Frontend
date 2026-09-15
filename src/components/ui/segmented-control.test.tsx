import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedControl } from "./segmented-control";

const options = [
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
] as const;

describe("SegmentedControl", () => {
  it("renders a tablist with tabs", () => {
    render(
      <SegmentedControl options={options} value="buy" onChange={() => {}} />
    );
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveTextContent("Buy");
    expect(tabs[1]).toHaveTextContent("Sell");
  });

  it("marks the active tab as selected", () => {
    render(
      <SegmentedControl options={options} value="sell" onChange={() => {}} />
    );
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  });

  it("calls onChange with the option value", () => {
    const onChange = vi.fn();
    render(<SegmentedControl options={options} value="buy" onChange={onChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Sell" }));
    expect(onChange).toHaveBeenCalledWith("sell");
  });

  it("applies the compact size class", () => {
    render(
      <SegmentedControl options={options} value="buy" onChange={() => {}} size="compact" />
    );
    expect(screen.getByRole("tab", { name: "Buy" }).className).toContain(
      "h-6 px-3 text-xs"
    );
  });
});