import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { ReportUserModal } from "./report-user-modal";

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  username: "SuspiciousUser",
};

describe("ReportUserModal", () => {
  it("renders when open", () => {
    renderWithProviders(<ReportUserModal {...defaultProps} />);
    expect(screen.getByText("Report User")).toBeInTheDocument();
    expect(screen.getByText(/SuspiciousUser/)).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithProviders(<ReportUserModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Report User")).not.toBeInTheDocument();
  });

  it("has report reasons selectable", () => {
    renderWithProviders(<ReportUserModal {...defaultProps} />);
    expect(screen.getByText("Reason")).toBeInTheDocument();
    expect(screen.getByText("Additional details")).toBeInTheDocument();
  });

  it("calls onSubmit with reason and details on submit", () => {
    renderWithProviders(<ReportUserModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Add anything useful/);
    fireEvent.change(textarea, { target: { value: "They sent fake proof" } });
    fireEvent.click(screen.getByText("Submit Report"));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith({
      reason: "Fraud or scam attempt",
      details: "They sent fake proof",
    });
  });

  it("calls onClose on cancel", () => {
    renderWithProviders(<ReportUserModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("shows loading state on submit button", () => {
    renderWithProviders(<ReportUserModal {...defaultProps} isSubmitting={true} />);
    expect(screen.getByText("Submit Report")).toBeInTheDocument();
  });
});
