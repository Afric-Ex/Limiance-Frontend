import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { CapitalFlow } from "./capital-flow";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("CapitalFlow", () => {
  it("renders the filter tabs, search and reset controls", () => {
    renderWithProviders(<CapitalFlow />);
    textPresent("Capital Flow");
    textPresent("Transfer");
    textPresent("Cross");
    textPresent("Isolated");
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    textPresent("Reset");
  });

  it("renders the filter selects", () => {
    renderWithProviders(<CapitalFlow />);
    textPresent("Date");
    textPresent("Coin");
    textPresent("Search Type");
  });

  it("renders table headers and the empty state", () => {
    renderWithProviders(<CapitalFlow />);
    for (const header of ["Date", "Coin", "Margin Account (IN/OUT)", "Amount", "Type", "Status"]) {
      textPresent(header);
    }
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });
});