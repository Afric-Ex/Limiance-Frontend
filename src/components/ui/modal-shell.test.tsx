import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { ModalShell } from "./modal-shell";

describe("ModalShell", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <ModalShell open={false} onClose={() => {}} title="Modal">
        content
      </ModalShell>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders an accessible dialog with title and children", () => {
    render(
      <ModalShell open onClose={() => {}} title="Delete" labelledBy="delete-title">
        body text
      </ModalShell>
    );
    const dialog = screen.getByRole("dialog", { name: "Delete" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("body text")).toBeInTheDocument();
  });

  it("renders icon and footer", () => {
    render(
      <ModalShell
        open
        onClose={() => {}}
        icon={<span>ICO</span>}
        title="Title"
        footer={<button>Confirm</button>}
      >
        body
      </ModalShell>
    );
    expect(screen.getByText("ICO")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <ModalShell open onClose={onClose} title="Modal">
        body
      </ModalShell>
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking outside the dialog", () => {
    const onClose = vi.fn();
    const { container } = render(
      <ModalShell open onClose={onClose} title="Modal">
        body
      </ModalShell>
    );
    fireEvent.mouseDown(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside the dialog", () => {
    const onClose = vi.fn();
    render(
      <ModalShell open onClose={onClose} title="Modal">
        body
      </ModalShell>
    );
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
  });
});