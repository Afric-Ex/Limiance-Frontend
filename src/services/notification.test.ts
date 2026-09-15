vi.mock("../lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  apiRoot: { get: vi.fn(), post: vi.fn() },
}));

import { api } from "../lib/axios";
import { notificationKeys, notificationService } from "./notification";

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPatch = vi.mocked(api.patch);

const axiosResponse = (data: unknown, status = 200) => ({
  data,
  status,
  statusText: "OK",
  headers: {},
  config: {},
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("notificationKeys", () => {
  it("declares the expected query keys", () => {
    expect(notificationKeys.list).toEqual(["notifications"]);
    expect(notificationKeys.unreadCount).toEqual(["notifications-unread-count"]);
  });
});

describe("notificationService.getNotifications", () => {
  it("fetches the notifications", async () => {
    mockGet.mockResolvedValueOnce(axiosResponse({ data: [] }));
    const result = await notificationService.getNotifications();
    expect(mockGet).toHaveBeenCalledWith("notifications/");
    expect(result).toEqual({ data: [] });
  });

  it("rejects when the request fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("notifications failed"));
    await expect(notificationService.getNotifications()).rejects.toThrow("notifications failed");
  });
});

describe("notificationService.markRead", () => {
  it("patches the notification as read", async () => {
    mockPatch.mockResolvedValueOnce(axiosResponse({ success: true }));
    const result = await notificationService.markRead("n1");
    expect(mockPatch).toHaveBeenCalledWith("notifications/n1/read");
    expect(result).toEqual({ success: true });
  });

  it("rejects when the request fails", async () => {
    mockPatch.mockRejectedValueOnce(new Error("mark read failed"));
    await expect(notificationService.markRead("n1")).rejects.toThrow("mark read failed");
  });
});

describe("notificationService.markAllRead", () => {
  it("patches read-all", async () => {
    mockPatch.mockResolvedValueOnce(axiosResponse({ success: true }));
    const result = await notificationService.markAllRead();
    expect(mockPatch).toHaveBeenCalledWith("notifications/read-all");
    expect(result).toEqual({ success: true });
  });

  it("rejects when the request fails", async () => {
    mockPatch.mockRejectedValueOnce(new Error("mark all read failed"));
    await expect(notificationService.markAllRead()).rejects.toThrow("mark all read failed");
  });
});

describe("notificationService.saveFcmToken", () => {
  it("posts the device token payload", async () => {
    mockPost.mockResolvedValueOnce(axiosResponse({ success: true }));
    const result = await notificationService.saveFcmToken({ token: "fcm-1", device: "web" });
    expect(mockPost).toHaveBeenCalledWith("notifications/device-token", {
      deviceToken: "fcm-1",
      platform: "web",
    });
    expect(result).toEqual({ success: true });
  });

  it("rejects when the request fails", async () => {
    mockPost.mockRejectedValueOnce(new Error("fcm failed"));
    await expect(
      notificationService.saveFcmToken({ token: "fcm-1", device: "web" })
    ).rejects.toThrow("fcm failed");
  });
});