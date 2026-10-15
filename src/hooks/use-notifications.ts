"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationKeys, notificationService } from "@/src/services/notification";
import { useNotificationStore, AppNotification } from "@/src/stores/notification-store";
import { useUserStore } from "@/src/stores/user-store";

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
  const createdAt = rawCreatedAt
    ? new Date(rawCreatedAt).getTime()
    : Date.now();

  const title =
    raw.title || raw.heading
      ? String(raw.title ?? raw.heading)
      : (titleFromType(raw.type ?? raw.kind) ?? "Notification");

  return {
    id: String(raw.id ?? raw._id ?? `${title}-${createdAt}`),
    title,
    body: toDisplayString(raw.body ?? raw.message ?? ""),
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