"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationKeys, notificationService } from "@/src/services/notification";
import { useNotificationStore, AppNotification } from "@/src/stores/notification-store";
import { useUserStore } from "@/src/stores/user-store";

const toAppNotification = (raw: any): AppNotification => {
  const rawCreatedAt = raw.createdAt ?? raw.created_at ?? raw.timestamp;
  const createdAt = rawCreatedAt
    ? new Date(rawCreatedAt).getTime()
    : Date.now();

  return {
    id: String(raw.id ?? raw._id ?? `${raw.title ?? "notification"}-${createdAt}`),
    title: String(raw.title ?? raw.heading ?? "Notification"),
    body: String(raw.body ?? raw.message ?? ""),
    read: Boolean(raw.read ?? raw.isRead ?? raw.is_read),
    type: raw.type ?? raw.kind,
    link: raw.link ?? raw.url,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
  };
};

/** Tolerantly unwrap whatever envelope the API returns. */
const normalizeNotifications = (res: any): AppNotification[] => {
  const list = Array.isArray(res?.notifications)
    ? res.notifications
    : Array.isArray(res?.data?.notifications)
      ? res.data.notifications
      : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
  return list.map(toAppNotification);
};

/**
 * Fetch the user's in-app notifications from the backend. Returns the
 * normalized list directly so consumers can render from the API response;
 * also seeds the local store (server items win by id, local FCM-only items
 * are kept) so the bell badge stays in sync. Polls every minute.
 */
export function useNotifications() {
  const user = useUserStore((s) => s.user);
  const setNotifications = useNotificationStore((s) => s.setNotifications);

  const query = useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => notificationService.getNotifications(),
    enabled: !!user,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const notifications = useMemo(() => normalizeNotifications(query.data), [query.data]);

  useEffect(() => {
    if (query.data) {
      setNotifications(notifications);
    }
  }, [query.data, notifications, setNotifications]);

  return { notifications, error: query.error, isLoading: query.isLoading };
}