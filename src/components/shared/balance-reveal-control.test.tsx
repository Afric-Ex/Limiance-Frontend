import React from "react";
(globalThis as any).React = React;
import { render, fireEvent } from "@testing-library/react";
import { BalanceRevealControl } from "./balance-reveal-control";
import { useUserStore } from "@/src/stores/user-store";

describe("BalanceRevealControl", () => {
  beforeEach(() => {
    useUserStore.setState({ hideBalance: true });
  });

  it("shows the eye when hidden and reveals on click", () => {
    render(<BalanceRevealControl />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    fireEvent.click(svg as SVGSVGElement);
    expect(useUserStore.getState().hideBalance).toBe(false);
  });

  it("shows the eye-slash when visible and hides on click", () => {
    useUserStore.setState({ hideBalance: false });
    render(<BalanceRevealControl />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    fireEvent.click(svg as SVGSVGElement);
    expect(useUserStore.getState().hideBalance).toBe(true);
  });
});