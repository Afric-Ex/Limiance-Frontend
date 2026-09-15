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

import { EditLanguage } from "./edit-language";

describe("EditLanguage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userService.saveSettings.mockResolvedValue({ data: {} });
  });

  it("renders the heading and all language options", () => {
    renderWithProviders(<EditLanguage />);
    expect(screen.getByText("Language")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(screen.getByText("Português (Brasil)")).toBeInTheDocument();
  });

  it("selects English by default", () => {
    renderWithProviders(<EditLanguage />);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "English" })).toBeChecked();
  });

  it("preselects initialLanguage when provided", () => {
    renderWithProviders(<EditLanguage initialLanguage="Dansk" />);
    expect(screen.getByRole("radio", { name: "Dansk" })).toBeChecked();
  });

  it("saves the selected language and closes the modal", async () => {
    renderWithProviders(<EditLanguage />);
    fireEvent.click(screen.getByRole("radio", { name: "Español" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(userService.saveSettings).toHaveBeenCalledWith({ language: "Español" });
    });
    await waitFor(() => {
      expect(successNotification).toHaveBeenCalledWith("Language updated");
    });
    expect(modals.closeAll).toHaveBeenCalled();
  });

  it("closes the modal on Cancel", () => {
    renderWithProviders(<EditLanguage />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(modals.closeAll).toHaveBeenCalled();
  });

  it("reports save errors", async () => {
    userService.saveSettings.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<EditLanguage />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => {
      expect(errorMessageHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});