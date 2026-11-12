"use client";

import { useEffect, useRef } from "react";
import { useNotifications } from "@/src/hooks/use-notifications";
import { useNotificationSound } from "@/src/hooks/use-notification-sound";
import { unlockNotificationAudio } from "@/src/lib/notification-sound";

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
  const seenIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    unlockNotificationAudio();
  }, []);

  useEffect(() => {
    if (!hasData) {
      // Reset when notifications are no longer loaded (e.g. logged out) so the
      // next user's first batch doesn't trigger a burst of chimes.
      seenIdsRef.current = null;
      return;
    }

    const currentIds = new Set(notifications.map((n) => n.id));

    // Don't chime for the initial batch of existing notifications.
    if (seenIdsRef.current === null) {
      seenIdsRef.current = currentIds;
      return;
    }

    for (const notification of notifications) {
      if (!seenIdsRef.current.has(notification.id) && !notification.read) {
        playSound({
          title: notification.title,
          body: notification.body,
          type: notification.type,
        });
      }
    }

    seenIdsRef.current = currentIds;
  }, [notifications, hasData, playSound]);

  return null;
}
