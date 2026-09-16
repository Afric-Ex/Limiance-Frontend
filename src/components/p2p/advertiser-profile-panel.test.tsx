import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { AdvertiserProfilePanel } from "./advertiser-profile-panel";

const {
  isAdvertiserBlocked,
  getAdvertiserReviews,
  blockAdvertiser,
  unblockAdvertiser,
  reportAdvertiser,
} = vi.hoisted(() => ({
  isAdvertiserBlocked: vi.fn(() => false),
  getAdvertiserReviews: vi.fn(() => []),
  blockAdvertiser: vi.fn(),
  unblockAdvertiser: vi.fn(),
  reportAdvertiser: vi.fn(),
}));

vi.mock("@/src/lib/p2p-user-actions", () => ({
  isAdvertiserBlocked,
  getAdvertiserReviews,
  blockAdvertiser,
  unblockAdvertiser,
  reportAdvertiser,
}));

const { toastSuccess } = vi.hoisted(() => ({ toastSuccess: vi.fn() }));
vi.mock("react-hot-toast", () => ({
  default: { success: toastSuccess, error: vi.fn() },
}));

vi.mock("./block-user-modal", () => ({
  BlockUserModal: ({ isOpen, onConfirm }: any) =>
    isOpen ? (
      <div data-testid="block-modal">
        <input placeholder="Reason for blocking" onChange={(_e) => {}} />
        <button onClick={() => onConfirm("Scam attempt")}>Confirm Block</button>
      </div>
    ) : null,
}));

vi.mock("./report-user-modal", () => ({
  ReportUserModal: ({ isOpen, onSubmit }: any) =>
    isOpen ? (
      <div data-testid="report-modal">
        <input placeholder="Add anything useful" onChange={(_e) => {}} />
        <button onClick={() => onSubmit({ reason: "Fraud or scam attempt", details: "Repeated spam" })}>
          Submit Report
        </button>
      </div>
    ) : null,
}));

const advertiser = {
  id: "adv-1",
  firstName: "Alice",
  lastName: "Wonder",
  photo: "",
  active: true,
  verified: true,
  totalOrdersCompleted: "42",
  completionPercentage: "97.5",
  rating: "4.8",
};

const makeProps = (overrides = {}) => ({
  advertiser,
  onClose: vi.fn(),
  onRelationshipChange: vi.fn(),
  ...overrides,
});

describe("AdvertiserProfilePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAdvertiserBlocked.mockReturnValue(false);
    getAdvertiserReviews.mockReturnValue([]);
  });

  it("renders nothing when advertiser is null", () => {
    const { container } = renderWithProviders(
      <AdvertiserProfilePanel advertiser={null} onClose={vi.fn()} />
    );
    expect(container.querySelector("[data-testid]")).toBeNull();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("renders advertiser profile details", () => {
    renderWithProviders(<AdvertiserProfilePanel {...makeProps()} />);
    expect(screen.getByText("Alice Wonder")).toBeInTheDocument();
    expect(screen.getByText("Verified advertiser")).toBeInTheDocument();
    expect(screen.getByText("42 completed trades")).toBeInTheDocument();
  });

  it("shows stats cards", () => {
    renderWithProviders(<AdvertiserProfilePanel {...makeProps()} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("97.5%")).toBeInTheDocument();
    expect(screen.getByText("4.8/5")).toBeInTheDocument();
  });

  it("shows No rating yet when rating is zero", () => {
    renderWithProviders(
      <AdvertiserProfilePanel
        {...makeProps()}
        advertiser={{ ...advertiser, rating: "0" }}
      />
    );
    expect(screen.getByText("No rating yet")).toBeInTheDocument();
  });

  it("shows no recent feedback message", () => {
    renderWithProviders(<AdvertiserProfilePanel {...makeProps()} />);
    expect(screen.getByText(/No recent feedback has been submitted/)).toBeInTheDocument();
  });

  it("shows recent reviews", () => {
    const reviews = [
      {
        orderMatchId: "om-1",
        advertiserId: "adv-1",
        advertiserName: "Alice Wonder",
        reviewerId: "u1",
        reviewerName: "Bob",
        rating: "POSITIVE" as const,
        numericRating: 5,
        review: "Great trader!",
        tags: ["Fast payment"],
        createdAt: new Date().toISOString(),
      },
    ];
    getAdvertiserReviews.mockReturnValue(reviews);
    renderWithProviders(<AdvertiserProfilePanel {...makeProps()} />);
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Great trader!")).toBeInTheDocument();
    expect(screen.getByText("Fast payment")).toBeInTheDocument();
  });

  it("shows Unblock User when already blocked", () => {
    isAdvertiserBlocked.mockReturnValue(true);
    renderWithProviders(<AdvertiserProfilePanel {...makeProps()} />);
    expect(screen.getByText("Unblock User")).toBeInTheDocument();
  });

  it("unblocks an advertiser directly", () => {
    isAdvertiserBlocked.mockReturnValue(true);
    const props = makeProps();
    renderWithProviders(<AdvertiserProfilePanel {...props} />);
    fireEvent.click(screen.getByText("Unblock User"));
    expect(unblockAdvertiser).toHaveBeenCalledWith("adv-1");
    expect(toastSuccess).toHaveBeenCalledWith("Alice Wonder has been unblocked");
    expect(props.onRelationshipChange).toHaveBeenCalled();
  });

  it("opens block modal and blocks the advertiser", async () => {
    const props = makeProps();
    renderWithProviders(<AdvertiserProfilePanel {...props} />);
    fireEvent.click(screen.getByText("Block User"));
    await waitFor(() => {
      expect(screen.getByTestId("block-modal")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Confirm Block"));
    expect(blockAdvertiser).toHaveBeenCalledWith({
      id: "adv-1",
      name: "Alice Wonder",
      reason: "Scam attempt",
    });
    expect(toastSuccess).toHaveBeenCalledWith("Alice Wonder has been blocked");
  });

  it("reports an advertiser", async () => {
    const props = makeProps();
    renderWithProviders(<AdvertiserProfilePanel {...props} />);
    fireEvent.click(screen.getByText("Report"));
    await waitFor(() => {
      expect(screen.getByTestId("report-modal")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Submit Report"));
    expect(reportAdvertiser).toHaveBeenCalledWith({
      id: "adv-1",
      name: "Alice Wonder",
      reason: "Fraud or scam attempt",
      details: "Repeated spam",
    });
    expect(toastSuccess).toHaveBeenCalledWith("Report submitted");
  });
});
