import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Edit3,
  HeartPulse,
  Pill,
  Plus,
  Search,
  XCircle
} from "lucide-react";
import {
  useNavigate,
  useSearchParams
} from "react-router-dom";

import api from "../services/api";

const Medicines = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [medicines, setMedicines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingLog, setSavingLog] =
    useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");
  const [searchQuery, setSearchQuery] =
    useState("");

  const initialView =
    searchParams.get("view") === "upcoming"
      ? "upcoming"
      : "all";

  const [activeView, setActiveView] =
    useState(initialView);

  const fetchMedicinesData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        medicineResponse,
        logsResponse
      ] = await Promise.all([
        api.get("/medicines"),
        api.get("/medicine-logs")
      ]);

      setMedicines(
        medicineResponse.data.medicines || []
      );

      setLogs(
        logsResponse.data.logs || []
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load medicines."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicinesData();
  }, []);

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

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
        String(logMedicineId) ===
          String(medicineId) &&
        logDate === today &&
        log.scheduledTime === scheduledTime
      );
    });

    return matchingLog?.status || null;
  };

  const isUpcomingTime = (scheduledTime) => {
    if (!scheduledTime) {
      return false;
    }

    const now = new Date();

    const [hours, minutes] =
      scheduledTime.split(":").map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return false;
    }

    const scheduledDate = new Date();

    scheduledDate.setHours(
      hours,
      minutes,
      0,
      0
    );

    return scheduledDate > now;
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

      await fetchMedicinesData();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to save medicine status."
      );
    } finally {
      setSavingLog(false);
    }
  };

  const allMedicines = useMemo(() => {
    return medicines;
  }, [medicines]);

  const upcomingMedicines = useMemo(() => {
    return medicines.flatMap((medicine) => {
      if (!Array.isArray(medicine.times)) {
        return [];
      }

      return medicine.times
        .filter((time) => {
          const status =
            getMedicineStatus(
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
        }));
    });
  }, [medicines, logs]);

  const filteredMedicines = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    if (!query) {
      return allMedicines;
    }

    return allMedicines.filter(
      (medicine) => {
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
  }, [
    allMedicines,
    searchQuery
  ]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>

        <p>
          Loading your medicines...
        </p>
      </div>
    );
  }

  return (
    <div className="medicine-management-page">
      <header className="medicine-management-header">
        <div className="medicine-management-brand">
          <div className="medicine-management-brand-icon">
            <HeartPulse
              size={21}
              strokeWidth={2.2}
            />
          </div>

          <div>
            <h1>
              MediTrack
            </h1>

            <span>
              Medicine Management
            </span>
          </div>
        </div>

        <button
          type="button"
          className="medicine-management-secondary"
          onClick={() =>
            navigate("/patient")
          }
        >
          <ArrowLeft size={15} />

          <span>
            Dashboard
          </span>
        </button>
      </header>

      <main className="medicine-management-main">
        <div className="medicine-management-heading">
          <span className="medicine-management-eyebrow">
            MEDICATION MANAGEMENT
          </span>

          <h2>
            Your Medicines
          </h2>

          <p>
            Review your medicines and upcoming
            scheduled doses.
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>
              {error}
            </span>
          </div>
        )}

        {successMessage && (
          <div
            className="alert alert-success"
            role="status"
          >
            <span>
              {successMessage}
            </span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            flexWrap: "wrap",
            marginBottom: "20px"
          }}
        >
          <div
            style={{
              display: "inline-flex",
              gap: "6px",
              padding: "4px",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              background: "#ffffff"
            }}
          >
            <button
              type="button"
              onClick={() =>
                setActiveView("all")
              }
              style={{
                border: "none",
                borderRadius: "7px",
                padding: "8px 13px",
                background:
                  activeView === "all"
                    ? "#eff6ff"
                    : "transparent",
                color:
                  activeView === "all"
                    ? "#2563eb"
                    : "#64748b",
                fontFamily: "inherit",
                fontSize: "12px",
                fontWeight: 650,
                cursor: "pointer"
              }}
            >
              All Medicines
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveView("upcoming")
              }
              style={{
                border: "none",
                borderRadius: "7px",
                padding: "8px 13px",
                background:
                  activeView === "upcoming"
                    ? "#eff6ff"
                    : "transparent",
                color:
                  activeView === "upcoming"
                    ? "#2563eb"
                    : "#64748b",
                fontFamily: "inherit",
                fontSize: "12px",
                fontWeight: 650,
                cursor: "pointer"
              }}
            >
              Upcoming Doses
            </button>
          </div>

          <button
            type="button"
            className="medicine-management-primary"
            onClick={() =>
              navigate("/add-medicine")
            }
          >
            <Plus size={15} />

            <span>
              Add Medicine
            </span>
          </button>
        </div>

        {activeView === "all" ? (
          <>
            <div
              style={{
                position: "relative",
                marginBottom: "18px"
              }}
            >
              <Search
                size={17}
                style={{
                  position: "absolute",
                  left: "13px",
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  color: "#64748b",
                  pointerEvents: "none"
                }}
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Search medicines..."
                className="medicine-management-input"
                style={{
                  paddingLeft: "40px"
                }}
              />
            </div>

            {filteredMedicines.length === 0 ? (
              <div className="medicine-management-card">
                <div
                  style={{
                    minHeight: "220px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center"
                  }}
                >
                  <Pill
                    size={36}
                    strokeWidth={1.6}
                    style={{
                      color: "#64748b",
                      marginBottom: "12px"
                    }}
                  />

                  <h3
                    style={{
                      margin: 0,
                      color: "#0f172a",
                      fontSize: "15px"
                    }}
                  >
                    No medicines found
                  </h3>

                  <p
                    style={{
                      maxWidth: "360px",
                      margin:
                        "7px 0 18px",
                      color: "#64748b",
                      fontSize: "12px",
                      lineHeight: 1.6
                    }}
                  >
                    Add a medicine to start
                    building your medication
                    routine.
                  </p>

                  <button
                    type="button"
                    className="medicine-management-primary"
                    onClick={() =>
                      navigate(
                        "/add-medicine"
                      )
                    }
                  >
                    <Plus size={15} />

                    <span>
                      Add Medicine
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "16px"
                }}
              >
                {filteredMedicines.map(
                  (medicine) => (
                    <div
                      key={medicine._id}
                      className="medicine-management-card"
                      style={{
                        padding: "20px"
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "flex-start",
                          justifyContent:
                            "space-between",
                          gap: "12px"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: "10px"
                          }}
                        >
                          <div className="medicine-management-section-icon">
                            <Pill size={18} />
                          </div>

                          <div>
                            <h3
                              style={{
                                margin: 0,
                                color:
                                  "#0f172a",
                                fontSize:
                                  "14px",
                                fontWeight:
                                  700
                              }}
                            >
                              {medicine.name}
                            </h3>

                            <span
                              style={{
                                display:
                                  "block",
                                marginTop:
                                  "3px",
                                color:
                                  "#64748b",
                                fontSize:
                                  "11px"
                              }}
                            >
                              {medicine.dosage}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="icon-button"
                          title="Edit medicine"
                          onClick={() =>
                            navigate(
                              `/edit-medicine/${medicine._id}`
                            )
                          }
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap: "13px",
                          marginTop: "20px"
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display:
                                "block",
                              color:
                                "#94a3b8",
                              fontSize:
                                "10px",
                              marginBottom:
                                "4px"
                            }}
                          >
                            Frequency
                          </span>

                          <strong
                            style={{
                              color:
                                "#334155",
                              fontSize:
                                "12px"
                            }}
                          >
                            {medicine.frequency}
                          </strong>
                        </div>

                        <div>
                          <span
                            style={{
                              display:
                                "block",
                              color:
                                "#94a3b8",
                              fontSize:
                                "10px",
                              marginBottom:
                                "4px"
                            }}
                          >
                            Times
                          </span>

                          <strong
                            style={{
                              color:
                                "#334155",
                              fontSize:
                                "12px"
                            }}
                          >
                            {medicine.times?.join(
                              ", "
                            ) || "Not set"}
                          </strong>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "15px",
                          paddingTop:
                            "14px",
                          borderTop:
                            "1px solid #eef2f7"
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            color:
                              "#94a3b8",
                            fontSize:
                              "10px",
                            marginBottom:
                              "9px"
                          }}
                        >
                          Today's doses
                        </span>

                        <div
                          style={{
                            display:
                              "flex",
                            flexDirection:
                              "column",
                            gap: "9px"
                          }}
                        >
                          {Array.isArray(
                            medicine.times
                          ) &&
                          medicine.times.length >
                            0 ? (
                            medicine.times.map(
                              (time) => {
                                const status =
                                  getMedicineStatus(
                                    medicine._id,
                                    time
                                  );

                                return (
                                  <div
                                    key={`${medicine._id}-${time}`}
                                    style={{
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      justifyContent:
                                        "space-between",
                                      gap: "10px",
                                      padding:
                                        "10px 11px",
                                      border:
                                        "1px solid #eef2f7",
                                      borderRadius:
                                        "9px",
                                      background:
                                        "#f8fafc"
                                    }}
                                  >
                                    <div
                                      style={{
                                        display:
                                          "flex",
                                        alignItems:
                                          "center",
                                        gap: "8px",
                                        minWidth: 0
                                      }}
                                    >
                                      <Clock3
                                        size={
                                          14
                                        }
                                        style={{
                                          color:
                                            "#64748b",
                                          flex:
                                            "0 0 auto"
                                        }}
                                      />

                                      <div>
                                        <strong
                                          style={{
                                            display:
                                              "block",
                                            color:
                                              "#334155",
                                            fontSize:
                                              "12px"
                                          }}
                                        >
                                          {time}
                                        </strong>

                                        <span
                                          style={{
                                            display:
                                              "block",
                                            marginTop:
                                              "2px",
                                            color:
                                              status ===
                                              "taken"
                                                ? "#15803d"
                                                : status ===
                                                    "missed"
                                                  ? "#b91c1c"
                                                  : "#94a3b8",
                                            fontSize:
                                              "10px",
                                            fontWeight:
                                              650,
                                            textTransform:
                                              "capitalize"
                                          }}
                                        >
                                          {status ||
                                            "Not recorded"}
                                        </span>
                                      </div>
                                    </div>

                                    {status ? (
                                      <div
                                        style={{
                                          display:
                                            "inline-flex",
                                          alignItems:
                                            "center",
                                          gap: "5px",
                                          flex:
                                            "0 0 auto",
                                          color:
                                            status ===
                                            "taken"
                                              ? "#15803d"
                                              : "#b91c1c",
                                          fontSize:
                                            "10px",
                                          fontWeight:
                                            650
                                        }}
                                      >
                                        {status ===
                                        "taken" ? (
                                          <CheckCircle2
                                            size={
                                              15
                                            }
                                          />
                                        ) : (
                                          <XCircle
                                            size={
                                              15
                                            }
                                          />
                                        )}

                                        <span>
                                          {status ===
                                          "taken"
                                            ? "Taken"
                                            : "Missed"}
                                        </span>
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          alignItems:
                                            "center",
                                          gap: "6px",
                                          flex:
                                            "0 0 auto"
                                        }}
                                      >
                                        <button
                                          type="button"
                                          disabled={
                                            savingLog
                                          }
                                          onClick={() =>
                                            handleMedicineStatus(
                                              medicine._id,
                                              time,
                                              "taken"
                                            )
                                          }
                                          style={{
                                            display:
                                              "inline-flex",
                                            alignItems:
                                              "center",
                                            gap: "4px",
                                            border:
                                              "1px solid #bbf7d0",
                                            borderRadius:
                                              "7px",
                                            padding:
                                              "6px 9px",
                                            background:
                                              "#f0fdf4",
                                            color:
                                              "#15803d",
                                            fontFamily:
                                              "inherit",
                                            fontSize:
                                              "10px",
                                            fontWeight:
                                              650,
                                            cursor:
                                              savingLog
                                                ? "not-allowed"
                                                : "pointer",
                                            opacity:
                                              savingLog
                                                ? 0.6
                                                : 1
                                          }}
                                        >
                                          <CheckCircle2
                                            size={
                                              13
                                            }
                                          />

                                          <span>
                                            Taken
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          disabled={
                                            savingLog
                                          }
                                          onClick={() =>
                                            handleMedicineStatus(
                                              medicine._id,
                                              time,
                                              "missed"
                                            )
                                          }
                                          style={{
                                            display:
                                              "inline-flex",
                                            alignItems:
                                              "center",
                                            gap: "4px",
                                            border:
                                              "1px solid #fecaca",
                                            borderRadius:
                                              "7px",
                                            padding:
                                              "6px 9px",
                                            background:
                                              "#fef2f2",
                                            color:
                                              "#b91c1c",
                                            fontFamily:
                                              "inherit",
                                            fontSize:
                                              "10px",
                                            fontWeight:
                                              650,
                                            cursor:
                                              savingLog
                                                ? "not-allowed"
                                                : "pointer",
                                            opacity:
                                              savingLog
                                                ? 0.6
                                                : 1
                                          }}
                                        >
                                          <XCircle
                                            size={
                                              13
                                            }
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
                          ) : (
                            <span
                              style={{
                                color:
                                  "#64748b",
                                fontSize:
                                  "11px"
                              }}
                            >
                              No scheduled times.
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "15px",
                          paddingTop:
                            "14px",
                          borderTop:
                            "1px solid #eef2f7"
                        }}
                      >
                        <span
                          style={{
                            display:
                              "block",
                            color:
                              "#94a3b8",
                            fontSize:
                              "10px",
                            marginBottom:
                              "4px"
                          }}
                        >
                          Instructions
                        </span>

                        <p
                          style={{
                            margin: 0,
                            color:
                              "#64748b",
                            fontSize:
                              "11px",
                            lineHeight:
                              1.5
                          }}
                        >
                          {medicine.instructions ||
                            "No special instructions."}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </>
        ) : (
          <div className="medicine-management-card">
            <div className="medicine-management-section-heading">
              <div className="medicine-management-section-icon">
                <Clock3 size={18} />
              </div>

              <div>
                <h3>
                  Upcoming Doses
                </h3>

                <p>
                  Your remaining scheduled doses
                  for today.
                </p>
              </div>
            </div>

            {upcomingMedicines.length === 0 ? (
              <div
                style={{
                  minHeight: "180px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center"
                }}
              >
                <Clock3
                  size={34}
                  strokeWidth={1.6}
                  style={{
                    color: "#64748b",
                    marginBottom: "10px"
                  }}
                />

                <strong
                  style={{
                    color: "#0f172a",
                    fontSize: "14px"
                  }}
                >
                  No upcoming doses
                </strong>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color: "#64748b",
                    fontSize: "11px"
                  }}
                >
                  You're all caught up
                  for now.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}
              >
                {upcomingMedicines.map(
                  ({ medicine, time }) => (
                    <div
                      key={`${medicine._id}-${time}`}
                      className="upcoming-card"
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
                        <Edit3 size={14} />
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Medicines;