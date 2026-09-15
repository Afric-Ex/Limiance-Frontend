import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { ChatInput } from "./chat-input";

describe("ChatInput", () => {
  it("renders the textarea with placeholder", () => {
    renderWithProviders(<ChatInput onSendMessage={vi.fn()} />);
    expect(screen.getByPlaceholderText("Type a message...")).toBeInTheDocument();
  });

  it("calls onSendMessage with trimmed text on button click", () => {
    const onSend = vi.fn();
    renderWithProviders(<ChatInput onSendMessage={onSend} />);
    const textarea = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(textarea, { target: { value: "  Hello  " } });
    // Find the send button (ActionIcon)
    const buttons = document.querySelectorAll("button");
    const sendBtn = Array.from(buttons).find((b) => b.querySelector("svg"));
    expect(sendBtn).toBeTruthy();
    fireEvent.click(sendBtn!);
    expect(onSend).toHaveBeenCalledWith("Hello");
  });

  it("clears textarea after sending", () => {
    const onSend = vi.fn();
    renderWithProviders(<ChatInput onSendMessage={onSend} />);
    const textarea = screen.getByPlaceholderText("Type a message...") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Hi" } });
    const buttons = document.querySelectorAll("button");
    const sendBtn = Array.from(buttons).find((b) => b.querySelector("svg"));
    fireEvent.click(sendBtn!);
    expect(textarea.value).toBe("");
  });

  it("does not send empty messages", () => {
    const onSend = vi.fn();
    renderWithProviders(<ChatInput onSendMessage={onSend} />);
    const textarea = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(textarea, { target: { value: "   " } });
    const buttons = document.querySelectorAll("button");
    const sendBtn = Array.from(buttons).find((b) => b.querySelector("svg"));
    fireEvent.click(sendBtn!);
    expect(onSend).not.toHaveBeenCalled();
  });

  it("sends on Enter key (without Shift)", () => {
    const onSend = vi.fn();
    renderWithProviders(<ChatInput onSendMessage={onSend} />);
    const textarea = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(textarea, { target: { value: "Test msg" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("Test msg");
  });

  it("does not send on Shift+Enter", () => {
    const onSend = vi.fn();
    renderWithProviders(<ChatInput onSendMessage={onSend} />);
    const textarea = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(textarea, { target: { value: "Test" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables input when disabled prop is true", () => {
    renderWithProviders(<ChatInput onSendMessage={vi.fn()} disabled={true} />);
    const textarea = screen.getByPlaceholderText("Type a message...");
    expect(textarea).toBeDisabled();
  });
});
