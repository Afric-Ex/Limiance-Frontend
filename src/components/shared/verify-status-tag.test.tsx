import React from "react";
(globalThis as any).React = React;
import { render, screen } from "@testing-library/react";
import { VerifyStatusTag } from "./verify-status-tag";

describe("VerifyStatusTag", () => {
  it("shows Verified when the verified flag is set", () => {
    render(<VerifyStatusTag verified />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("shows Verified for an approved KYC status", () => {
    render(<VerifyStatusTag status="approved" />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("shows Pending for pending statuses", () => {
    for (const status of ["pending", "processing", "under_review"]) {
      const { unmount } = render(<VerifyStatusTag status={status} />);
      expect(screen.getByText("Pending")).toBeInTheDocument();
      unmount();
    }
  });

  it("shows Rejected for a rejected status", () => {
    render(<VerifyStatusTag status="rejected" />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("shows Failed for a failed status", () => {
    render(<VerifyStatusTag status="failed" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("shows Unverified by default", () => {
    render(<VerifyStatusTag />);
    expect(screen.getByText("Unverified")).toBeInTheDocument();
  });

  it("normalises casing of the status", () => {
    render(<VerifyStatusTag status="APPROVED" />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });
});