import React from "react";
(globalThis as any).React = React;
import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationsDropdown, useNotificationCount } from "./notifications-dropdown";
import { useNotificationStore } from "@/src/stores/notification-store";

vi.mock("@/src/services/asset", () => ({
  asset: {},
  assetKeys: { all: ["asset"] },
}));

const markAsRead = vi.fn();
const markAllAsRead = vi.fn();
const clearAll = vi.fn();

const notifications = [
  {
    id: "n1",
    title: "Deposit received",
    body: "Your deposit of 1 BTC was confirmed.",
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "n2",
    title: "Withdrawal complete",
    body: "Your withdrawal has been processed.",
    read: true,
    createdAt: new Date().toISOString(),
  },
];

function Count() {
  const count = useNotificationCount();
  return <span data-testid="count">{count}</span>;
}

describe("NotificationsDropdown", () => {
  beforeEach(() => {
    markAsRead.mockClear();
    markAllAsRead.mockClear();
    clearAll.mockClear();
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      markAsRead,
      markAllAsRead,
      clearAll,
    });
  });

  it("renders the empty state when there are no notifications", () => {
    render(<NotificationsDropdown />);
    expect(screen.getByText("No recent notifications")).toBeInTheDocument();
    expect(screen.queryByText("Mark all read")).not.toBeInTheDocument();
  });

  it("renders notification items", () => {
    useNotificationStore.setState({ notifications, unreadCount: 1 });
    render(<NotificationsDropdown />);
    expect(screen.getByText("Deposit received")).toBeInTheDocument();
    expect(screen.getByText("Withdrawal complete")).toBeInTheDocument();
  });

  it("marks a notification as read when clicked", () => {
    useNotificationStore.setState({ notifications, unreadCount: 1 });
    render(<NotificationsDropdown />);
    fireEvent.click(screen.getByText("Deposit received"));
    expect(markAsRead).toHaveBeenCalledWith("n1");
  });

  it("marks all as read and clears", () => {
    useNotificationStore.setState({ notifications, unreadCount: 1 });
    render(<NotificationsDropdown />);
    fireEvent.click(screen.getByText("Mark all read"));
    expect(markAllAsRead).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Clear"));
    expect(clearAll).toHaveBeenCalledTimes(1);
  });

  it("exposes the unread count via useNotificationCount", () => {
    useNotificationStore.setState({ unreadCount: 5 });
    render(<Count />);
    expect(screen.getByTestId("count")).toHaveTextContent("5");
  });
});