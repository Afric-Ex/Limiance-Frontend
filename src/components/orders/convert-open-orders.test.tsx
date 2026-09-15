import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { ConvertOpenOrders } from "./convert-open-orders";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("ConvertOpenOrders", () => {
  it("renders all table headers", () => {
    renderWithProviders(<ConvertOpenOrders />);
    for (const header of ["Conversion Time", "Wallet", "Trading Pair", "Type", "From", "To", "Price", "Status"]) {
      textPresent(header);
    }
  });

  it("renders the empty state", () => {
    renderWithProviders(<ConvertOpenOrders />);
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });
});