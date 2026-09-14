import { api } from "../lib/axios";
import { ApiResponse } from "../types/api";

export const notificationKeys = {
  list: ["notifications"] as const,
  unreadCount: ["notifications-unread-count"] as const,
} as const;

export const notificationService = {
  /** Fetch all notifications for the current user */
  getNotifications: async (): Promise<ApiResponse<any>> => {
    const response = await api.get("notifications/");
    return response.data;
  },

  /** Mark a single notification as read */
  markRead: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.patch(`notifications/${id}/read`);
    return response.data;
  },

  /** Mark all notifications as read */
  markAllRead: async (): Promise<ApiResponse<any>> => {
    const response = await api.patch("notifications/read-all");
    return response.data;
  },

  /** Register or refresh the device FCM push token for this user */
  saveFcmToken: async (data: {
    token: string;
    device: "web";
  }): Promise<ApiResponse<any>> => {
    const response = await api.post("notifications/device-token", {
      deviceToken: data.token,
      platform: data.device,
    });
    return response.data;
  },
};
