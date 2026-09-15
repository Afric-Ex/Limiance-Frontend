import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { DisputePanel } from "./dispute-panel";

const { mutateMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
}));

vi.mock("@/src/hooks/p2p/use-p2p", () => ({
  useUpdateMatchedOrder: () => ({
    mutate: mutateMock,
    isPending: false,
  }),
}));

const makeProps = (overrides = {}) => ({
  isOpen: true,
  onClose: vi.fn(),
  orderMatchId: "match-123",
  onSuccess: vi.fn(),
  ...overrides,
});

describe("DisputePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the drawer with order id and reason options", () => {
    renderWithProviders(<DisputePanel {...makeProps()} />);
    expect(screen.getByText("File a Dispute")).toBeInTheDocument();
    expect(screen.getByText("match-123")).toBeInTheDocument();
    expect(screen.getByText("Payment not received")).toBeInTheDocument();
    expect(screen.getByText("Suspected fraud")).toBeInTheDocument();
  });

  it("Submit Dispute is disabled until all fields valid", () => {
    renderWithProviders(<DisputePanel {...makeProps()} />);
    const submitBtn = screen.getByText("Submit Dispute").closest("button");
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit after reason, description and agreement", () => {
    renderWithProviders(<DisputePanel {...makeProps()} />);
    fireEvent.click(screen.getByText("Payment not received"));
    fireEvent.change(screen.getByPlaceholderText(/Describe the issue/), {
      target: { value: "I paid but the seller did not release my crypto in time." },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    const submitBtn = screen.getByText("Submit Dispute").closest("button");
    expect(submitBtn).toBeEnabled();
  });

  it("submits the dispute with reason and description", () => {
    const props = makeProps();
    renderWithProviders(<DisputePanel {...props} />);
    fireEvent.click(screen.getByText("Payment not received"));
    fireEvent.change(screen.getByPlaceholderText(/Describe the issue/), {
      target: { value: "I paid but the seller did not release my crypto in time." },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("Submit Dispute"));
    expect(mutateMock).toHaveBeenCalledWith(
      {
        orderMatchId: "match-123",
        status: "DISPUTED",
        reason: "payment_not_received",
        description: "I paid but the seller did not release my crypto in time.",
      },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("calls onSuccess and onClose after successful submission", () => {
    const props = makeProps();
    renderWithProviders(<DisputePanel {...props} />);
    fireEvent.click(screen.getByText("Payment not received"));
    fireEvent.change(screen.getByPlaceholderText(/Describe the issue/), {
      target: { value: "I paid but the seller did not release my crypto in time." },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText("Submit Dispute"));

    const options = mutateMock.mock.calls[0][1];
    options.onSuccess();
    expect(props.onSuccess).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  it("shows character count for description", () => {
    renderWithProviders(<DisputePanel {...makeProps()} />);
    fireEvent.change(screen.getByPlaceholderText(/Describe the issue/), {
      target: { value: "abc" },
    });
    expect(screen.getByText("3 characters (min 20)")).toBeInTheDocument();
  });

  it("calls onClose on Cancel", () => {
    const props = makeProps();
    renderWithProviders(<DisputePanel {...props} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onClose).toHaveBeenCalled();
  });
});