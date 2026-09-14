"use client";

import { useFCM } from "@/src/hooks/use-fcm";

/**
 * FCMInitializer – a zero-UI client component that activates Firebase
 * push notifications for authenticated users.
 * Drop it inside any server-rendered layout.
 */
export function FCMInitializer() {
  useFCM();
  return null;
}
