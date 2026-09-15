import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { TotpGateModal } from "./totp-gate-modal";

vi.mock("@mantine/modals", () => ({
  modals: { open: vi.fn(), closeAll: vi.fn() },
}));

const typePin = (code: string) => {
  const inputs = screen.getAllByRole("textbox");
  code.split("").forEach((digit, i) => {
    fireEvent.change(inputs[i], { target: { value: digit } });
  });
};

const textTrimmed = (expected: string) => (_: string, node: any) =>
  !!node && node.textContent?.replace(/\s+/g, " ").trim() === expected;

describe("TotpGateModal", () => {
  it("renders the security verification layout", () => {
    renderWithProviders(<TotpGateModal onComplete={vi.fn()} />);
    expect(screen.getByText("Security Verification")).toBeInTheDocument();
    expect(screen.getByText(textTrimmed("Authenticator Code"))).toBeInTheDocument();
    expect(screen.getByText(/6-digit code to confirm this withdrawal/)).toBeInTheDocument();
    expect(screen.getByText("Refreshes every 30s")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Proceed" })).toBeDisabled();
  });

  it("calls onComplete when a 6-digit code is entered and Proceed is clicked", () => {
    const onComplete = vi.fn();
    renderWithProviders(<TotpGateModal onComplete={onComplete} />);
    typePin("123456");
    const proceed = screen.getByRole("button", { name: "Proceed" });
    expect(proceed).not.toBeDisabled();
    fireEvent.click(proceed);
    expect(onComplete).toHaveBeenCalledWith("123456");
  });
});