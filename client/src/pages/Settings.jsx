import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Info,
  LogOut,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
  UserRound
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  getNotificationPermission,
  requestNotificationPermission
} from "../services/notificationService";

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [notificationPermission, setNotificationPermission] =
    useState("default");

  const [notificationLoading, setNotificationLoading] =
    useState(false);

  const [notificationMessage, setNotificationMessage] =
    useState("");

  useEffect(() => {
    setNotificationPermission(
      getNotificationPermission()
    );
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNotificationPermission = async () => {
    if (notificationLoading) {
      return;
    }

    setNotificationLoading(true);
    setNotificationMessage("");

    const permission =
      await requestNotificationPermission();

    setNotificationPermission(permission);

    if (permission === "granted") {
      setNotificationMessage(
        "Notifications are enabled for medicine reminders."
      );
    } else if (permission === "denied") {
      setNotificationMessage(
        "Notifications are blocked. You can change this in your browser settings."
      );
    } else if (permission === "unsupported") {
      setNotificationMessage(
        "This browser does not support web notifications."
      );
    } else {
      setNotificationMessage(
        "Notification permission was not enabled."
      );
    }

    setNotificationLoading(false);
  };

  const displayRole =
    user?.role === "patient"
      ? "Patient"
      : "Caregiver";

  const notificationStatus =
    notificationPermission === "granted"
      ? "Enabled"
      : notificationPermission === "denied"
        ? "Blocked"
        : notificationPermission ===
            "unsupported"
          ? "Unavailable"
          : "Not enabled";

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div className="settings-brand">
          <div className="settings-brand-icon">
            <SettingsIcon
              size={21}
              strokeWidth={2.2}
            />
          </div>

          <div>
            <h1>
              MediCare
            </h1>

            <span>
              Medicine Companion
            </span>
          </div>
        </div>

        <div className="settings-header-status">
          <SettingsIcon size={15} />

          <span>
            Preferences
          </span>
        </div>
      </header>

      <main className="settings-main">
        <div className="settings-heading">
          <div>
            <span className="settings-eyebrow">
              ACCOUNT & PREFERENCES
            </span>

            <h2>
              Settings
            </h2>

            <p>
              Manage your account information and
              medication reminder preferences.
            </p>
          </div>
        </div>

        <div className="settings-grid">
          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <UserRound size={19} />
              </div>

              <div>
                <h3>
                  Profile
                </h3>

                <p>
                  Your current MediCare account
                  information.
                </p>
              </div>
            </div>

            <div className="settings-details">
              <div className="settings-detail-row">
                <div className="settings-detail-icon">
                  <User size={16} />
                </div>

                <div>
                  <span>
                    Name
                  </span>

                  <strong>
                    {user?.name ||
                      "Not available"}
                  </strong>
                </div>
              </div>

              <div className="settings-detail-row">
                <div className="settings-detail-icon">
                  <Bell size={16} />
                </div>

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {user?.email ||
                      "Not available"}
                  </strong>
                </div>
              </div>

              <div className="settings-detail-row">
                <div className="settings-detail-icon">
                  <ShieldCheck size={16} />
                </div>

                <div>
                  <span>
                    Account role
                  </span>

                  <strong>
                    {displayRole}
                  </strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="settings-outline-button"
              onClick={() =>
                navigate("/patient/profile")
              }
            >
              <UserRound size={15} />

              <span>
                View Profile
              </span>
            </button>
          </section>

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon settings-card-icon-reminder">
                <Bell size={19} />
              </div>

              <div>
                <h3>
                  Medicine reminders
                </h3>

                <p>
                  Stay informed about your scheduled
                  medication doses.
                </p>
              </div>
            </div>

            <div className="settings-reminder-panel">
              <div className="settings-reminder-icon">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <strong>
                  Browser reminders available
                </strong>

                <p>
                  Your browser can display
                  notifications for scheduled
                  medicine reminders.
                </p>
              </div>
            </div>

            <div className="settings-status-row">
              <div>
                <span>
                  Reminder status
                </span>

                <p>
                  Enable browser notifications for
                  scheduled medicine reminders.
                </p>
              </div>

              <span className="settings-status-badge">
                <span className="settings-status-dot" />

                {notificationStatus}
              </span>
            </div>

            <div
              style={{
                marginTop: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "10px"
              }}
            >
              <button
                type="button"
                className="settings-outline-button"
                onClick={
                  handleNotificationPermission
                }
                disabled={
                  notificationLoading ||
                  notificationPermission ===
                    "granted"
                }
              >
                <Bell size={15} />

                <span>
                  {notificationLoading
                    ? "Enabling notifications..."
                    : notificationPermission ===
                        "granted"
                      ? "Notifications enabled"
                      : "Enable notifications"}
                </span>
              </button>

              {notificationMessage && (
                <div
                  role="status"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "10px 12px",
                    border: `1px solid ${
                      notificationPermission ===
                      "granted"
                        ? "#bbf7d0"
                        : "#dbeafe"
                    }`,
                    borderRadius: "9px",
                    background:
                      notificationPermission ===
                      "granted"
                        ? "#f0fdf4"
                        : "#eff6ff",
                    color:
                      notificationPermission ===
                      "granted"
                        ? "#166534"
                        : "#1e40af",
                    fontSize: "12px",
                    lineHeight: 1.5
                  }}
                >
                  {notificationPermission ===
                  "granted" ? (
                    <CheckCircle2
                      size={16}
                      style={{
                        flex: "0 0 auto",
                        marginTop: "1px"
                      }}
                    />
                  ) : (
                    <Info
                      size={16}
                      style={{
                        flex: "0 0 auto",
                        marginTop: "1px"
                      }}
                    />
                  )}

                  <span>
                    {notificationMessage}
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="settings-security-card">
          <div className="settings-security-icon">
            <ShieldCheck size={20} />
          </div>

          <div className="settings-security-content">
            <h3>
              Account security
            </h3>

            <p>
              Your account is protected by the
              application's authentication system.
            </p>
          </div>

          <span className="settings-security-badge">
            Secure
          </span>
        </section>

        <div className="settings-actions">
          <button
            className="settings-secondary-button"
            type="button"
            onClick={() =>
              navigate("/patient")
            }
          >
            <ArrowLeft size={16} />

            <span>
              Back to Dashboard
            </span>
          </button>

          <button
            className="settings-logout-button"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={16} />

            <span>
              Logout
            </span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Settings;