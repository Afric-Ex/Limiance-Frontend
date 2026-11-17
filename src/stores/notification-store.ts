import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  type?: string;
  link?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  viewing: AppNotification | null;
  /** Id of the account the cached notifications belong to. Persisted items are
   *  only trusted for this account; a different (or unknown) account clears
   *  them so a new login never inherits a previous user's notifications. */
  ownerId: string | null;
  addNotification: (notification: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  setNotifications: (notifications: AppNotification[], ownerId?: string | null) => void;
  setOwner: (ownerId: string | null) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  openNotification: (notification: AppNotification) => void;
  closeNotification: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      viewing: null,
      ownerId: null,

      addNotification: (notification) =>
        set((state) => {
          // Dedupe by title+body so re-delivered FCM pushes don't pile up
          const isDuplicate = state.notifications.some(
            (n) => n.title === notification.title && n.body === notification.body
          );
          if (isDuplicate) return state;

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

      // Merge server-fetched notifications with anything added locally via FCM.
      // Server items win by id; local-only items (e.g. foreground pushes not yet
      // persisted on the backend) are preserved. An empty server list is
      // authoritative: it means the backend has no records, so drop local-only
      // items too.
      setNotifications: (serverNotifications, ownerId) =>
        set((state) => {
          // Only keep local-only items (e.g. foreground FCM pushes) when they
          // were added while the same account is signed in. Otherwise the store
          // was persisted from a different account and must not leak through.
          const sameOwner = ownerId != null && state.ownerId === ownerId;
          const localNotifications = sameOwner ? state.notifications : [];
          const serverIds = new Set(serverNotifications.map((n) => n.id));

          const merged = serverNotifications.length
            ? [...serverNotifications, ...localNotifications.filter((n) => !serverIds.has(n.id))]
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 100)
            : [];

          return {
            notifications: merged,
            unreadCount: merged.filter((n) => !n.read).length,
            ownerId: ownerId ?? state.ownerId,
          };
        }),

      setOwner: (ownerId) =>
        set((state) => {
          if (state.ownerId === ownerId) return state;
          // Different account (or first load after an upgrade where the owner
          // was not recorded): drop everything cached for the previous owner.
          return { ownerId, notifications: [], unreadCount: 0, viewing: null };
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
          ownerId: null,
        }),

      openNotification: (notification) =>
        set({ viewing: notification }),

      closeNotification: () =>
        set({ viewing: null }),
    }),
    {
      name: "limiance-notifications",
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
        ownerId: state.ownerId,
      }),
    }
  )
);