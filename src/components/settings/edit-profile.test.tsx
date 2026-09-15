import React from "react";
(globalThis as any).React = React;
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { useUserStore } from "@/src/stores/user-store";

const { userService } = vi.hoisted(() => ({
  userService: { updateUser: vi.fn(() => Promise.resolve({ data: {} })) },
}));

const { successNotification, errorMessageHandler, modals, convertFileToBase64 } = vi.hoisted(
  () => ({
    successNotification: vi.fn(),
    errorMessageHandler: vi.fn(),
    modals: { open: vi.fn(), closeAll: vi.fn(), confirm: vi.fn() },
    convertFileToBase64: vi.fn(() => Promise.resolve("data:image/png;base64,abc")),
  })
);

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
  userKeys: { settings: ["settings"] },
}));

vi.mock("@/src/lib/notification-handler", () => ({
  successNotification,
  errorNotification: vi.fn(),
}));

vi.mock("@/src/lib/error-handler", () => ({
  errorMessageHandler,
}));

vi.mock("@/src/lib/convert-file-to-base64", () => ({ convertFileToBase64 }));

vi.mock("@mantine/modals", () => ({ modals }));

import { EditProfile } from "./edit-profile";

const baseUser = {
  id: "usr-123",
  username: "ada",
  firstName: "Ada",
  lastName: "",
  email: "ada@limiance.test",
  photo: "",
  isVerified: true,
  isEmailVerified: true,
  isFuturesAccepted: false,
  twoFactorEnabled: false,
};

describe("EditProfile", () => {
  beforeEach(() => {
    useUserStore.setState({ user: baseUser });
    vi.clearAllMocks();
    userService.updateUser.mockResolvedValue({ data: {} });
  });

  it("renders the header and nickname field prefilled from the user", async () => {
    renderWithProviders(<EditProfile />);
    expect(screen.getAllByText("Edit Profile").length).toBeGreaterThan(0);
    const input = screen.getByPlaceholderText("Enter your nickname") as HTMLInputElement;
    await waitFor(() => expect(input.value).toBe("ada"));
  });

  it("disables Save Changes until the nickname is at least 4 chars", async () => {
    renderWithProviders(<EditProfile />);
    const input = screen.getByPlaceholderText("Enter your nickname");
    await waitFor(() => expect((input as HTMLInputElement).value).toBe("ada"));
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();

    fireEvent.change(input, { target: { value: "aba" } });
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();

    fireEvent.change(input, { target: { value: "adalov" } });
    expect((input as HTMLInputElement).value).toBe("adalov");
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
  });

  it("saves the profile, updates the store and notifies success", async () => {
    renderWithProviders(<EditProfile />);
    const input = screen.getByPlaceholderText("Enter your nickname");
    await waitFor(() => expect((input as HTMLInputElement).value).toBe("ada"));
    fireEvent.change(input, { target: { value: "adalov" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(userService.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({ username: "adalov" })
      );
    });
    await waitFor(() => {
      expect(successNotification).toHaveBeenCalledWith("Profile updated successfully");
    });
    expect(useUserStore.getState().user?.username).toBe("adalov");
    expect(modals.closeAll).toHaveBeenCalled();
  });

  it("reports save errors", async () => {
    userService.updateUser.mockRejectedValueOnce(new Error("boom"));
    renderWithProviders(<EditProfile />);
    const input = screen.getByPlaceholderText("Enter your nickname");
    await waitFor(() => expect((input as HTMLInputElement).value).toBe("ada"));
    fireEvent.change(input, { target: { value: "adalov" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => {
      expect(errorMessageHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});