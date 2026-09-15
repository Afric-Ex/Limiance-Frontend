import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { useUserStore } from "@/src/stores/user-store";

const mocks = vi.hoisted(() => ({
  acceptFutures: vi.fn(() => Promise.resolve({ data: {} })),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  modalsCloseAll: vi.fn(),
}));

vi.mock("@/src/services/trading", () => ({
  tradingService: { acceptFutures: mocks.acceptFutures },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock("@mantine/modals", () => ({
  modals: { closeAll: mocks.modalsCloseAll },
}));

import { OpenFuturesModal } from "./open-futures-modal";

describe("OpenFuturesModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.setState({ user: null });
  });

  it("renders the futures activation layout with disabled create button", () => {
    renderWithProviders(<OpenFuturesModal onConfirm={vi.fn()} />);
    expect(screen.getByText("Open Futures Account")).toBeInTheDocument();
    expect(screen.getByText("Regulations")).toBeInTheDocument();
    expect(screen.getByText(/I have read and agree to/)).toBeInTheDocument();
    expect(screen.getByText(/I understood the rules and risks/)).toBeInTheDocument();
    const create = screen.getByRole("button", { name: "Create Account" });
    expect(create).toBeDisabled();
  });

  it("activates the futures account after both checkboxes are checked", async () => {
    const onConfirm = vi.fn();
    renderWithProviders(<OpenFuturesModal onConfirm={onConfirm} />);
    const radios = document.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(2);
    fireEvent.click(radios[0]);
    fireEvent.click(radios[1]);

    const create = screen.getByRole("button", { name: "Create Account" });
    expect(create).not.toBeDisabled();
    fireEvent.click(create);

    await waitFor(() => {
      expect(mocks.acceptFutures).toHaveBeenCalledTimes(1);
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Futures Account activated successfully!");
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(mocks.modalsCloseAll).toHaveBeenCalledTimes(1);
  });

  it("updates the user store with isFuturesAccepted when signed in", async () => {
    useUserStore.setState({ user: { id: "u1", email: "a@b.com" } as any });
    renderWithProviders(<OpenFuturesModal onConfirm={vi.fn()} />);
    const radios = document.querySelectorAll('input[type="radio"]');
    fireEvent.click(radios[0]);
    fireEvent.click(radios[1]);
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mocks.acceptFutures).toHaveBeenCalledTimes(1);
    });
    expect(useUserStore.getState().user?.isFuturesAccepted).toBe(true);
  });

  it("surfaces the error toast when activation fails", async () => {
    mocks.acceptFutures.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<OpenFuturesModal onConfirm={vi.fn()} />);
    const radios = document.querySelectorAll('input[type="radio"]');
    fireEvent.click(radios[0]);
    fireEvent.click(radios[1]);
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith(expect.stringMatching(/Failed to activate Futures Account/));
    });
    expect(mocks.modalsCloseAll).not.toHaveBeenCalled();
  });
});