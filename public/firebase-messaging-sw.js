// firebase-messaging-sw.js
// This service worker is required by Firebase to handle background push notifications.
// It must be at the root of the domain (inside /public).

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDEGDKXL--YvARXW3r_-x0hZDRy-vXr9m8",
  authDomain: "limiance-exchange-c90cb.firebaseapp.com",
  projectId: "limiance-exchange-c90cb",
  storageBucket: "limiance-exchange-c90cb.firebasestorage.app",
  messagingSenderId: "926080464456",
  appId: "1:926080464456:web:2f212f6309d21859feca7d",
  measurementId: "G-32Q8BKGK9F",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message:", payload);

  const notificationTitle = payload.notification?.title || "Limiance";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: payload.notification?.icon || "/limiance-logo.png",
    badge: "/limiance-logo.png",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
