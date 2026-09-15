import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { P2PLayout } from "./p2p-layout";

const { usePathname, useAllMatchedOrders, useAdvertiserInfo } = vi.hoisted(() => ({
  usePathname: vi.fn(() => "/trades/p2p"),
  useAllMatchedOrders: vi.fn(),
  useAdvertiserInfo: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: any) => <a href={href} className={className}>{children}</a>,
}));

vi.mock("@/src/hooks/p2p/use-p2p", () => ({
  useAllMatchedOrders,
  useAdvertiserInfo,
}));

vi.mock("./global-p2p-notification", () => ({
  GlobalP2PNotification: () => null,
}));

describe("P2PLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathname.mockReturnValue("/trades/p2p");
    useAllMatchedOrders.mockReturnValue({
      data: { data: { data: [] } },
    });
    useAdvertiserInfo.mockReturnValue({ data: undefined });
  });

  const baseLinks = ["P2P Trading", "Orders", "My Ads"];

  it("renders the default navigation links", () => {
    renderWithProviders(<P2PLayout>content</P2PLayout>);
    for (const link of baseLinks) {
      expect(screen.getByText(link)).toBeInTheDocument();
    }
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("shows Profile link for advertisers", () => {
    useAdvertiserInfo.mockReturnValue({
      data: { data: { data: { id: "adv-1" } } },
    });
    renderWithProviders(<P2PLayout>content</P2PLayout>);
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("does not show Profile link for non-advertisers", () => {
    renderWithProviders(<P2PLayout>content</P2PLayout>);
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
  });

  it("shows processing count badge on Orders when orders are pending", () => {
    useAllMatchedOrders.mockReturnValue({
      data: {
        data: {
          data: [
            { id: "o1", status: "PENDING_PAYMENT" },
            { id: "o2", status: "COMPLETED" },
            { id: "o3", status: "PAID" },
          ],
        },
      },
    });
    renderWithProviders(<P2PLayout>content</P2PLayout>);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("does not show badge when no pending orders", () => {
    useAllMatchedOrders.mockReturnValue({
      data: {
        data: {
          data: [
            { id: "o1", status: "COMPLETED" },
            { id: "o2", status: "CANCELLED" },
          ],
        },
      },
    });
    renderWithProviders(<P2PLayout>content</P2PLayout>);
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("highlights the active navigation link based on pathname", () => {
    renderWithProviders(<P2PLayout>content</P2PLayout>);
    const p2pLink = screen.getByText("P2P Trading").closest("a");
    expect(p2pLink).not.toBeNull();
    expect(p2pLink!.className).toContain("text-white");
  });

  it("respects pathname prefix matching for Orders", () => {
    usePathname.mockReturnValue("/trades/p2p/orders");
    renderWithProviders(<P2PLayout>content</P2PLayout>);
    const ordersLink = screen.getByText("Orders").closest("a");
    expect(ordersLink).not.toBeNull();
    expect(ordersLink!.className).toContain("text-white");
  });
});
