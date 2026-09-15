import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/src/test/test-utils";
import { queryResults } from "@/src/test/react-query-mock";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const { getAllMatchedOrders } = vi.hoisted(() => ({
  getAllMatchedOrders: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}));

vi.mock("@/src/services/p2p", () => ({
  p2p: { getAllMatchedOrders },
  p2pKey: {
    allMatchedOrders: (params?: any) => ["all-matched-orders", params],
  },
}));

const toastSuccess = vi.fn();
vi.mock("react-hot-toast", () => ({
  default: { success: toastSuccess, error: vi.fn() },
}));

vi.mock("@/src/stores/user-store", () => ({
  useUserStore: (selector: (state: any) => unknown) =>
    selector({ user: { id: "u-current" } }),
}));

import { GlobalP2PNotification } from "./global-p2p-notification";

const withOrders = (orders: any[]) => ({ data: { data: orders } });

describe("GlobalP2PNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults["all-matched-orders"] = { data: { data: [] } };
  });

  it("renders no visible content", () => {
    const { container } = renderWithProviders(<GlobalP2PNotification />);
    expect(container.querySelector("[data-testid]")).toBeNull();
    expect(container.textContent?.trim() || "").toBe("");
  });

  it("does not toast on initial load with no orders", () => {
    renderWithProviders(<GlobalP2PNotification />);
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("does not toast on initial load with existing orders", () => {
    queryResults["all-matched-orders"] = withOrders([
      { id: "o1", matcherId: "someone-else", type: "SELL" },
    ]);
    renderWithProviders(<GlobalP2PNotification />);
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it("toasts when a new order from a different advertiser appears", () => {
    queryResults["all-matched-orders"] = withOrders([
      { id: "o1", matcherId: "someone-else", type: "BUY" },
    ]);
    const { rerender } = renderWithProviders(<GlobalP2PNotification />);
    expect(toastSuccess).not.toHaveBeenCalled();

    queryResults["all-matched-orders"] = withOrders([
      { id: "o1", matcherId: "someone-else", type: "BUY" },
      { id: "o2", matcherId: "another", type: "SELL" },
    ]);
    rerender(<GlobalP2PNotification />);
    rerender(<GlobalP2PNotification />);
    expect(toastSuccess).toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith(
      expect.stringContaining("You have a new SELL order!"),
      expect.objectContaining({ duration: 10000 })
    );
  });

  it("does not toast for orders where the user is the matcher", () => {
    queryResults["all-matched-orders"] = withOrders([
      { id: "o1", matcherId: "u-current", type: "SELL" },
    ]);
    const { rerender } = renderWithProviders(<GlobalP2PNotification />);
    queryResults["all-matched-orders"] = withOrders([
      { id: "o1", matcherId: "u-current", type: "SELL" },
      { id: "o2", matcherId: "u-current", type: "BUY" },
    ]);
    rerender(<GlobalP2PNotification />);
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
