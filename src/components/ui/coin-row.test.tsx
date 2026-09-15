import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { CoinRow } from "./coin-row";

const icon = <span>ICON</span>;

describe("CoinRow", () => {
  it("renders icon and ticker", () => {
    render(<CoinRow icon={icon} ticker="BTC" />);
    expect(screen.getByText("ICON")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
  });

  it("renders name, amount, price and action when provided", () => {
    render(
      <CoinRow
        icon={icon}
        ticker="USDT"
        name="Tether"
        amount="1,200.00"
        price="150,000"
        action={<button>Buy</button>}
      />
    );
    expect(screen.getByText("Tether")).toBeInTheDocument();
    expect(screen.getByText("1,200.00")).toBeInTheDocument();
    expect(screen.getByText("150,000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buy" })).toBeInTheDocument();
  });

  it("omits optional slots that are not passed", () => {
    render(<CoinRow icon={icon} ticker="ETH" />);
    expect(screen.queryByText("Tether")).not.toBeInTheDocument();
  });
});