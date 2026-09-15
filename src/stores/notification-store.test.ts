import { useNotificationStore } from "./notification-store";

describe("notification-store", () => {
  const input = { title: "Order filled", body: "Your order has been filled", type: "order" };

  const resetState = () => {
    useNotificationStore.setState({ notifications: [], unreadCount: 0 });
  };

  beforeEach(() => {
    localStorage.clear();
    resetState();
  });

  it("has the initial state values", () => {
    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it("addNotification builds a full notification and increments unreadCount", () => {
    useNotificationStore.getState().addNotification(input);

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(1);
    expect(state.notifications).toHaveLength(1);

    const notification = state.notifications[0];
    expect(notification.title).toBe("Order filled");
    expect(notification.body).toBe("Your order has been filled");
    expect(notification.type).toBe("order");
    expect(notification.read).toBe(false);
    expect(typeof notification.id).toBe("string");
    expect(notification.id.length).toBeGreaterThan(0);
    expect(notification.createdAt).toBeGreaterThan(0);
  });

  it("addNotification prepends new notifications to the front", () => {
    useNotificationStore.getState().addNotification({ ...input, title: "first" });
    useNotificationStore.getState().addNotification({ ...input, title: "second" });

    const titles = useNotificationStore.getState().notifications.map((n) => n.title);
    expect(titles).toEqual(["second", "first"]);
    expect(useNotificationStore.getState().unreadCount).toBe(2);
  });

  it("addNotification generates unique ids", () => {
    for (let i = 0; i < 10; i++) {
      useNotificationStore.getState().addNotification({ ...input, title: `n-${i}` });
    }
    const ids = useNotificationStore.getState().notifications.map((n) => n.id);
    expect(new Set(ids).size).toBe(10);
  });

  it("addNotification caps the notification list at 50 entries", () => {
    for (let i = 0; i < 55; i++) {
      useNotificationStore.getState().addNotification({ ...input, title: `n-${i}` });
    }
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(50);
    expect(state.unreadCount).toBe(55);
  });

  it("markAsRead marks a notification read and decrements unreadCount", () => {
    useNotificationStore.getState().addNotification(input);
    const id = useNotificationStore.getState().notifications[0].id;

    useNotificationStore.getState().markAsRead(id);

    const state = useNotificationStore.getState();
    expect(state.notifications[0].read).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("markAsRead is a no-op for already-read notifications", () => {
    useNotificationStore.getState().addNotification(input);
    const id = useNotificationStore.getState().notifications[0].id;
    useNotificationStore.getState().markAsRead(id);
    useNotificationStore.getState().markAsRead(id);

    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it("markAsRead ignores unknown ids and leaves unreadCount untouched", () => {
    useNotificationStore.getState().addNotification(input);
    useNotificationStore.getState().markAsRead("missing-id");

    const state = useNotificationStore.getState();
    expect(state.notifications[0].read).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it("markAsRead for a mixed list decrements by exactly one unread item", () => {
    useNotificationStore.getState().addNotification({ ...input, title: "first" });
    useNotificationStore.getState().addNotification({ ...input, title: "second" });
    useNotificationStore.getState().addNotification({ ...input, title: "third" });
    const secondId = useNotificationStore.getState().notifications.find((n) => n.title === "second")!.id;

    useNotificationStore.getState().markAsRead(secondId);

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(2);
    expect(state.notifications.find((n) => n.id === secondId)?.read).toBe(true);
  });

  it("markAllAsRead marks every notification read and zeroes unreadCount", () => {
    useNotificationStore.getState().addNotification(input);
    useNotificationStore.getState().addNotification(input);
    useNotificationStore.getState().addNotification(input);

    useNotificationStore.getState().markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.notifications.every((n) => n.read)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("markAllAsRead is safe on an empty store", () => {
    useNotificationStore.getState().markAllAsRead();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useNotificationStore.getState().notifications).toEqual([]);
  });

  it("clearAll removes every notification and zeroes unreadCount", () => {
    useNotificationStore.getState().addNotification(input);
    useNotificationStore.getState().addNotification(input);
    useNotificationStore.getState().clearAll();

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
  });

  it("persists notifications and unreadCount under the limiance-notifications key", () => {
    useNotificationStore.getState().addNotification(input);
    useNotificationStore.getState().addNotification(input);
    useNotificationStore.getState().markAsRead(useNotificationStore.getState().notifications[0].id);

    const raw = localStorage.getItem("limiance-notifications");
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string)?.state;
    expect(stored.unreadCount).toBe(1);
    expect(stored.notifications).toHaveLength(2);
  });
});