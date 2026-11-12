"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { userKeys, userService } from "@/src/services/user";
import { useUserStore } from "@/src/stores/user-store";
import { playNotificationSound } from "@/src/lib/notification-sound";

export interface NotificationSoundPayload {
  title?: string;
  body?: string;
  type?: string;
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
      const prefs = settings?.transactionNotifications;
      if (!prefs) return;

      const spotEnabled = Boolean(prefs.spotNotificationSound);
      const futuresEnabled = Boolean(prefs.futuresNotificationSound);
      if (!spotEnabled && !futuresEnabled) return;

      const scope = detectScope(payload);
      if (scope === "spot" && !spotEnabled) return;
      if (scope === "futures" && !futuresEnabled) return;

      const signature = [payload.title ?? "", payload.body ?? "", payload.type ?? ""].join("|");
      playNotificationSound(signature);
    },
    [settings]
  );

  return play;
}
