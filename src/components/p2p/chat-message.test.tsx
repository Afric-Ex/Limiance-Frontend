import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { ChatMessage } from "./chat-message";

const ownMessage = {
  id: "msg-1",
  content: "Hello there!",
  senderId: "u1",
  createdAt: "2025-06-15T10:30:00Z",
};

const otherMessage = {
  id: "msg-2",
  content: "Hi, how can I help?",
  senderId: "u2",
  createdAt: "2025-06-15T10:31:00Z",
};

const systemMessage = {
  id: "msg-3",
  content: "Order has been placed",
  senderId: "system",
  createdAt: "2025-06-15T10:32:00Z",
  type: "system" as const,
};

const imageMessage = {
  id: "msg-4",
  content: "screenshot",
  senderId: "u2",
  createdAt: "2025-06-15T10:33:00Z",
  type: "image" as const,
  imageUrl: "https://test.com/proof.png",
};

describe("ChatMessage", () => {
  it("renders own message with double check marks", () => {
    renderWithProviders(<ChatMessage message={ownMessage} isOwn={true} />);
    expect(screen.getByText("Hello there!")).toBeInTheDocument();
    expect(screen.getByText("✓✓")).toBeInTheDocument();
  });

  it("renders other's message without check marks", () => {
    renderWithProviders(<ChatMessage message={otherMessage} isOwn={false} />);
    expect(screen.getByText("Hi, how can I help?")).toBeInTheDocument();
    expect(screen.queryByText("✓✓")).not.toBeInTheDocument();
  });

  it("renders system messages centered", () => {
    renderWithProviders(<ChatMessage message={systemMessage} isOwn={false} />);
    expect(screen.getByText("Order has been placed")).toBeInTheDocument();
  });

  it("renders image messages with thumbnail", () => {
    renderWithProviders(<ChatMessage message={imageMessage} isOwn={false} />);
    const img = screen.getByAltText("Chat attachment");
    expect(img).toHaveAttribute("src", "https://test.com/proof.png");
  });

  it("formats timestamp", () => {
    renderWithProviders(<ChatMessage message={ownMessage} isOwn={true} />);
    // Should display time in locale format
    const timeEl = screen.getByText(/\d{1,2}:\d{2}/);
    expect(timeEl).toBeInTheDocument();
  });
});
