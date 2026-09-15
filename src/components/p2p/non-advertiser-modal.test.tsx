import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { NonAdvertiserModal } from "./non-advertiser-modal";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const makeProps = () => ({
  isOpen: true,
  onClose: vi.fn(),
});

describe("NonAdvertiserModal", () => {
  it("renders title and benefit bullets", () => {
    renderWithProviders(<NonAdvertiserModal {...makeProps()} />);
    expect(screen.getByText("Become a P2P Advertiser")).toBeTruthy();
    expect(screen.getByText("Set Your Own Terms")).toBeInTheDocument();
    expect(screen.getByText("Zero Fees")).toBeInTheDocument();
    expect(screen.getByText("Dedicated Support")).toBeInTheDocument();
  });

  it("navigates to market on Back to Market", () => {
    renderWithProviders(<NonAdvertiserModal {...makeProps()} />);
    fireEvent.click(screen.getByText("Back to Market"));
    expect(pushMock).toHaveBeenCalledWith("/trades/p2p");
  });

  it("closes and navigates to advertiser register on Apply Now", () => {
    const props = makeProps();
    renderWithProviders(<NonAdvertiserModal {...props} />);
    fireEvent.click(screen.getByText("Apply Now"));
    expect(props.onClose).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/trades/p2p/advertiser/register");
  });
});