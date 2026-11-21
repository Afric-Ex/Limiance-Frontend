"use client";

import { useEffect, useRef } from "react";
import { useNotifications } from "@/src/hooks/use-notifications";
import { useNotificationSound } from "@/src/hooks/use-notification-sound";
import { logNotificationSound, unlockNotificationAudio } from "@/src/lib/notification-sound";
import {
  EMPTY_FRESHNESS_STATE,
  selectFreshNotifications,
  type FreshnessState,
} from "@/src/lib/notification-freshness";

/**
 * NotificationsProvider – zero-UI client component that fetches the user's
 * notifications from the backend and keeps the bell badge/store in sync.
 * Also plays the notification chime for newly-arrived notifications when the
 * user has enabled sounds in their transaction notification settings.
 * Mounted once in the root layout; no-ops on unauthenticated routes.
 */
export function NotificationsProvider() {
  const { notifications, hasData } = useNotifications();
  const playSound = useNotificationSound();
  const freshnessRef = useRef<FreshnessState>(EMPTY_FRESHNESS_STATE);

  useEffect(() => {
    unlockNotificationAudio();
  }, []);

  useEffect(() => {
    if (!hasData) {
      freshnessRef.current = EMPTY_FRESHNESS_STATE;
      return;
    }

    const previous = freshnessRef.current;
    const baseline = previous.seenIds === null;
    const { state, fresh } = selectFreshNotifications(previous, notifications, hasData);
    freshnessRef.current = state;

    if (baseline) {
      logNotificationSound({
        event: "skipped",
        source: "history",
        reason: `initial load baseline (${notifications.length} existing notifications, no chime)`,
      });
      return;
    }

    for (const notification of fresh) {
      const meta = {
        source: "history",
        id: notification.id,
        title: notification.title,
        type: notification.type,
      };
      logNotificationSound({ event: "detected", ...meta, reason: notification.read ? "already read" : "unread" });
      if (notification.read) {
        logNotificationSound({ event: "skipped", ...meta, reason: "new but already marked read" });
        continue;
      }
      playSound({
        id: notification.id,
        source: "history",
        title: notification.title,
        body: notification.body,
        type: notification.type,
      });
    }
  }, [notifications, hasData, playSound]);

  return null;
}
