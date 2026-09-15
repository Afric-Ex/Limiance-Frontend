import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { BuyCryptoDropdown } from "./buy-crypto-dropdown";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("BuyCryptoDropdown", () => {
  it("renders the three buy options", () => {
    render(<BuyCryptoDropdown />);
    expect(screen.getByText("Quick Buy")).toBeInTheDocument();
    expect(screen.getByText("P2P trading")).toBeInTheDocument();
    expect(screen.getByText("Fiat Deposit")).toBeInTheDocument();
  });

  it("shows the 0 fees badge", () => {
    render(<BuyCryptoDropdown />);
    expect(screen.getByText("0 fees")).toBeInTheDocument();
  });

  it("links P2P trading to /trades/p2p", () => {
    render(<BuyCryptoDropdown />);
    const p2p = screen.getByText("P2P trading").closest("a");
    expect(p2p).toHaveAttribute("href", "/trades/p2p");
  });

  it("disables the Fiat Deposit entry", () => {
    render(<BuyCryptoDropdown />);
    const fiat = screen.getByText("Fiat Deposit").closest("a");
    expect(fiat?.className).toContain("cursor-not-allowed");
  });
});