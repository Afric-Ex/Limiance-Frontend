import React from "react";
(globalThis as any).React = React;
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const { earnService } = vi.hoisted(() => ({
  earnService: { subscribe: vi.fn(() => Promise.resolve({ data: {} })) },
}));

const { successNotification, errorMessageHandler, modals } = vi.hoisted(() => ({
  successNotification: vi.fn(),
  errorMessageHandler: vi.fn(),
  modals: { open: vi.fn(), closeAll: vi.fn(), confirm: vi.fn() },
}));

vi.mock("@tanstack/react-query", () => {
  const actual = vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useMutation: (options: any) => {
      const mutate = (vars: any) => {
        try {
          const result = options.mutationFn(vars);
          Promise.resolve(result)
            .then((res) => {
              options.onSuccess?.(res, vars, undefined);
              options.onSettled?.(res, null, vars, undefined);
            })
            .catch((e: any) => {
              options.onError?.(e);
              options.onSettled?.(undefined, e, vars, undefined);
            });
        } catch (e) {
          options.onError?.(e);
        }
      };
      return { mutate, isPending: false, reset: vi.fn() };
    },
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

vi.mock("@/src/services/earn", () => ({
  earnService,
  earnKeys: { products: ["earn-products"], myPositions: ["earn-my-positions"] },
}));

vi.mock("@/src/lib/notification-handler", () => ({
  successNotification,
  errorNotification: vi.fn(),
}));

vi.mock("@/src/lib/error-handler", () => ({
  errorMessageHandler,
}));

vi.mock("@mantine/modals", () => ({ modals }));

import { SubscribeModal } from "./subscribe-modal";

const product = {
  id: "p-1",
  asset: "USDT",
  image: "/usdt.png",
  apy: 5.5,
  minAmount: "10",
  lockDays: 7,
  type: "fixed" as const,
  totalStaked: "100000",
  available: true,
};

describe("SubscribeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    earnService.subscribe.mockResolvedValue({ data: {} });
  });

  it("renders product details, lock badge and apy", () => {
    renderWithProviders(<SubscribeModal product={product} />);
    expect(screen.getByAltText("USDT")).toBeInTheDocument();
    expect(screen.getAllByText("USDT").length).toBeGreaterThan(0);
    expect(screen.getByText("7 Days Lock")).toBeInTheDocument();
    expect(screen.getByText("5.50%")).toBeInTheDocument();
    expect(screen.getByText(/Min:/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /MAX/i })).toBeInTheDocument();
  });

  it("disables Confirm Stake until an amount is entered", () => {
    renderWithProviders(<SubscribeModal product={product} />);
    expect(screen.getByRole("button", { name: "Confirm Stake" })).toBeDisabled();
  });

  it("submits the stake with the entered amount", async () => {
    renderWithProviders(<SubscribeModal product={product} />);
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "42" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm Stake" }));

    await waitFor(() => {
      expect(earnService.subscribe).toHaveBeenCalledWith({ productId: "p-1", amount: "42" });
    });
    await waitFor(() => {
      expect(successNotification).toHaveBeenCalledWith("Successfully staked 42 USDT");
    });
    expect(modals.closeAll).toHaveBeenCalled();
  });

  it("reports errors from the service", async () => {
    earnService.subscribe.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<SubscribeModal product={product} />);
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "42" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm Stake" }));

    await waitFor(() => {
      expect(errorMessageHandler).toHaveBeenCalledWith(expect.any(Error));
    });
    expect(successNotification).not.toHaveBeenCalled();
  });
});