import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { AdManagementCard } from "./ad-management-card";
import { Ad } from "@/src/stores/p2p-store";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const makeAd = (overrides = {}): Ad => ({
  id: "ad-1",
  type: "BUY",
  asset: "USDT",
  fiat: "USD",
  price: 100,
  availableQuantity: 5000,
  minQuantity: 50,
  maxQuantity: 1000,
  paymentMethods: ["Bank Transfer"],
  advertiser: {
    id: "adv-1",
    name: "Alice",
    verified: true,
    trades: 10,
    completionRate: 95,
    responseTime: "10 mins",
  },
  ...overrides,
});

const makeProps = (overrides = {}) => ({
  ad: makeAd(),
  isActive: true,
  onPause: vi.fn(),
  onResume: vi.fn(),
  onDelete: vi.fn(),
  ...overrides,
});

describe("AdManagementCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushMock.mockClear();
  });

  it("renders ad summary and status", () => {
    renderWithProviders(<AdManagementCard {...makeProps()} />);
    expect(screen.getByText("BUY USDT/USD")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText(/100 USD/)).toBeInTheDocument();
  });

  it("shows Paused state for inactive ads", () => {
    renderWithProviders(<AdManagementCard {...makeProps({ isActive: false })} />);
    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(screen.getByText("Resume")).toBeInTheDocument();
  });

  it("renders available amount and order limit", () => {
    renderWithProviders(<AdManagementCard {...makeProps()} />);
    expect(screen.getByText(/5,000 USDT/)).toBeInTheDocument();
    expect(screen.getByText(/50 - 1,000 USDT/)).toBeInTheDocument();
  });

  it("renders payment method badges", () => {
    renderWithProviders(<AdManagementCard {...makeProps()} />);
    expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
  });

  it("navigates to edit page", () => {
    renderWithProviders(<AdManagementCard {...makeProps()} />);
    fireEvent.click(screen.getByText("Edit"));
    expect(pushMock).toHaveBeenCalledWith("/p2p/ads/edit/ad-1");
  });

  it("opens pause modal and pauses the ad", async () => {
    const props = makeProps();
    renderWithProviders(<AdManagementCard {...props} />);
    fireEvent.click(screen.getByText("Pause"));
    await waitFor(() => {
      expect(screen.getByText("Pause Ad?")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Pause Ad"));
    expect(props.onPause).toHaveBeenCalledTimes(1);
  });

  it("resumes a paused ad", () => {
    const props = makeProps({ isActive: false });
    renderWithProviders(<AdManagementCard {...props} />);
    fireEvent.click(screen.getByText("Resume"));
    expect(props.onResume).toHaveBeenCalledTimes(1);
  });

  it("opens delete modal and deletes the ad", async () => {
    const props = makeProps();
    renderWithProviders(<AdManagementCard {...props} />);
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => {
      expect(screen.getByText("Delete Ad?")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Delete Ad"));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it("cancels pause modal without pausing", async () => {
    const props = makeProps();
    renderWithProviders(<AdManagementCard {...props} />);
    fireEvent.click(screen.getByText("Pause"));
    await waitFor(() => {
      expect(screen.getByText("Pause Ad?")).toBeInTheDocument();
    });
    const cancelBtns = screen.getAllByText("Cancel");
    fireEvent.click(cancelBtns[0]);
    expect(props.onPause).not.toHaveBeenCalled();
  });
});
