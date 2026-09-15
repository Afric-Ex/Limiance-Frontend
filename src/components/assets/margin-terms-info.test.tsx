import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const mocks = vi.hoisted(() => ({
  modalsCloseAll: vi.fn(),
}));

vi.mock("@mantine/modals", () => ({
  modals: { closeAll: mocks.modalsCloseAll },
}));

import { MarginTermsInfo } from "./margin-terms-info";

describe("MarginTermsInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the terms of use with the main risk headings", () => {
    renderWithProviders(<MarginTermsInfo />);
    expect(screen.getByText("Terms of Use")).toBeInTheDocument();
    expect(screen.getByText("Market Volatility:")).toBeInTheDocument();
    expect(screen.getByText("Leverage:")).toBeInTheDocument();
    expect(screen.getByText("Loan Risks:")).toBeInTheDocument();
  });

  it("disables Confirm until the terms checkbox is ticked", () => {
    renderWithProviders(<MarginTermsInfo />);
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByLabelText("I have read and agreed to the terms"));
    expect(confirm).not.toBeDisabled();
  });

  it("closes the modal when Confirm is clicked after agreeing", () => {
    renderWithProviders(<MarginTermsInfo />);
    fireEvent.click(screen.getByLabelText("I have read and agreed to the terms"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(mocks.modalsCloseAll).toHaveBeenCalled();
  });
});