"use client";

import { useNotifications } from "@/src/hooks/use-notifications";

/**
 * NotificationsProvider – zero-UI client component that fetches the user's
 * notifications from the backend and keeps the bell badge/store in sync.
 * Mounted once in the root layout; no-ops on unauthenticated routes.
 */
export function NotificationsProvider() {
  useNotifications();
  return null;
}