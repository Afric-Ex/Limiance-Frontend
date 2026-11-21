"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { useUserStore } from "@/src/stores/user-store";
import { logNotificationSound, playNotificationSound } from "@/src/lib/notification-sound";
import { shouldChimeNotification } from "@/src/lib/notification-sound-gate";

export interface NotificationSoundPayload {
  id?: string;
  source?: string;
  title?: string;
  body?: string;
  type?: string;
  createdAt?: number;
  data?: Record<string, unknown>;
}

type NotificationScope = "spot" | "futures" | "unknown";

function detectScope(payload: NotificationSoundPayload): NotificationScope {
  const haystack = [
    payload.type,
    payload.title,
    payload.body,
    payload.data?.type,
    payload.data?.market_type,
    payload.data?.marketType,
    payload.data?.symbol,
    payload.data?.category,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  if (haystack.includes("future")) return "futures";
  if (haystack.includes("spot") || haystack.includes("margin")) return "spot";
  return "unknown";
}

/**
 * Returns a function that plays the notification chime only when the user has
 * enabled the relevant sound in their transaction notification settings.
 */
export function useNotificationSound() {
  const user = useUserStore((s) => s.user);

  const { data: settings } = useQuery({
    queryKey: userKeys.settings,
    queryFn: () => userService.getSettings(),
    select: (res: any) => res.data ?? res,
    enabled: !!user,
    staleTime: 60_000,
  });

  const play = useCallback(
    (payload: NotificationSoundPayload = {}) => {
      const meta = { source: payload.source, id: payload.id, title: payload.title, type: payload.type };
      const prefs = settings?.transactionNotifications;
      const scope = detectScope(payload);

      if (!prefs) {
        logNotificationSound({ event: "skipped", reason: "settings not loaded - holding chime", ...meta });
        return;
      }
      const spotEnabled = Boolean(prefs.spotNotificationSound);
      const futuresEnabled = Boolean(prefs.futuresNotificationSound);
      if (!spotEnabled && !futuresEnabled) {
        logNotificationSound({ event: "skipped", reason: "spot & futures sounds both off in settings", ...meta });
        return;
      }
      if (scope === "spot" && !spotEnabled) {
        logNotificationSound({ event: "skipped", reason: "spot sound off in settings", ...meta });
        return;
      }
      if (scope === "futures" && !futuresEnabled) {
        logNotificationSound({ event: "skipped", reason: "futures sound off in settings", ...meta });
        return;
      }

      const signature = [payload.id ?? "", payload.title ?? "", payload.body ?? "", payload.type ?? ""].join("|");
      const gate = shouldChimeNotification({
        id: payload.id,
        signature,
        createdAt: payload.createdAt,
        ownerId: user && user.id != null ? String(user.id) : undefined,
      });
      if (!gate.allowed) {
        logNotificationSound({ event: "skipped", reason: gate.reason, ...meta });
        return;
      }

      playNotificationSound(signature, meta);
    },
    [settings, user]
  );

  return play;
}
