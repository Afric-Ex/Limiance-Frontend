import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { Liquidation } from "./liquidation";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("Liquidation", () => {
  it("renders the filter tabs, search and reset controls", () => {
    renderWithProviders(<Liquidation />);
    textPresent("Liquidation Orders");
    textPresent("Liquidation Order");
    textPresent("Cross");
    textPresent("Isolated");
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    textPresent("Reset");
  });

  it("renders the filter selects", () => {
    renderWithProviders(<Liquidation />);
    textPresent("Date");
    textPresent("Trading Pair");
  });

  it("renders table headers and the empty state", () => {
    renderWithProviders(<Liquidation />);
    for (const header of ["Coin", "Trading Pair", "Type", "Date", "Average", "Price", "Executed", "Amount", "Total"]) {
      textPresent(header);
    }
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });
});