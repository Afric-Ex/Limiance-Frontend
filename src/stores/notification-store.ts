import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  type?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) =>
        set((state) => {
          const newNotification: AppNotification = {
            ...notification,
            id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            createdAt: Date.now(),
            read: false,
          };
          
          // Keep a maximum of 50 notifications to avoid bloating local storage
          const updatedNotifications = [newNotification, ...state.notifications].slice(0, 50);
          
          return {
            notifications: updatedNotifications,
            unreadCount: state.unreadCount + 1,
          };
        }),

      markAsRead: (id) =>
        set((state) => {
          let wasUnread = false;
          const updatedNotifications = state.notifications.map((n) => {
            if (n.id === id && !n.read) {
              wasUnread = true;
              return { ...n, read: true };
            }
            return n;
          });

          return {
            notifications: updatedNotifications,
            unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          };
        }),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      clearAll: () =>
        set({
          notifications: [],
          unreadCount: 0,
        }),
    }),
    {
      name: "limiance-notifications",
    }
  )
);
