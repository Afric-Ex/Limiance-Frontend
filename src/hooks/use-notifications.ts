"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationKeys, notificationService } from "@/src/services/notification";
import { useNotificationStore, AppNotification } from "@/src/stores/notification-store";
import { useUserStore } from "@/src/stores/user-store";
import { wsClient } from "@/src/lib/websocket-client";

/** Some notifications (e.g. `SWAP` records) carry `body` as a structured
 *  object instead of text — `String()` on those renders as `[object Object]`.
 *  Render conversion payloads as `0.2 LIM → 981.52 BTC`, and fall back to a
 *  short scalar summary for anything else. */
const toDisplayString = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return String(value);
  const b = value as Record<string, any>;
  const fromAmount = b.FromAmount ?? b.fromAmount ?? b.Amount ?? b.amount;
  const fromAsset = b.FromAsset ?? b.fromAsset ?? b.Asset ?? b.asset;
  const toAmount = b.ToAmount ?? b.toAmount;
  const toAsset = b.ToAsset ?? b.toAsset;
  if (
    fromAmount != null &&
    fromAmount !== "" &&
    fromAsset &&
    toAmount != null &&
    toAmount !== "" &&
    toAsset
  ) {
    return `${fromAmount} ${fromAsset} → ${toAmount} ${toAsset}`;
  }
  const parts: string[] = [];
  for (const key of ["Status", "status", "Type", "type", "Fee", "fee", "Hash", "hash"]) {
    const v = b[key];
    if (v != null && v !== "" && typeof v !== "object") parts.push(`${key}: ${v}`);
    if (parts.length >= 3) break;
  }
  if (parts.length) return parts.join(" • ");
  try {
    return JSON.stringify(b);
  } catch {
    return "";
  }
};

/** Swap-type records arrive with an empty title — derive one from `type`. */
const titleFromType = (type: unknown): string | undefined => {
  if (typeof type !== "string" || !type.trim()) return undefined;
  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const toAppNotification = (raw: any): AppNotification => {
  const rawCreatedAt = raw.createdAt ?? raw.created_at ?? raw.timestamp;
  const parsedCreatedAt = rawCreatedAt ? new Date(rawCreatedAt).getTime() : 0;
  const createdAt = Number.isFinite(parsedCreatedAt) ? parsedCreatedAt : 0;

  const title =
    raw.title || raw.heading
      ? String(raw.title ?? raw.heading)
      : (titleFromType(raw.type ?? raw.kind) ?? "Notification");
  const body = toDisplayString(raw.body ?? raw.message ?? "");

  return {
    id: String(raw.id ?? raw._id ?? `${title}|${body}|${createdAt}`),
    title,
    body,
    read: Boolean(raw.read ?? raw.isRead ?? raw.is_read),
    type: raw.type ?? raw.kind,
    link: raw.link ?? raw.url,
    createdAt,
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
  const setOwner = useNotificationStore((s) => s.setOwner);
  const queryClient = useQueryClient();
  const [wsData, setWsData] = useState<any>(undefined);

  const userId = user
    ? String(user.id ?? user.user_id ?? user.userId ?? "") || null
    : null;

  // Bind the cached notifications to the signed-in account. When the account
  // changes (new signup, account switch, logout) anything persisted for the
  // previous owner is dropped before the backend response is applied.
  useEffect(() => {
    setOwner(userId);
    setWsData(undefined);
  }, [userId, setOwner]);

  // Subscribe to real-time WebSocket notification_history stream
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = wsClient.subscribe(
      "notification_history",
      { type: "get_notifications_history", data: { page: "1", limit: "20" } },
      (payload) => {
        if (!payload || payload?.error) return;
        setWsData(payload);
        queryClient.setQueryData([...notificationKeys.list, userId], payload);
      }
    );
    return unsubscribe;
  }, [userId, queryClient]);

  const query = useQuery({
    // Scope the cache per account so one user's response can never be served
    // to another account sharing the same browser/session.
    queryKey: [...notificationKeys.list, userId],
    queryFn: () => notificationService.getNotifications(),
    enabled: !!user,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: (failureCount, err: any) => err?.response?.status !== 403 && failureCount < 2,
  });

  const activeData = wsData ?? query.data;
  const notifications = useMemo(() => normalizeNotifications(activeData), [activeData]);

  useEffect(() => {
    if (activeData) {
      setNotifications(notifications, userId);
    }
  }, [activeData, notifications, userId, setNotifications]);

  return { notifications, error: query.error, isLoading: query.isLoading && wsData === undefined, hasData: activeData !== undefined };
}