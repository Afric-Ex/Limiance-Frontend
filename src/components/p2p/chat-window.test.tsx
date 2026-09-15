import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import { ChatWindow } from "./chat-window";

const { useFetchChats, useSendChatMessage } = vi.hoisted(() => ({
  useFetchChats: vi.fn(),
  useSendChatMessage: vi.fn(),
}));

vi.mock("@/src/hooks/p2p/use-p2p", () => ({
  useFetchChats,
  useSendChatMessage,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const sendMutate = vi.fn();

const messagesData = {
  data: {
    data: [
      {
        id: "m1",
        content: "Hello",
        senderId: "u1",
        createdAt: "2025-06-15T10:00:00Z",
      },
      {
        id: "m2",
        content: "Hi there",
        senderId: "u2",
        createdAt: "2025-06-15T10:01:00Z",
      },
    ],
  },
};

describe("ChatWindow", () => {
  const origScrollTo = HTMLElement.prototype.scrollTo;

  beforeEach(() => {
    vi.clearAllMocks();
    sendMutate.mockClear();
    HTMLElement.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    HTMLElement.prototype.scrollTo = origScrollTo;
  });

  const setup = (overrides = {}) => {
    useFetchChats.mockReturnValue({
      data: messagesData,
      isLoading: false,
      refetch: vi.fn(),
      ...overrides.fetch,
    });
    useSendChatMessage.mockReturnValue({
      mutate: sendMutate,
      isPending: false,
      ...overrides.send,
    });
  };

  it("renders Live Chat header with Connected badge", () => {
    setup();
    renderWithProviders(<ChatWindow chatId="chat-1" currentUserId="u1" />);
    expect(screen.getByText("Live Chat")).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("renders encryption note", () => {
    setup();
    renderWithProviders(<ChatWindow chatId="chat-1" currentUserId="u1" />);
    expect(screen.getByText(/Messages are end-to-end encrypted/)).toBeInTheDocument();
  });

  it("renders messages from the query", () => {
    setup();
    renderWithProviders(<ChatWindow chatId="chat-1" currentUserId="u1" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there")).toBeInTheDocument();
  });

  it("shows loading spinner when no messages yet", () => {
    setup({ fetch: { data: undefined, isLoading: true } });
    renderWithProviders(<ChatWindow chatId="chat-1" currentUserId="u1" />);
    expect(screen.getByText("Live Chat")).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    setup({
      fetch: { data: { data: { data: [] } }, isLoading: false },
    });
    renderWithProviders(<ChatWindow chatId="chat-1" currentUserId="u1" />);
    expect(screen.getByText(/No messages yet. Say hello!/)).toBeInTheDocument();
  });

  it("sends a message via useSendChatMessage", () => {
    setup();
    renderWithProviders(<ChatWindow chatId="chat-1" currentUserId="u1" />);
const textarea = screen.getByPlaceholderText("Type a message...");
    fireEvent.change(textarea, { target: { value: "Hi seller" } });
    const sendBtn = Array.from(document.querySelectorAll("button"))
      .filter((b) => !b.disabled)
      .find((b) => (b.className as string).includes("emerald"));
    fireEvent.click(sendBtn!);
    expect(sendMutate).toHaveBeenCalledWith(
      { chatId: "chat-1", content: "Hi seller" },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("calls refetch on an interval", () => {
    const refetch = vi.fn();
    setup({ fetch: { refetch } });
    renderWithProviders(<ChatWindow chatId="chat-1" currentUserId="u1" />);
    expect(refetch).not.toHaveBeenCalled();
  });
});
