import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  const m = await import("@/src/test/react-query-mock");
  return { ...actual, ...m.reactQueryMock };
});

const { auth, modalsOpen } = vi.hoisted(() => ({
  auth: {
    verifyEmail: vi.fn(() => Promise.resolve({ data: {} })),
  },
  modalsOpen: vi.fn(),
}));

vi.mock("@/src/services/auth", () => ({ auth }));
vi.mock("@mantine/modals", () => ({
  modals: { open: modalsOpen, closeAll: vi.fn() },
}));

import { EmailVerificationModal } from "./email-verification-modal";

const typeOtp = (code: string) => {
  fireEvent.paste(screen.getAllByRole("textbox")[0], {
    clipboardData: { getData: () => code },
  });
};

const textTrimmed = (expected: string) => (_: string, node: any) =>
  !!node && node.textContent?.replace(/\s+/g, " ").trim() === expected;

describe("EmailVerificationModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the email verification layout", () => {
    const initiate = vi.fn();
    renderWithProviders(
      <EmailVerificationModal email="a@b.com" intitiateWithdrawal={initiate} />
    );
    expect(screen.getByText(textTrimmed("Email Verification"))).toBeInTheDocument();
    expect(screen.getByText(/6-digit verification code/)).toBeInTheDocument();
    expect(screen.getByText("a@b.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify" })).toBeDisabled();
    expect(screen.getByText("Google Authenticator")).toBeInTheDocument();
  });

  it("verifies the OTP and passes it to the withdrawal callback", async () => {
    const initiate = vi.fn();
    renderWithProviders(
      <EmailVerificationModal
        email="a@b.com"
        intitiateWithdrawal={initiate}
        totpCode="111111"
      />
    );
    typeOtp("222222");
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    expect(auth.verifyEmail).toHaveBeenCalledWith({ email: "a@b.com", otp: "222222" });
    await waitFor(() => {
      expect(initiate).toHaveBeenCalledWith("222222", "111111");
    });
  });

  it("opens the authenticator modal through modals", () => {
    const initiate = vi.fn();
    renderWithProviders(
      <EmailVerificationModal email="a@b.com" intitiateWithdrawal={initiate} />
    );
    fireEvent.click(screen.getByText("Google Authenticator"));
    expect(modalsOpen).toHaveBeenCalledTimes(1);
    const args = modalsOpen.mock.calls[0][0];
    expect(args.children.type.name).toBe("AuthenticatorVerificationModal");
  });
});