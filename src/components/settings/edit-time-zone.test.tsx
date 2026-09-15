import React from "react";
(globalThis as any).React = React;
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

const { userService } = vi.hoisted(() => ({
  userService: { saveSettings: vi.fn(() => Promise.resolve({ data: {} })) },
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
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
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

import { EditTimeZone } from "./edit-time-zone";

describe("EditTimeZone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userService.saveSettings.mockResolvedValue({ data: {} });
  });

  it("renders the heading and all time zone options", () => {
    renderWithProviders(<EditTimeZone />);
    expect(screen.getByText("24h Change & time zone basis")).toBeInTheDocument();
    expect(screen.getByText("Last 24 hours")).toBeInTheDocument();
    expect(screen.getByText("UTC +8, 00:00")).toBeInTheDocument();
  });

  it("selects Last 24 hours by default", () => {
    renderWithProviders(<EditTimeZone />);
    expect(screen.getByRole("radio", { name: "Last 24 hours" })).toBeChecked();
  });

  it("preselects initialTimezone when provided", () => {
    renderWithProviders(<EditTimeZone initialTimezone="UTC +9, 00:00" />);
    expect(screen.getByRole("radio", { name: "UTC +9, 00:00" })).toBeChecked();
  });

  it("saves the selected timezone and closes the modal", async () => {
    renderWithProviders(<EditTimeZone />);
    fireEvent.click(screen.getByRole("radio", { name: "UTC +8, 00:00" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(userService.saveSettings).toHaveBeenCalledWith({ timezone: "UTC +8, 00:00" });
    });
    await waitFor(() => {
      expect(successNotification).toHaveBeenCalledWith("Timezone updated");
    });
    expect(modals.closeAll).toHaveBeenCalled();
  });

  it("closes the modal on Cancel", () => {
    renderWithProviders(<EditTimeZone />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(modals.closeAll).toHaveBeenCalled();
  });

  it("reports save errors", async () => {
    userService.saveSettings.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<EditTimeZone />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => {
      expect(errorMessageHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});