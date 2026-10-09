const isNotificationSupported = () => {
  return (
    typeof window !== "undefined" &&
    "Notification" in window
  );
};

const isServiceWorkerSupported = () => {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator
  );
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return "unsupported";
  }

  return Notification.permission;
};

export const requestNotificationPermission =
  async () => {
    if (!isNotificationSupported()) {
      return "unsupported";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission === "denied") {
      return "denied";
    }

    try {
      const permission =
        await Notification.requestPermission();

      return permission;
    } catch (error) {
      console.error(
        "Notification permission request failed:",
        error
      );

      return "denied";
    }
  };

const getServiceWorkerRegistration =
  async () => {
    if (!isServiceWorkerSupported()) {
      return null;
    }

    try {
      const registration =
        await navigator.serviceWorker.ready;

      return registration;
    } catch (error) {
      console.error(
        "Service worker is not ready:",
        error
      );

      return null;
    }
  };

export const showMedicineNotification =
  async ({
    medicineName,
    dosage,
    scheduledTime
  }) => {
    if (!isNotificationSupported()) {
      return false;
    }

    if (Notification.permission !== "granted") {
      return false;
    }

    const notificationBody =
      `${medicineName} ${
        dosage ? `• ${dosage} ` : ""
      }is scheduled for ${scheduledTime}.`;

    try {
      const registration =
        await getServiceWorkerRegistration();

      if (registration) {
        registration.showNotification(
          "Medicine Reminder",
          {
            body: notificationBody,
            tag: `medicine-${medicineName}-${scheduledTime}`,
            icon: "/healthcare-icon.png",
            badge: "/healthcare-icon.png",
            data: {
              medicineName,
              scheduledTime
            },
            requireInteraction: true
          }
        );

        return true;
      }

      /*
       * Desktop fallback.
       *
       * Mobile browsers generally require persistent
       * notifications through a service worker.
       */
      const notification =
        new Notification(
          "Medicine Reminder",
          {
            body: notificationBody,
            tag: `medicine-${medicineName}-${scheduledTime}`
          }
        );

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error(
        "Medicine notification failed:",
        error
      );

      return false;
    }
  };