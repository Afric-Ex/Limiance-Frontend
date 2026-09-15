import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { BlockUserModal } from "./block-user-modal";

const makeProps = () => ({
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  username: "BadTrader",
});

describe("BlockUserModal", () => {
  it("renders when open", () => {
    renderWithProviders(<BlockUserModal {...makeProps()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to block/)).toBeInTheDocument();
    expect(screen.getByText("BadTrader")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithProviders(<BlockUserModal {...makeProps()} isOpen={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows block consequences", () => {
    renderWithProviders(<BlockUserModal {...makeProps()} />);
    expect(screen.getByText(/You will no longer see their ads/)).toBeInTheDocument();
    expect(screen.getByText(/They will not be able to interact/)).toBeInTheDocument();
  });

  it("calls onConfirm with reason text on confirm", () => {
    const props = makeProps();
    renderWithProviders(<BlockUserModal {...props} />);
    const textarea = screen.getByPlaceholderText(/Reason for blocking/);
    fireEvent.change(textarea, { target: { value: "Spamming" } });
    fireEvent.click(screen.getAllByText("Block User")[1]);
    expect(props.onConfirm).toHaveBeenCalledWith("Spamming");
  });

  it("calls onConfirm with empty string when no reason given", () => {
    const props = makeProps();
    renderWithProviders(<BlockUserModal {...props} />);
    fireEvent.click(screen.getAllByText("Block User")[1]);
    expect(props.onConfirm).toHaveBeenCalledWith("");
  });

  it("resets the reason field after confirming", () => {
    const props = makeProps();
    renderWithProviders(<BlockUserModal {...props} />);
    const textarea = screen.getByPlaceholderText(/Reason for blocking/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Spam" } });
    fireEvent.click(screen.getAllByText("Block User")[1]);
    expect(props.onConfirm).toHaveBeenCalledWith("Spam");
  });

  it("calls onClose on cancel", () => {
    const props = makeProps();
    renderWithProviders(<BlockUserModal {...props} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(props.onClose).toHaveBeenCalled();
  });
});