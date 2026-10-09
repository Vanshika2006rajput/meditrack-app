const MEDICINE_NOTIFICATION_TAG =
  "meditrack-medicine-reminder";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim()
  );
});

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then((clientList) => {
          for (const client of clientList) {
            if ("focus" in client) {
              return client.focus();
            }
          }

          if (self.clients.openWindow) {
            return self.clients.openWindow(
              "/patient"
            );
          }

          return undefined;
        })
    );
  }
);

self.addEventListener(
  "notificationclose",
  () => {
    // Notification closed by the user.
  }
);

self.addEventListener(
  "message",
  (event) => {
    if (
      !event.data ||
      event.data.type !==
        "SHOW_MEDICINE_NOTIFICATION"
    ) {
      return;
    }

    const {
      medicineName,
      dosage,
      scheduledTime
    } = event.data;

    const dosageText = dosage
      ? ` • ${dosage}`
      : "";

    const body =
      `${medicineName}${dosageText} is scheduled for ${scheduledTime}.`;

    event.waitUntil(
      self.registration.showNotification(
        "Medicine Reminder",
        {
          body,
          tag: `${MEDICINE_NOTIFICATION_TAG}-${medicineName}-${scheduledTime}`,
          icon: "/healthcare-icon.png",
          badge: "/healthcare-icon.png",
          data: {
            medicineName,
            scheduledTime
          },
          requireInteraction: true
        }
      )
    );
  }
);