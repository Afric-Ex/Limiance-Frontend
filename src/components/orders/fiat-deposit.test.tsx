import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { FiatDeposit } from "./fiat-deposit";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("FiatDeposit", () => {
  it("renders the filter selects, search and reset controls", () => {
    renderWithProviders(<FiatDeposit />);
    textPresent("Coin");
    textPresent("Time");
    textPresent("Last 7 Days");
    expect(screen.getByPlaceholderText("Search order no.")).toBeInTheDocument();
    textPresent("Reset");
  });

  it("renders table headers and the empty state", () => {
    renderWithProviders(<FiatDeposit />);
    for (const header of ["Order ID", "Time", "Category", "Price", "Fiat/Crypto Amount", "Received", "Status"]) {
      textPresent(header);
    }
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });
});