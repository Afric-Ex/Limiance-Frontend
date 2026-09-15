import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { ReleaseCryptoModal } from "./release-crypto-modal";

const makeProps = (overrides = {}) => ({
  opened: true,
  onClose: vi.fn(),
  quantity: 0.5,
  asset: "BTC",
  counterpartyName: "John Buyer",
  fiatAmount: 50000,
  fiat: "USD",
  otpRequested: false,
  otpValue: "",
  setOtpValue: vi.fn(),
  isRequestingCode: false,
  isReleasing: false,
  handleRequestOtp: vi.fn(),
  handleRelease: vi.fn(),
  showFinalConfirm: false,
  setShowFinalConfirm: vi.fn(),
  ...overrides,
});

describe("ReleaseCryptoModal", () => {
  it("renders request-code step initially", () => {
    renderWithProviders(<ReleaseCryptoModal {...makeProps()} />);
    expect(screen.getByText("Security Verification Required")).toBeTruthy();
    expect(screen.getByText("Send Verification Code")).toBeInTheDocument();
  });

  it("calls handleRequestOtp when Send Verification Code clicked", () => {
    const props = makeProps();
    renderWithProviders(<ReleaseCryptoModal {...props} />);
    fireEvent.click(screen.getByText("Send Verification Code"));
    expect(props.handleRequestOtp).toHaveBeenCalledTimes(1);
  });

  it("shows PIN input once OTP requested", () => {
    const props = makeProps({ otpRequested: true });
    renderWithProviders(<ReleaseCryptoModal {...props} />);
    expect(screen.getByText("Verify Code")).toBeInTheDocument();
    expect(screen.getByText("Resend Code")).toBeInTheDocument();
  });

  it("Verify Code is disabled until 6 digits entered", () => {
    renderWithProviders(
      <ReleaseCryptoModal {...makeProps({ otpRequested: true })} />
    );
    const verifyBtn = screen.getByText("Verify Code").closest("button");
    expect(verifyBtn).toBeDisabled();
  });

  it("shows final confirmation when showFinalConfirm", () => {
    const props = makeProps({ otpRequested: true, showFinalConfirm: true });
    renderWithProviders(<ReleaseCryptoModal {...props} />);
    expect(screen.getByText("Final Confirmation")).toBeInTheDocument();
    expect(screen.getByText(/John Buyer/)).toBeInTheDocument();
    expect(screen.getByText("Release Now")).toBeInTheDocument();
  });

  it("calls handleRelease from final confirm", () => {
    const props = makeProps({ otpRequested: true, showFinalConfirm: true });
    renderWithProviders(<ReleaseCryptoModal {...props} />);
    fireEvent.click(screen.getByText("Release Now"));
    expect(props.handleRelease).toHaveBeenCalledTimes(1);
  });

  it("goes back from final confirmation to OTP step", () => {
    const props = makeProps({ otpRequested: true, showFinalConfirm: true });
    renderWithProviders(<ReleaseCryptoModal {...props} />);
    fireEvent.click(screen.getByText("Back"));
    expect(props.setShowFinalConfirm).toHaveBeenCalledWith(false);
  });

  it("closes modal and resets final confirm state", () => {
    const props = makeProps({ showFinalConfirm: true });
    renderWithProviders(<ReleaseCryptoModal {...props} />);
    // Close via the modal X: find close button by aria-label or svg
    const closeBtn = document.querySelector(".mantine-Modal-close");
    fireEvent.click(closeBtn as HTMLElement);
    expect(props.setShowFinalConfirm).toHaveBeenCalledWith(false);
    expect(props.onClose).toHaveBeenCalled();
  });
});