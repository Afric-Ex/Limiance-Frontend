import React from "react";
(globalThis as any).React = React;
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { KickstartJourney } from "./kickstart-journey";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe("KickstartJourney", () => {
  it("renders heading, stepper, and all three cards", () => {
    renderWithProviders(<KickstartJourney />);

    expect(screen.getByText("Kick Start Your Journey!")).toBeInTheDocument();
    expect(screen.getByText("Verify your Identity")).toBeInTheDocument();
    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("Trade")).toBeInTheDocument();

    // Step indicators
    expect(screen.getByLabelText("Step 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Step 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Step 3")).toBeInTheDocument();
  });

  it("renders Continue Verification and navigates to kyc page on click", () => {
    pushMock.mockClear();
    renderWithProviders(<KickstartJourney kycStatus="not_submitted" />);

    const button = screen.getByRole("button", { name: "Continue Verification" });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(pushMock).toHaveBeenCalledWith("/account/kyc?start=1");
  });

  it("displays Under Review when status is pending", () => {
    const onRefreshMock = vi.fn();
    renderWithProviders(
      <KickstartJourney kycStatus="pending" onRefreshStatus={onRefreshMock} />
    );

    expect(screen.getByText("Under Review")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Check Status" });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onRefreshMock).toHaveBeenCalled();
  });

  it("displays Needs Resubmission when status is rejected", () => {
    renderWithProviders(<KickstartJourney kycStatus="rejected" />);

    expect(screen.getByText("Needs Resubmission")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry Verification" })).toBeInTheDocument();
  });

  it("renders deposit and trade links to their respective pages", () => {
    renderWithProviders(<KickstartJourney />);

    const depositLink = screen.getByText("Deposit").closest("a");
    const tradeLink = screen.getByText("Trade").closest("a");

    expect(depositLink).toHaveAttribute("href", "/transactions/deposit");
    expect(tradeLink).toHaveAttribute("href", "/trades/spot");
  });
});
