import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { showMedicineNotification } from "../services/notificationService";

import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  HeartPulse,
  History,
  Info,
  LayoutDashboard,
  LogOut,
  Pill,
  Plus,
  Settings,
  ShieldCheck,
  UserRound,
  X,
  Pencil,
  Search,
  CircleAlert,
  Leaf
} from "lucide-react";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [medicines, setMedicines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [adherence, setAdherence] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingLog, setSavingLog] = useState(false);
  const [deletingMedicine, setDeletingMedicine] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationOpen, setNotificationOpen] =
    useState(false);
  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        medicineResponse,
        logsResponse,
        adherenceResponse
      ] = await Promise.all([
        api.get("/medicines"),
        api.get("/medicine-logs"),
        api.get("/adherence")
      ]);

      setMedicines(medicineResponse.data.medicines);
      setLogs(logsResponse.data.logs);
      setAdherence(adherenceResponse.data);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /*
   * Medicine reminder scheduler
   *
   * The dashboard checks once every 30 seconds for medicines
   * scheduled during the current minute.
   *
   * A localStorage key prevents the same dose from generating
   * the same notification repeatedly.
   *
   * Notifications are asynchronous because they are now
   * displayed through the Service Worker.
   */
  useEffect(() => {
    if (!medicines.length) {
      return;
    }

    const checkMedicineReminders = async () => {
      const now = new Date();

      const currentHours = String(
        now.getHours()
      ).padStart(2, "0");

      const currentMinutes = String(
        now.getMinutes()
      ).padStart(2, "0");

      const currentTime = `${currentHours}:${currentMinutes}`;

      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
      ].join("-");

      const reminderTasks = [];

      medicines.forEach((medicine) => {
        if (!isMedicineActiveToday(medicine)) {
          return;
        }

        if (!Array.isArray(medicine.times)) {
          return;
        }

        medicine.times.forEach((scheduledTime) => {
          if (scheduledTime !== currentTime) {
            return;
          }

          const status = getMedicineStatus(
            medicine._id,
            scheduledTime
          );

          if (status) {
            return;
          }

          const reminderKey =
            `meditrack-reminder-${today}-${medicine._id}-${scheduledTime}`;

          const alreadyNotified =
            localStorage.getItem(reminderKey);

          if (alreadyNotified) {
            return;
          }

          reminderTasks.push({
            medicine,
            scheduledTime,
            reminderKey
          });
        });
      });

      if (!reminderTasks.length) {
        return;
      }

      await Promise.all(
        reminderTasks.map(
          async ({
            medicine,
            scheduledTime,
            reminderKey
          }) => {
            const notificationShown =
              await showMedicineNotification({
                medicineName: medicine.name,
                dosage: medicine.dosage,
                scheduledTime
              });

            if (notificationShown) {
              localStorage.setItem(
                reminderKey,
                "true"
              );
            }
          }
        )
      );
    };

    checkMedicineReminders();

    const reminderInterval = window.setInterval(
      checkMedicineReminders,
      30000
    );

    return () => {
      window.clearInterval(
        reminderInterval
      );
    };
  }, [medicines, logs]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMedicineStatus = async (
    medicineId,
    scheduledTime,
    status
  ) => {
    try {
      setSavingLog(true);
      setError("");
      setSuccessMessage("");

      const today = new Date()
        .toISOString()
        .split("T")[0];

      await api.post("/medicine-logs", {
        medicineId,
        date: today,
        scheduledTime,
        status
      });

      setSuccessMessage(
        `Medicine marked as ${status}.`
      );

      await fetchDashboardData();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to save medicine status."
      );
    } finally {
      setSavingLog(false);
    }
  };

  const handleDeleteMedicine = async (medicineId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this medicine?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingMedicine(true);
      setError("");
      setSuccessMessage("");

      await api.delete(
        `/medicines/${medicineId}`
      );

      setSuccessMessage(
        "Medicine deleted successfully."
      );

      await fetchDashboardData();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to delete medicine."
      );
    } finally {
      setDeletingMedicine(false);
    }
  };

  const getMedicineStatus = (
    medicineId,
    scheduledTime
  ) => {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    const matchingLog = logs.find((log) => {
      const logDate = new Date(log.date)
        .toISOString()
        .split("T")[0];

      const logMedicineId =
        log.medicineId?._id ||
        log.medicineId;

      return (
        logMedicineId === medicineId &&
        logDate === today &&
        log.scheduledTime === scheduledTime
      );
    });

    return matchingLog?.status || null;
  };

  const isMedicineActiveToday = (medicine) => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const startDate = new Date(
      medicine.startDate
    );

    startDate.setHours(0, 0, 0, 0);

    if (today < startDate) {
      return false;
    }

    if (medicine.endDate) {
      const endDate = new Date(
        medicine.endDate
      );

      endDate.setHours(0, 0, 0, 0);

      if (today > endDate) {
        return false;
      }
    }

    return true;
  };

  const isUpcomingTime = (scheduledTime) => {
    const now = new Date();

    const [hours, minutes] = scheduledTime
      .split(":")
      .map(Number);

    const scheduledDate = new Date();

    scheduledDate.setHours(
      hours,
      minutes,
      0,
      0
    );

    return scheduledDate > now;
  };

  const todaysMedicines = medicines.filter(
    isMedicineActiveToday
  );

  const filteredMedicines = todaysMedicines.filter(
    (medicine) => {
      const query = searchQuery
        .trim()
        .toLowerCase();

      if (!query) {
        return true;
      }

      return [
        medicine.name,
        medicine.dosage,
        medicine.frequency,
        medicine.instructions
      ]
        .filter(Boolean)
        .some((value) =>
          value
            .toString()
            .toLowerCase()
            .includes(query)
        );
    }
  );

  const upcomingMedicines =
    todaysMedicines.flatMap((medicine) =>
      medicine.times
        .filter((time) => {
          const status = getMedicineStatus(
            medicine._id,
            time
          );

          return (
            !status &&
            isUpcomingTime(time)
          );
        })
        .map((time) => ({
          medicine,
          time
        }))
    );

  const missedMedicines =
    todaysMedicines.flatMap((medicine) =>
      medicine.times
        .filter((time) => {
          return (
            getMedicineStatus(
              medicine._id,
              time
            ) === "missed"
          );
        })
        .map((time) => ({
          medicine,
          time
        }))
    );

  const totalNotifications =
    upcomingMedicines.length +
    missedMedicines.length;

  const totalMedicines = todaysMedicines.length;

  const totalTaken =
    adherence?.totalTaken ?? 0;

  const totalMissed =
    adherence?.totalMissed ?? 0;

  const totalScheduled =
    adherence?.totalScheduled ?? 0;

  const adherencePercentage =
    adherence?.adherencePercentage ?? 0;

  const todayDoseCount = todaysMedicines.reduce(
    (total, medicine) => {
      return total + medicine.times.length;
    },
    0
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>

        <p>
          Loading your medicine dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">

      {/* SIDEBAR */}

      <aside className="dashboard-sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-brand-icon">
            <HeartPulse
              size={22}
              strokeWidth={2.3}
            />
          </div>

          <div className="sidebar-brand-content">
            <h1>MediTrack</h1>

            <span>
              Better Health. Together.
            </span>
          </div>

        </div>

        <div className="sidebar-divider"></div>

        <nav
          className="sidebar-navigation"
          aria-label="Patient navigation"
        >

          <span className="sidebar-section-label">
            WORKSPACE
          </span>

          <button
            className="sidebar-nav-item active"
            type="button"
            aria-current="page"
            onClick={() =>
              navigate("/patient")
            }
          >
            <LayoutDashboard size={18} />

            <span>
              Dashboard
            </span>
          </button>

          <button
            className="sidebar-nav-item"
            type="button"
            onClick={() =>
              navigate("/add-medicine")
            }
          >
            <Pill size={18} />

            <span>
              Medicines
            </span>
          </button>

          <button
            className="sidebar-nav-item"
            type="button"
            onClick={() =>
              navigate("/patient/history")
            }
          >
            <History size={18} />

            <span>
              History
            </span>
          </button>

          <span className="sidebar-section-label sidebar-section-label-secondary">
            ACCOUNT
          </span>

          <button
            className="sidebar-nav-item"
            type="button"
            onClick={() =>
              navigate("/patient/profile")
            }
          >
            <UserRound size={18} />

            <span>
              Profile
            </span>
          </button>

          <button
            className="sidebar-nav-item"
            type="button"
            onClick={() =>
              navigate("/patient/settings")
            }
          >
            <Settings size={18} />

            <span>
              Settings
            </span>
          </button>

        </nav>

        <div className="sidebar-footer">

          <div className="sidebar-user-summary">

            <div className="sidebar-user-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
            </div>

            <div className="sidebar-user-details">
              <strong>
                {user?.name || "User"}
              </strong>

              <span>
                Patient
              </span>
            </div>

          </div>

          <button
            className="sidebar-logout"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={18} />

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="dashboard-main">

        {/* TOP BAR */}

        <header className="dashboard-topbar">

          <div className="dashboard-search">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
            />

          </div>

          <div className="topbar-actions">

            {/* NOTIFICATIONS */}

            <div
              style={{
                position: "relative"
              }}
            >

              <button
                className="notification-button"
                type="button"
                aria-label="Notifications"
                aria-expanded={
                  notificationOpen
                }
                onClick={() => {
                  setNotificationOpen(
                    (current) =>
                      !current
                  );
                  setProfileMenuOpen(false);
                }}
              >

                <Bell size={20} />

                {totalNotifications > 0 && (
                  <span className="notification-dot"></span>
                )}

              </button>

              {notificationOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 12px)",
                    right: "0",
                    width: "340px",
                    maxWidth:
                      "calc(100vw - 32px)",
                    background: "#ffffff",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow:
                      "0 12px 30px rgba(15, 23, 42, 0.12)",
                    padding: "16px",
                    zIndex: 1000
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: "12px",
                      marginBottom: "14px"
                    }}
                  >

                    <div>

                      <strong
                        style={{
                          display: "block",
                          fontSize: "15px",
                          color: "#0f172a"
                        }}
                      >
                        Medicine reminders
                      </strong>

                      <span
                        style={{
                          display: "block",
                          marginTop: "3px",
                          fontSize: "12px",
                          color: "#64748b"
                        }}
                      >
                        Today's medication updates
                      </span>

                    </div>

                    <button
                      type="button"
                      aria-label="Close notifications"
                      onClick={() =>
                        setNotificationOpen(
                          false
                        )
                      }
                      style={{
                        border: "none",
                        background:
                          "transparent",
                        display: "inline-flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        padding: "4px",
                        cursor: "pointer",
                        color: "#64748b"
                      }}
                    >
                      <X size={17} />
                    </button>

                  </div>

                  {missedMedicines.length === 0 &&
                  upcomingMedicines.length === 0 ? (

                    <div
                      style={{
                        padding:
                          "18px 8px",
                        textAlign: "center"
                      }}
                    >

                      <Check
                        size={28}
                        style={{
                          color: "#16a34a",
                          marginBottom: "8px"
                        }}
                      />

                      <strong
                        style={{
                          display: "block",
                          fontSize: "14px",
                          color: "#0f172a"
                        }}
                      >
                        No new reminders
                      </strong>

                      <p
                        style={{
                          margin:
                            "5px 0 0",
                          fontSize: "12px",
                          lineHeight: "1.5",
                          color: "#64748b"
                        }}
                      >
                        You're all caught up with
                        today's medicines.
                      </p>

                    </div>

                  ) : (

                    <div
                      style={{
                        display: "flex",
                        flexDirection:
                          "column",
                        gap: "9px"
                      }}
                    >

                      {missedMedicines.map(
                        ({
                          medicine,
                          time
                        }) => (

                          <div
                            key={`missed-${medicine._id}-${time}`}
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "10px",
                              padding: "10px",
                              borderRadius:
                                "9px",
                              background:
                                "#fef2f2",
                              border:
                                "1px solid #fee2e2"
                            }}
                          >

                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius:
                                  "8px",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                flexShrink: 0,
                                background:
                                  "#fee2e2",
                                color:
                                  "#dc2626"
                              }}
                            >
                              <X size={16} />
                            </div>

                            <div
                              style={{
                                minWidth: 0
                              }}
                            >

                              <strong
                                style={{
                                  display:
                                    "block",
                                  fontSize:
                                    "13px",
                                  color:
                                    "#0f172a"
                                }}
                              >
                                {medicine.name}
                              </strong>

                              <span
                                style={{
                                  display:
                                    "block",
                                  marginTop:
                                    "2px",
                                  fontSize:
                                    "11px",
                                  color:
                                    "#64748b"
                                }}
                              >
                                Missed at {time}
                              </span>

                            </div>

                          </div>

                        )
                      )}

                      {upcomingMedicines.map(
                        ({
                          medicine,
                          time
                        }) => (

                          <div
                            key={`upcoming-${medicine._id}-${time}`}
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "10px",
                              padding: "10px",
                              borderRadius:
                                "9px",
                              background:
                                "#f8fafc",
                              border:
                                "1px solid #e2e8f0"
                            }}
                          >

                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius:
                                  "8px",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                flexShrink: 0,
                                background:
                                  "#eff6ff",
                                color:
                                  "#2563eb"
                              }}
                            >
                              <Clock3 size={16} />
                            </div>

                            <div
                              style={{
                                minWidth: 0
                              }}
                            >

                              <strong
                                style={{
                                  display:
                                    "block",
                                  fontSize:
                                    "13px",
                                  color:
                                    "#0f172a"
                                }}
                              >
                                {medicine.name}
                              </strong>

                              <span
                                style={{
                                  display:
                                    "block",
                                  marginTop:
                                    "2px",
                                  fontSize:
                                    "11px",
                                  color:
                                    "#64748b"
                                }}
                              >
                                Next dose at {time}
                              </span>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>
              )}

            </div>

            {/* PROFILE MENU */}

            <div
              style={{
                position: "relative"
              }}
            >

              <button
                className="topbar-profile"
                type="button"
                aria-label="Account menu"
                aria-expanded={
                  profileMenuOpen
                }
                onClick={() => {
                  setProfileMenuOpen(
                    (current) =>
                      !current
                  );
                  setNotificationOpen(false);
                }}
                style={{
                  border: "none",
                  background:
                    "transparent",
                  cursor: "pointer"
                }}
              >

                <div className="topbar-avatar">
                  {user?.name
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </div>

                <div className="topbar-user-info">

                  <strong>
                    {user?.name}
                  </strong>

                </div>

                <ChevronDown
                  size={16}
                  style={{
                    transition:
                      "transform 0.2s ease",
                    transform:
                      profileMenuOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)"
                  }}
                />

              </button>

              {profileMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: "0",
                    width: "220px",
                    background: "#ffffff",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow:
                      "0 12px 30px rgba(15, 23, 42, 0.12)",
                    padding: "8px",
                    zIndex: 1000
                  }}
                >

                  <div
                    style={{
                      padding:
                        "10px 12px",
                      borderBottom:
                        "1px solid #f1f5f9",
                      marginBottom: "6px"
                    }}
                  >

                    <strong
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#0f172a"
                      }}
                    >
                      {user?.name || "User"}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "3px",
                        fontSize: "11px",
                        color: "#64748b",
                        overflow: "hidden",
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap"
                      }}
                    >
                      {user?.email || ""}
                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(
                        false
                      );
                      navigate(
                        "/patient/profile"
                      );
                    }}
                    style={{
                      width: "100%",
                      border: "none",
                      background:
                        "transparent",
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "10px",
                      padding:
                        "10px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      color: "#334155",
                      fontSize: "13px",
                      textAlign: "left"
                    }}
                  >

                    <UserRound size={16} />

                    <span>
                      Profile
                    </span>

                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(
                        false
                      );
                      navigate(
                        "/patient/settings"
                      );
                    }}
                    style={{
                      width: "100%",
                      border: "none",
                      background:
                        "transparent",
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "10px",
                      padding:
                        "10px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      color: "#334155",
                      fontSize: "13px",
                      textAlign: "left"
                    }}
                  >

                    <Settings size={16} />

                    <span>
                      Settings
                    </span>

                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(
                        false
                      );
                      handleLogout();
                    }}
                    style={{
                      width: "100%",
                      border: "none",
                      background:
                        "transparent",
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "10px",
                      padding:
                        "10px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      color: "#dc2626",
                      fontSize: "13px",
                      textAlign: "left"
                    }}
                  >

                    <LogOut size={16} />

                    <span>
                      Logout
                    </span>

                  </button>

                </div>
              )}

            </div>

          </div>

        </header>

        {/* ALERTS */}

        {error && (
          <div className="alert alert-error">

            <CircleAlert size={17} />

            <p>{error}</p>

          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">

            <Check size={17} />

            <p>{successMessage}</p>

          </div>
        )}

        {/* HERO */}

        <section className="dashboard-hero">

          <div className="hero-content">

            <span className="hero-eyebrow">
              GOOD MORNING,
            </span>

            <h2>
              {user?.name}
            </h2>

            <p>
              Stay consistent with your medicines
              <br />
              for a healthier tomorrow.
            </p>

            <div className="hero-trust-badge">

              <Leaf size={15} />

              <span>
                Your health matters
              </span>

            </div>

          </div>

          <div className="hero-image-area">

            <img
              src="/healthcare-hero.jpg"
              alt="Professional healthcare setting"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "right center"
              }}
            />

            <div className="hero-image-overlay"></div>

          </div>

        </section>

        {/* QUICK STATS */}

        <section className="dashboard-stats">

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon blue">
              <Pill size={21} />
            </div>

            <span className="dashboard-stat-label">
              Total Medicines
            </span>

            <strong className="dashboard-stat-value">
              {totalMedicines}
            </strong>

            <span className="dashboard-stat-description">
              Active prescription
            </span>

          </div>

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon green">
              <CalendarDays size={21} />
            </div>

            <span className="dashboard-stat-label">
              Today's Doses
            </span>

            <strong className="dashboard-stat-value">
              {todayDoseCount}
            </strong>

            <span className="dashboard-stat-description">
              Scheduled
            </span>

          </div>

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon green">
              <Check size={21} />
            </div>

            <span className="dashboard-stat-label">
              Taken
            </span>

            <strong className="dashboard-stat-value">
              {totalTaken}
            </strong>

            <span className="dashboard-stat-description">
              On time
            </span>

          </div>

          <div className="dashboard-stat-card">

            <div className="dashboard-stat-icon red">
              <X size={21} />
            </div>

            <span className="dashboard-stat-label">
              Missed
            </span>

            <strong className="dashboard-stat-value">
              {totalMissed}
            </strong>

            <span className="dashboard-stat-description">
              Needs attention
            </span>

          </div>

        </section>

        {/* CONTENT GRID */}

        <section className="dashboard-content-grid">

          {/* MEDICINES PANEL */}

          <div className="dashboard-panel medicines-panel">

            <div className="panel-header">

              <div className="panel-title-group">

                <div className="panel-icon">
                  <Pill size={17} />
                </div>

                <h3>
                  Your Medicines
                </h3>

              </div>

              <button
                className="panel-link"
                type="button"
                onClick={() =>
                  navigate("/patient/medicines")
                }
              >
                View All
              </button>

            </div>

            {todaysMedicines.length === 0 ? (

              <div className="panel-empty-state">

                <Pill
                  size={35}
                  strokeWidth={1.6}
                />

                <h4>
                  No medicines scheduled today
                </h4>

                <p>
                  Add a medicine to start
                  building your routine.
                </p>

                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    navigate("/add-medicine")
                  }
                >
                  <Plus size={16} />

                  Add Medicine
                </button>

              </div>

            ) : filteredMedicines.length === 0 ? (

              <div className="panel-empty-state">

                <Search
                  size={35}
                  strokeWidth={1.6}
                />

                <h4>
                  No medicines found
                </h4>

                <p>
                  Try searching by medicine name,
                  dosage, frequency, or instructions.
                </p>

              </div>

            ) : (

              <>

                {filteredMedicines.map(
                  (medicine) => (

                    <div
                      className="medicine-summary-card"
                      key={medicine._id}
                    >

                      <div className="medicine-summary-icon">

                        <Pill
                          size={25}
                          strokeWidth={1.8}
                        />

                      </div>

                      <div className="medicine-summary-content">

                        <div className="medicine-summary-heading">

                          <h4>
                            {medicine.name}
                          </h4>

                          <span className="active-badge">
                            Active
                          </span>

                        </div>

                        <div className="medicine-details-grid">

                          <div>

                            <span>
                              Dosage
                            </span>

                            <strong>
                              {medicine.dosage}
                            </strong>

                          </div>

                          <div>

                            <span>
                              Frequency
                            </span>

                            <strong>
                              {medicine.frequency}
                            </strong>

                          </div>

                          <div>

                            <span>
                              Times
                            </span>

                            <strong>
                              {medicine.times.join(
                                ", "
                              )}
                            </strong>

                          </div>

                          <div>

                            <span>
                              Instructions
                            </span>

                            <strong>
                              {medicine.instructions ||
                                "No instructions"}
                            </strong>

                          </div>

                        </div>

                      </div>

                      <button
                        className="medicine-edit-button"
                        type="button"
                        title="Edit medicine"
                        onClick={() =>
                          navigate(
                            `/edit-medicine/${medicine._id}`
                          )
                        }
                      >
                        <Pencil size={15} />
                      </button>

                    </div>

                  )
                )}

                {/* TODAY'S SCHEDULE */}

                <div className="schedule-section">

                  <div className="schedule-header">

                    <h4>
                      Today's Schedule
                    </h4>

                  </div>

                  <div className="schedule-list">

                    {todaysMedicines.flatMap(
                      (medicine) =>
                        medicine.times.map(
                          (time) => {

                            const status =
                              getMedicineStatus(
                                medicine._id,
                                time
                              );

                            return (
                              <div
                                className={`schedule-item ${
                                  status ===
                                  "taken"
                                    ? "schedule-taken"
                                    : status ===
                                      "missed"
                                    ? "schedule-missed"
                                    : ""
                                }`}
                                key={`${medicine._id}-${time}`}
                              >

                                <div className="schedule-time-icon">

                                  <Clock3
                                    size={19}
                                  />

                                </div>

                                <div className="schedule-details">

                                  <strong>
                                    {time}
                                  </strong>

                                  <span>
                                    {medicine.name}
                                    {" • "}
                                    {medicine.dosage}
                                  </span>

                                </div>

                                {status ===
                                  "taken" && (

                                  <span className="schedule-status taken">

                                    <Check size={13} />

                                    Taken

                                  </span>

                                )}

                                {status ===
                                  "missed" && (

                                  <span className="schedule-status missed">

                                    <X size={13} />

                                    Missed

                                  </span>

                                )}

                                {!status && (

                                  <div
                                    className="schedule-actions"
                                    style={{
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      gap: "10px",
                                      marginLeft:
                                        "auto",
                                      flexShrink: 0
                                    }}
                                  >

                                    <button
                                      className="taken-button"
                                      type="button"
                                      onClick={() =>
                                        handleMedicineStatus(
                                          medicine._id,
                                          time,
                                          "taken"
                                        )
                                      }
                                      disabled={
                                        savingLog
                                      }
                                      style={{
                                        display:
                                          "inline-flex",
                                        alignItems:
                                          "center",
                                        justifyContent:
                                          "center",
                                        gap: "6px",
                                        minWidth:
                                          "82px",
                                        padding:
                                          "8px 13px",
                                        borderRadius:
                                          "8px",
                                        whiteSpace:
                                          "nowrap"
                                      }}
                                    >

                                      <Check
                                        size={14}
                                      />

                                      <span>
                                        Taken
                                      </span>

                                    </button>

                                    <button
                                      className="missed-button"
                                      type="button"
                                      onClick={() =>
                                        handleMedicineStatus(
                                          medicine._id,
                                          time,
                                          "missed"
                                        )
                                      }
                                      disabled={
                                        savingLog
                                      }
                                      style={{
                                        display:
                                          "inline-flex",
                                        alignItems:
                                          "center",
                                        justifyContent:
                                          "center",
                                        gap: "6px",
                                        minWidth:
                                          "82px",
                                        padding:
                                          "8px 13px",
                                        borderRadius:
                                          "8px",
                                        whiteSpace:
                                          "nowrap"
                                      }}
                                    >

                                      <X
                                        size={14}
                                      />

                                      <span>
                                        Missed
                                      </span>

                                    </button>

                                  </div>

                                )}

                              </div>
                            );
                          }
                        )
                    )}

                  </div>

                </div>

                {/* INSTRUCTION */}

                {todaysMedicines.some(
                  (medicine) =>
                    medicine.instructions
                ) && (

                  <div className="medicine-instruction">

                    <Info size={17} />

                    <p>
                      {todaysMedicines.find(
                        (medicine) =>
                          medicine.instructions
                      )?.instructions}
                    </p>

                  </div>

                )}

              </>

            )}

          </div>

          {/* RIGHT COLUMN */}

          <div className="dashboard-right-column">

            {/* ADHERENCE */}

            <div className="dashboard-panel adherence-panel">

              <div className="panel-header">

                <div className="panel-title-group">

                  <div className="panel-icon">
                    <Activity size={17} />
                  </div>

                  <h3>
                    Adherence Overview
                  </h3>

                </div>

                <button
                  className="panel-more-button"
                  type="button"
                  aria-label="More options"
                >
                  •••
                </button>

              </div>

              <div className="adherence-overview">

                <div className="adherence-ring-wrapper">

                  <div
                    className="adherence-ring"
                    style={{
                      "--progress": `${adherencePercentage * 3.6}deg`
                    }}
                  >

                    <div className="adherence-ring-inner">

                      <strong>
                        {adherencePercentage}%
                      </strong>

                      <span>
                        Adherence
                      </span>

                    </div>

                  </div>

                </div>

                <div className="adherence-legend">

                  <div className="legend-item">

                    <span className="legend-dot taken"></span>

                    <span>
                      Taken
                    </span>

                    <strong>
                      {totalTaken}
                    </strong>

                  </div>

                  <div className="legend-item">

                    <span className="legend-dot missed"></span>

                    <span>
                      Missed
                    </span>

                    <strong>
                      {totalMissed}
                    </strong>

                  </div>

                  <div className="legend-item">

                    <span className="legend-dot scheduled"></span>

                    <span>
                      Total Scheduled
                    </span>

                    <strong>
                      {totalScheduled}
                    </strong>

                  </div>

                </div>

              </div>

            </div>

            {/* UPCOMING MEDICINES */}

            <div className="dashboard-panel upcoming-panel">

              <div className="panel-header">

                <div className="panel-title-group">

                  <div className="panel-icon">
                    <Clock3 size={17} />
                  </div>

                  <h3>
                    Upcoming Medicines
                  </h3>

                </div>

                <button
                  className="panel-link"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/patient/medicines?view=upcoming"
                    )
                  }
                >
                  View All
                </button>

              </div>

              {upcomingMedicines.length === 0 ? (

                <div className="upcoming-empty">

                  <Check size={17} />

                  <p>
                    You're all caught up for now.
                  </p>

                </div>

              ) : (

                <div className="upcoming-list">

                  {upcomingMedicines.map(
                    ({
                      medicine,
                      time
                    }) => (

                      <div
                        className="upcoming-card"
                        key={`${medicine._id}-${time}`}
                      >

                        <div className="upcoming-icon">

                          <Pill size={18} />

                        </div>

                        <div className="upcoming-info">

                          <strong>
                            {medicine.name}
                          </strong>

                          <span>
                            {medicine.dosage}
                          </span>

                        </div>

                        <div className="upcoming-time">

                          <span>
                            NEXT DOSE
                          </span>

                          <strong>
                            {time}
                          </strong>

                        </div>

                        <button
                          className="icon-button"
                          type="button"
                          title="Edit medicine"
                          onClick={() =>
                            navigate(
                              `/edit-medicine/${medicine._id}`
                            )
                          }
                        >
                          <Pencil size={14} />
                        </button>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        </section>

        {/* HEALTH MESSAGE */}

        <section className="health-message-card">

          <div className="health-message-content">

            <span>
              Small steps every day
            </span>

            <strong>
              lead to big improvements.
            </strong>

            <p>
              Stay consistent with your medicine routine.
            </p>

          </div>

          <div className="health-message-decoration">

            <ShieldCheck
              size={74}
              strokeWidth={1}
            />

          </div>

        </section>

      </main>

    </div>
  );
};

export default PatientDashboard;