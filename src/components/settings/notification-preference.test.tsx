import React from "react";
(globalThis as any).React = React;
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const { userService, queryClient } = vi.hoisted(() => ({
  userService: { saveSettings: vi.fn(() => Promise.resolve({ data: {} })) },
  queryClient: { invalidateQueries: vi.fn() },
}));

const { successNotification, errorMessageHandler, modals } = vi.hoisted(() => ({
  successNotification: vi.fn(),
  errorMessageHandler: vi.fn(),
  modals: { open: vi.fn(), closeAll: vi.fn(), confirm: vi.fn() },
}));

vi.mock("@tanstack/react-query", () => {
  return {
    useMutation: (options: any) => {
      const mutate = (vars?: any) => {
        try {
          const res = options.mutationFn(vars);
          Promise.resolve(res)
            .then((r: any) => {
              options.onSuccess?.(r, vars, undefined);
              options.onSettled?.(r, null, vars, undefined);
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
    useQueryClient: () => queryClient,
  };
});

vi.mock("@/src/services/user", () => ({
  userService,
  userKeys: {
    userDetails: ["user-details"],
    sessions: ["sessions"],
    apiKeys: ["api-keys"],
    settings: ["settings"],
  },
}));

vi.mock("@/src/lib/notification-handler", () => ({
  successNotification,
  errorNotification: vi.fn(),
}));

vi.mock("@/src/lib/error-handler", () => ({
  errorMessageHandler,
}));

vi.mock("@mantine/modals", () => ({ modals }));

import { NotificationPreference } from "./notification-preference";

describe("NotificationPreference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userService.saveSettings.mockResolvedValue({ data: {} });
  });

  it("renders the heading and all preference rows", () => {
    renderWithProviders(<NotificationPreference />);
    expect(screen.getByText("Notification Preferences")).toBeInTheDocument();
    for (const label of [
      "Activities",
      "Trade Notifications",
      "Limiance News",
      "System Messages",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("starts with all preferences selected (Deselect All)", () => {
    renderWithProviders(<NotificationPreference />);
    expect(screen.getByText("Deselect All")).toBeInTheDocument();
  });

  it("toggles a single preference via its row", () => {
    renderWithProviders(<NotificationPreference />);
    fireEvent.click(screen.getByText("Activities"));
    expect(screen.getByText("Select All")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Activities"));
    expect(screen.getByText("Deselect All")).toBeInTheDocument();
  });

  it("deselects everything via the select-all row", () => {
    renderWithProviders(<NotificationPreference />);
    fireEvent.click(screen.getByText("Deselect All"));
    expect(screen.getByText("Select All")).toBeInTheDocument();
  });

  it("persists the selected preferences and closes the modal", async () => {
    renderWithProviders(<NotificationPreference />);
    fireEvent.click(screen.getByText("Activities"));
    fireEvent.click(screen.getByRole("button", { name: "Save Preferences" }));

    await waitFor(() => {
      expect(userService.saveSettings).toHaveBeenCalledWith({
        notificationPreference: ["Trade Notification", "Limiance News", "System Messages"],
      });
    });
    await waitFor(() => {
      expect(successNotification).toHaveBeenCalledWith("Notification preferences saved");
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["settings"],
    });
    expect(modals.closeAll).toHaveBeenCalled();
  });

  it("closes the modal on Cancel", () => {
    renderWithProviders(<NotificationPreference />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(modals.closeAll).toHaveBeenCalled();
  });
});