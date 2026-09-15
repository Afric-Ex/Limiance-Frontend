import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent, act } from "@testing-library/react";
import { installTestGlobals, renderWithProviders } from "@/src/test/utils";
import { CoinSelectDropdown } from "./coin-select-dropdown";

vi.mock("next/image", () => ({
  default: (props: any) => <img src={props.src ?? ""} alt={props.alt ?? ""} />,
}));

installTestGlobals();

describe("CoinSelectDropdown", () => {
  it("renders the selected USDT ticker", () => {
    renderWithProviders(<CoinSelectDropdown />);
    expect(screen.getByText("USDT")).toBeInTheDocument();
    expect(screen.getByText("Tether USDT")).toBeInTheDocument();
  });

  it("opens the popover to select a coin", async () => {
    renderWithProviders(<CoinSelectDropdown />);
    fireEvent.click(screen.getByText("Tether USDT"));

    expect(await screen.findByText("History")).toBeInTheDocument();
    expect(screen.getByText("Coin")).toBeInTheDocument();
  });
});