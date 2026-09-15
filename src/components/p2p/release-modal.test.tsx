import React from "react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { screen, fireEvent, act } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { ReleaseModal } from "./release-modal";

const makeProps = () => ({
  isOpen: true,
  onClose: vi.fn(),
  onCodeVerified: vi.fn(),
});

describe("ReleaseModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders security verification modal", () => {
    renderWithProviders(<ReleaseModal {...makeProps()} />);
    expect(screen.getByText("Security Verification")).toBeTruthy();
    expect(screen.getByText(/6-digit code/)).toBeInTheDocument();
  });

  it("Verify Code is disabled until 6 digits are entered", () => {
    renderWithProviders(<ReleaseModal {...makeProps()} />);
    const verifyBtn = screen.getByText("Verify Code").closest("button");
    expect(verifyBtn).toBeDisabled();
  });

  it("calls onCodeVerified with 6-digit code", () => {
    const props = makeProps();
    renderWithProviders(<ReleaseModal {...props} />);
    const inputs = screen.getAllByRole("textbox");
    const code = "123456";
    inputs.forEach((input, i) => {
      fireEvent.change(input, { target: { value: code[i] } });
    });
    const verifyBtn = screen.getByText("Verify Code").closest("button");
    expect(verifyBtn).toBeEnabled();
    fireEvent.click(verifyBtn!);
    expect(props.onCodeVerified).toHaveBeenCalledTimes(1);
  });

  it("shows resend countdown then enables resend", async () => {
    renderWithProviders(<ReleaseModal {...makeProps()} />);
    expect(screen.getByText("Resend in 45s")).toBeInTheDocument();

    for (let i = 0; i < 45; i++) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }
    expect(screen.getByText("Resend Code")).toBeInTheDocument();
  });

  it("calls onClose on cancel", () => {
    const props = makeProps();
    renderWithProviders(<ReleaseModal {...props} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("does not call onCodeVerified with incomplete code", () => {
    const props = makeProps();
    renderWithProviders(<ReleaseModal {...props} />);
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "1" } });
    const verifyBtn = screen.getByText("Verify Code").closest("button");
    fireEvent.click(verifyBtn!);
    expect(props.onCodeVerified).not.toHaveBeenCalled();
  });
});