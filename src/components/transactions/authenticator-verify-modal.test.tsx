import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { AuthenticatorVerificationModal } from "./authenticator-verify-modal";
import { EmailVerificationModal } from "./email-verification-modal";

const { modalsOpen, modalsCloseAll } = vi.hoisted(() => ({
  modalsOpen: vi.fn(),
  modalsCloseAll: vi.fn(),
}));

vi.mock("@mantine/modals", () => ({
  modals: { open: modalsOpen, closeAll: modalsCloseAll },
}));

const typePin = (code: string) => {
  const inputs = screen.getAllByRole("textbox");
  code.split("").forEach((digit, i) => {
    fireEvent.change(inputs[i], { target: { value: digit } });
  });
};

const textTrimmed = (expected: string) => (_: string, node: any) =>
  !!node && node.textContent?.replace(/\s+/g, " ").trim() === expected;

describe("AuthenticatorVerificationModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the authenticator verification layout", () => {
    renderWithProviders(
      <AuthenticatorVerificationModal email="a@b.com" intitiateWithdrawal={vi.fn()} />
    );
    expect(screen.getByText("Security Verification")).toBeInTheDocument();
    expect(screen.getByText(textTrimmed("Authenticator Code"))).toBeInTheDocument();
    expect(screen.getByText("Enter 6-digit Code")).toBeInTheDocument();
    expect(screen.getByText(/Code refreshes in/)).toBeInTheDocument();
    expect(screen.getByText("Email Verification")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify" })).toBeDisabled();
  });

  it("submits via the Verify button when the code is complete", () => {
    const initiate = vi.fn();
    renderWithProviders(
      <AuthenticatorVerificationModal email="a@b.com" intitiateWithdrawal={initiate} />
    );
    typePin("654321");
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    expect(initiate).toHaveBeenCalledWith("", "654321");
    expect(modalsCloseAll).toHaveBeenCalled();
  });

  it("calls onFallback instead of opening the email modal when provided", () => {
    const onFallback = vi.fn();
    renderWithProviders(
      <AuthenticatorVerificationModal
        email="a@b.com"
        intitiateWithdrawal={vi.fn()}
        onFallback={onFallback}
      />
    );
    fireEvent.click(screen.getByText("Email Verification"));
    expect(onFallback).toHaveBeenCalled();
    expect(modalsOpen).not.toHaveBeenCalled();
  });

  it("opens the email verification modal through modals when no fallback is provided", () => {
    renderWithProviders(
      <AuthenticatorVerificationModal email="a@b.com" intitiateWithdrawal={vi.fn()} />
    );
    fireEvent.click(screen.getByText("Email Verification"));
    expect(modalsOpen).toHaveBeenCalledTimes(1);
    const args = modalsOpen.mock.calls[0][0];
    expect(args.children.type).toBe(EmailVerificationModal);
    expect(args.children.props.email).toBe("a@b.com");
  });
});