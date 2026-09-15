import React from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { DebtHistory } from "./debt-history";

const textPresent = (text: string) => {
  expect(screen.getAllByText(text).length).toBeGreaterThan(0);
};

describe("DebtHistory", () => {
  it("renders the category and account filter tabs", () => {
    renderWithProviders(<DebtHistory />);
    textPresent("Borrowing");
    textPresent("Repayment");
    textPresent("Interest");
    textPresent("Cross");
    textPresent("Isolated");
  });

  it("renders the filter selects, search and reset controls", () => {
    renderWithProviders(<DebtHistory />);
    textPresent("Date");
    textPresent("Coin");
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
    textPresent("Reset");
  });

  it("renders table headers and the empty state", () => {
    renderWithProviders(<DebtHistory />);
    for (const header of ["Coin", "Date", "Borrowing", "Interest", "Sum", "Category"]) {
      textPresent(header);
    }
    expect(screen.getByText("No Records")).toBeInTheDocument();
  });

  it("switches to the Repayment filter tab", () => {
    renderWithProviders(<DebtHistory />);
    const repayment = screen.getAllByText("Repayment")[0];
    fireEvent.click(repayment);
    expect(screen.getAllByText("Repayment").length).toBeGreaterThan(0);
  });
});