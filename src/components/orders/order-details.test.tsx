import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { OrderDetails } from "./order-details";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("OrderDetails", () => {
  it("renders the filter controls", () => {
    renderWithProviders(<OrderDetails />);
    textPresent("Date");
    textPresent("Base");
    textPresent("Qoute");
    textPresent("Time");
    textPresent("Last 7 Days");
  });

  it("renders table headers and the empty state", () => {
    renderWithProviders(<OrderDetails />);
    for (const header of ["Date", "Trading Pair", "Side", "Price", "Role", "Filled", "Fee", "Total", "Total in USDT"]) {
      textPresent(header);
    }
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });
});