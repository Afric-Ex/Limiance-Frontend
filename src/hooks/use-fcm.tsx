"use client";

import { useEffect, useRef } from "react";
import { notificationService } from "@/src/services/notification";
import toast from "react-hot-toast";
import { redactDiagnostic } from "@/src/lib/pii-policy";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const STORAGE_KEY = "fcm_token_registered";

/**
 * useFCM – Firebase Cloud Messaging hook.
 *
 * - Requests notification permission from the browser.
 * - Generates an FCM device token using the VAPID key.
 * - Sends the token to the backend (POST /api/v1/notifications/fcm-token).
 * - Listens for foreground messages and shows a toast notification.
 *
 * Drop this into any authenticated layout to activate push notifications.
 */
export function useFCM() {
  const tokenSentRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Only run in browser
        if (typeof window === "undefined" || !("Notification" in window)) return;
        if (!VAPID_KEY || VAPID_KEY === "<ADD_YOUR_VAPID_KEY_HERE>") {
          console.debug("[useFCM] VAPID key is not configured. Push notifications are disabled.");
          return;
        }

        // 1. Request permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.info("[useFCM] Notification permission not granted.");
          return;
        }

        // 2. Load the Firebase SDK on demand (kept out of the main
        // bundle — only fetched when push setup actually proceeds this far)
        const [{ getToken, onMessage }, { messaging }] = await Promise.all([
          import("firebase/messaging"),
          import("@/src/lib/firebase"),
        ]);

        // 3. Get the Firebase messaging instance
        const fcmMessaging = await messaging();
        if (!fcmMessaging) return;

        // 4. Register the service worker explicitly so Firebase can find it
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        );

        // 5. Generate the FCM token
        const token = await getToken(fcmMessaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token && !tokenSentRef.current) {
          tokenSentRef.current = true;

          // 6. Send token to backend (only once per session)
          try {
            await notificationService.saveFcmToken({ token, device: "web" });
            sessionStorage.setItem(STORAGE_KEY, "true");
          } catch (err) {
            // Non-fatal: the user can still use the app without push token saved
            console.error("[useFCM] Failed to save FCM token to backend", redactDiagnostic({ error: err }));
            tokenSentRef.current = false;
          }
        }

        // 7. Handle foreground messages
        const unsubscribe = onMessage(fcmMessaging, (payload) => {
          const title = payload.notification?.title ?? "Limiance";
          const body = payload.notification?.body ?? "";

          // Add to local notification store so the bell can show it
          import("@/src/stores/notification-store").then(({ useNotificationStore }) => {
            useNotificationStore.getState().addNotification({
              title,
              body,
              type: "push",
              link: typeof payload.data?.url === "string" ? payload.data.url : undefined,
            });
          });

          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? "animate-fade-in-up" : "opacity-0"
                } max-w-sm w-full bg-[#1c1e27] border border-white/[0.08] shadow-lg rounded-xl pointer-events-auto flex items-start gap-3 p-4`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  {/* Bell icon */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#4d77f0"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{title}</p>
                  {body && (
                    <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{body}</p>
                  )}
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ),
            { duration: 6000, position: "top-right" }
          );
        });

        return () => unsubscribe();
      } catch (err) {
        // Swallow errors — push notifications should never break the app
        console.error("[useFCM] Initialization error", redactDiagnostic({ error: err }));
      }
    };

    // Only run once and skip if already registered this session
    if (sessionStorage.getItem(STORAGE_KEY)) {
      tokenSentRef.current = true;
    }

    init();
  }, []);
}
