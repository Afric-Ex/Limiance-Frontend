import { renderHook, act, waitFor } from "@testing-library/react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/src/lib/firebase";
import { notificationService } from "@/src/services/notification";
import toast from "react-hot-toast";
import { useFCM } from "./use-fcm";

vi.mock("firebase/messaging", () => ({
  getToken: vi.fn(),
  onMessage: vi.fn(),
}));

vi.mock("@/src/lib/firebase", () => ({
  messaging: vi.fn(),
}));

vi.mock("@/src/services/notification", () => ({
  notificationService: {
    saveFcmToken: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    custom: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock("@/src/stores/notification-store", () => ({
  useNotificationStore: {
    getState: () => ({
      addNotification: vi.fn(),
    }),
  },
}));

function stubNotificationPermission(value: NotificationPermission) {
  (window as any).Notification = {
    requestPermission: vi.fn().mockResolvedValue(value),
  };
}

describe("useFCM", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns undefined (no return value expected)", () => {
    const { result } = renderHook(() => useFCM());
    expect(result.current).toBeUndefined();
  });

  it("does nothing when Notification API is missing", async () => {
    delete (window as any).Notification;

    renderHook(() => useFCM());

    await waitFor(() => {
      expect(sessionStorage.getItem("fcm_token_registered")).toBeNull();
    });
  });

  it("requests permission and returns when denied", async () => {
    stubNotificationPermission("denied");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "fake-vapid-key");

    renderHook(() => useFCM());

    await waitFor(() => {
      expect(window.Notification.requestPermission).toHaveBeenCalled();
    });
  });

  it("skips when VAPID key not configured", async () => {
    stubNotificationPermission("granted");
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "<ADD_YOUR_VAPID_KEY_HERE>");

    const { useFCM: UnconfiguredUseFCM } = await import("./use-fcm");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    renderHook(() => UnconfiguredUseFCM());

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  it("handles full flow with token registration", async () => {
    stubNotificationPermission("granted");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "fake-vapid-key");

    const messageHandler = vi.fn();
    messaging.mockResolvedValue({ app: {} });
    getToken.mockResolvedValue("fcm-token-123");
    notificationService.saveFcmToken.mockResolvedValue({ data: {} });
    onMessage.mockImplementation((_m, cb) => {
      messageHandler(cb);
      return () => {};
    });

    const mockRegister = vi.fn().mockResolvedValue({});
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: mockRegister },
      configurable: true,
    });

    renderHook(() => useFCM());

    await waitFor(() => {
      expect(sessionStorage.getItem("fcm_token_registered")).toBe("true");
    });

    expect(notificationService.saveFcmToken).toHaveBeenCalledWith({
      token: "fcm-token-123",
      device: "web",
    });

    await act(async () => {
      const handler = messageHandler.mock.calls[0][0];
      handler({
        notification: { title: "Hello", body: "World" },
      });
    });

    expect(toast.custom).toHaveBeenCalled();
  });

  it("does not register token when session already registered", async () => {
    stubNotificationPermission("granted");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "fake-vapid-key");

    sessionStorage.setItem("fcm_token_registered", "true");

    messaging.mockResolvedValue({ app: {} });

    renderHook(() => useFCM());

    await waitFor(() => {
      expect(messaging).toHaveBeenCalled();
    });

    expect(notificationService.saveFcmToken).not.toHaveBeenCalled();
  });

  it("handles saveFcmToken failure gracefully", async () => {
    stubNotificationPermission("granted");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "fake-vapid-key");

    messaging.mockResolvedValue({ app: {} });
    getToken.mockResolvedValue("fcm-token-fail");
    notificationService.saveFcmToken.mockRejectedValue(new Error("backend down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderHook(() => useFCM());

    await waitFor(() => {
      expect(notificationService.saveFcmToken).toHaveBeenCalled();
    });

    expect(sessionStorage.getItem("fcm_token_registered")).toBeNull();
  });

  it("handles init errors gracefully", async () => {
    stubNotificationPermission("granted");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "fake-vapid-key");

    messaging.mockRejectedValue(new Error("firebase init failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { unmount } = renderHook(() => useFCM());

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });

    unmount();
  });

  it("shows default title Limiance for messages", async () => {
    stubNotificationPermission("granted");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_VAPID_KEY", "fake-vapid-key");

    const messageHandler = vi.fn();
    messaging.mockResolvedValue({ app: {} });
    getToken.mockResolvedValue("token");
    notificationService.saveFcmToken.mockResolvedValue({});
    onMessage.mockImplementation((_m, cb) => {
      messageHandler(cb);
      return () => {};
    });

    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: vi.fn().mockResolvedValue({}) },
      configurable: true,
    });

    renderHook(() => useFCM());

    await waitFor(() => {
      expect(sessionStorage.getItem("fcm_token_registered")).toBe("true");
    });

    await act(async () => {
      const handler = messageHandler.mock.calls[0][0];
      handler({ notification: {} });
    });

    expect(toast.custom).toHaveBeenCalled();
  });
});