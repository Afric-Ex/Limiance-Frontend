import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { BuyerPaidPanel } from "./buyer-paid-panel";

const makeProps = (overrides = {}) => ({
  counterpartyName: "Sarah",
  quantity: 0.5,
  asset: "BTC",
  updatedAt: new Date().toISOString(),
  onDisputeOpen: vi.fn(),
  ...overrides,
});

describe("BuyerPaidPanel", () => {
  it("shows payment confirmed message", () => {
    renderWithProviders(<BuyerPaidPanel {...makeProps()} />);
    expect(screen.getByText("Payment Confirmed")).toBeInTheDocument();
    expect(screen.getByText(/You confirmed payment at/)).toBeInTheDocument();
  });

  it("shows seller release countdown", () => {
    const { container } = renderWithProviders(<BuyerPaidPanel {...makeProps()} />);
    expect(screen.getByText("Seller must release within")).toBeInTheDocument();
    const countdown = container.querySelector(".font-mono");
    expect(countdown?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it("shows waiting for seller message", () => {
    renderWithProviders(<BuyerPaidPanel {...makeProps()} />);
    expect(screen.getByText(/Waiting for Sarah/)).toBeInTheDocument();
    expect(screen.getByText(/Waiting for them to release/)).toBeInTheDocument();
  });

  it("shows cancellation warning", () => {
    renderWithProviders(<BuyerPaidPanel {...makeProps()} />);
    expect(screen.getByText(/Do not attempt to cancel/)).toBeInTheDocument();
  });

  it("opens dispute", () => {
    const props = makeProps();
    renderWithProviders(<BuyerPaidPanel {...props} />);
    fireEvent.click(screen.getByText("File a Dispute"));
    expect(props.onDisputeOpen).toHaveBeenCalled();
  });
});
