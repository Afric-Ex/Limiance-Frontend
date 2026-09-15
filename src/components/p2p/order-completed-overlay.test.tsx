import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { OrderCompletedOverlay } from "./order-completed-overlay";

const baseProps = {
  isBuyer: true,
  cryptoAmount: 0.5,
  asset: "BTC",
  fiatAmount: 50000,
  fiat: "USD",
  counterparty: "Alice",
  fee: 0.001,
  onGoToWallet: vi.fn(),
  onSkipFeedback: vi.fn(),
  onSubmitFeedback: vi.fn(),
  isSubmittingFeedback: false,
  initialSubmitted: false,
};

describe("OrderCompletedOverlay", () => {
  it("shows trade completed for buyer", () => {
    renderWithProviders(<OrderCompletedOverlay {...baseProps} />);
    expect(screen.getByText("Trade Completed!")).toBeInTheDocument();
    expect(screen.getByText(/0.5 BTC/)).toBeInTheDocument();
  });

  it("shows Go to Wallet for buyers", () => {
    renderWithProviders(<OrderCompletedOverlay {...baseProps} />);
    expect(screen.getByText("Go to Wallet")).toBeInTheDocument();
  });

  it("shows seller-side summary", () => {
    renderWithProviders(<OrderCompletedOverlay {...baseProps} isBuyer={false} />);
    expect(screen.getByText(/50,000.00 USD/)).toBeInTheDocument();
    expect(screen.getByText(/Trade fee: 0.001 BTC deducted/)).toBeInTheDocument();
  });

  it("shows feedback section asking about counterparty", () => {
    renderWithProviders(<OrderCompletedOverlay {...baseProps} />);
    expect(screen.getByText(/How was your experience with Alice?/)).toBeInTheDocument();
    expect(screen.getByText("Positive")).toBeInTheDocument();
    expect(screen.getByText("Negative")).toBeInTheDocument();
  });

  it("Submit Feedback is disabled until rating chosen", () => {
    renderWithProviders(<OrderCompletedOverlay {...baseProps} />);
    const submitBtn = screen.getByText("Submit Feedback").closest("button");
    expect(submitBtn).toBeDisabled();
  });

  it("shows positive tags after selecting Positive", () => {
    renderWithProviders(<OrderCompletedOverlay {...baseProps} />);
    fireEvent.click(screen.getByText("Positive"));
    expect(screen.getByText("Fast payment")).toBeInTheDocument();
    expect(screen.getByText("Would trade again")).toBeInTheDocument();
  });

  it("shows negative tags after selecting Negative", () => {
    renderWithProviders(<OrderCompletedOverlay {...baseProps} />);
    fireEvent.click(screen.getByText("Negative"));
    expect(screen.getByText("Slow response")).toBeInTheDocument();
    expect(screen.getByText("Payment issues")).toBeInTheDocument();
  });

  it("submits feedback with rating, tags and comment", () => {
    const onSubmit = vi.fn();
    renderWithProviders(<OrderCompletedOverlay {...baseProps} onSubmitFeedback={onSubmit} />);
    fireEvent.click(screen.getByText("Positive"));
    fireEvent.change(screen.getByPlaceholderText(/Leave a comment/), {
      target: { value: "Great trade!" },
    });
    fireEvent.click(screen.getByText("Friendly"));
    fireEvent.click(screen.getByText("Submit Feedback"));
    expect(onSubmit).toHaveBeenCalledWith("POSITIVE", ["Friendly"], "Great trade!");
  });

  it("renders thank-you message after submitted", () => {
    renderWithProviders(<OrderCompletedOverlay {...baseProps} initialSubmitted={true} />);
    expect(screen.getByText("Thank you for your feedback!")).toBeInTheDocument();
    expect(screen.queryByText("Submit Feedback")).not.toBeInTheDocument();
  });

  it("calls onSkipFeedback", () => {
    const onSkip = vi.fn();
    renderWithProviders(<OrderCompletedOverlay {...baseProps} onSkipFeedback={onSkip} />);
    fireEvent.click(screen.getByText("Skip"));
    expect(onSkip).toHaveBeenCalled();
  });

  it("calls onGoToWallet", () => {
    const onGoToWallet = vi.fn();
    renderWithProviders(<OrderCompletedOverlay {...baseProps} onGoToWallet={onGoToWallet} />);
    fireEvent.click(screen.getByText("Go to Wallet"));
    expect(onGoToWallet).toHaveBeenCalled();
  });

  it("shows comment character counter", () => {
    renderWithProviders(<OrderCompletedOverlay {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Leave a comment/), {
      target: { value: "abc" },
    });
    expect(screen.getByText("3/200")).toBeInTheDocument();
  });
});