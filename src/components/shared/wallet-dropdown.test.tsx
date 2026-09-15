import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { WalletDropdown } from "./wallet-dropdown";

describe("WalletDropdown", () => {
  it("renders all wallet options", () => {
    render(<WalletDropdown />);
    for (const title of [
      "Rewards Hub",
      "SPot",
      "Margin",
      "Futures",
      "Option",
      "Trading Bot",
      "Earn",
      "Funding Wallet",
      "Transaction History",
      "Verification",
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });
});