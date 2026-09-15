import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { MarginOrderDetails } from "./margin-order-details";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("MarginOrderDetails", () => {
  it("renders the filter tabs, search and reset controls", () => {
    renderWithProviders(<MarginOrderDetails />);
    textPresent("Cross");
    textPresent("Isolated");
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    textPresent("Reset");
  });

  it("renders the filter selects", () => {
    renderWithProviders(<MarginOrderDetails />);
    textPresent("Order");
    textPresent("Date");
    textPresent("Trading Pair");
    textPresent("Trade");
    textPresent("Time");
  });

  it("renders table headers and the empty state", () => {
    renderWithProviders(<MarginOrderDetails />);
    for (const header of ["Date", "Trading Pair", "Type", "Price", "Filled", "Fee", "Role", "Total"]) {
      textPresent(header);
    }
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });

  it("switches the account filter tab", () => {
    renderWithProviders(<MarginOrderDetails />);
    const isolated = screen.getAllByText("Isolated")[0];
    fireEvent.click(isolated);
    expect(screen.getAllByText("Isolated").length).toBeGreaterThan(0);
  });
});