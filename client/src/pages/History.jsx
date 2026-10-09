import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  History as HistoryIcon,
  Pill,
  Search,
  X,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

const History = () => {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/medicine-logs");

        setLogs(response.data.logs || []);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load medicine history."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    );
  };

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    if (!query) {
      return true;
    }

    const medicineName =
      log.medicineId?.name || "";

    const dosage =
      log.medicineId?.dosage || "";

    const status =
      log.status || "";

    const scheduledTime =
      log.scheduledTime || "";

    const date =
      formatDate(log.date);

    return [
      medicineName,
      dosage,
      status,
      scheduledTime,
      date
    ].some((value) =>
      value
        .toString()
        .toLowerCase()
        .includes(query)
    );
  });

  const takenCount = logs.filter(
    (log) => log.status === "taken"
  ).length;

  const missedCount = logs.filter(
    (log) => log.status === "missed"
  ).length;

  return (
    <div className="history-page">
      <header className="history-header">
        <div className="history-brand">
          <div className="history-brand-icon">
            <Pill
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

        <div className="history-header-status">
          <HistoryIcon size={16} />

          <span>
            Medication record
          </span>
        </div>
      </header>

      <main className="history-main">
        <div className="history-heading">
          <div>
            <span className="history-eyebrow">
              MEDICATION RECORD
            </span>

            <h2>
              Medicine History
            </h2>

            <p>
              Review your previous medication
              doses and their recorded status.
            </p>
          </div>
        </div>

        {!loading &&
          !error &&
          logs.length > 0 && (
            <div className="history-overview">
              <div className="history-overview-card">
                <div className="history-overview-icon">
                  <HistoryIcon size={18} />
                </div>

                <div>
                  <span>
                    Total records
                  </span>

                  <strong>
                    {logs.length}
                  </strong>
                </div>
              </div>

              <div className="history-overview-card">
                <div className="history-overview-icon history-overview-icon-success">
                  <CheckCircle2 size={18} />
                </div>

                <div>
                  <span>
                    Taken
                  </span>

                  <strong>
                    {takenCount}
                  </strong>
                </div>
              </div>

              <div className="history-overview-card">
                <div className="history-overview-icon history-overview-icon-missed">
                  <XCircle size={18} />
                </div>

                <div>
                  <span>
                    Missed
                  </span>

                  <strong>
                    {missedCount}
                  </strong>
                </div>
              </div>
            </div>
          )}

        {!loading &&
          !error &&
          logs.length > 0 && (
            <div className="history-search">
              <Search size={18} />

              <input
                type="text"
                placeholder="Search medicine, dosage, status, date..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                aria-label="Search medicine history"
              />

              {searchQuery && (
                <button
                  type="button"
                  className="history-search-clear"
                  onClick={() =>
                    setSearchQuery("")
                  }
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

        {loading && (
          <div className="history-state">
            <div className="history-state-icon">
              <Clock3 size={24} />
            </div>

            <h3>
              Loading history
            </h3>

            <p>
              Please wait while we load your
              medication records.
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="history-state history-state-error">
            <div className="history-state-icon">
              <XCircle size={24} />
            </div>

            <h3>
              Unable to load history
            </h3>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="history-secondary-button"
              onClick={() =>
                navigate("/patient")
              }
            >
              <ArrowLeft size={16} />

              <span>
                Back to Dashboard
              </span>
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          logs.length === 0 && (
            <div className="history-state">
              <div className="history-state-icon">
                <HistoryIcon size={24} />
              </div>

              <h3>
                No medicine history yet
              </h3>

              <p>
                Your taken and missed medication
                records will appear here.
              </p>

              <button
                type="button"
                className="history-primary-button"
                onClick={() =>
                  navigate("/add-medicine")
                }
              >
                <Pill size={16} />

                <span>
                  Add Medicine
                </span>
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          logs.length > 0 &&
          filteredLogs.length === 0 && (
            <div className="history-state">
              <div className="history-state-icon">
                <Search size={24} />
              </div>

              <h3>
                No matching records
              </h3>

              <p>
                Try searching by medicine name,
                dosage, status, time, or date.
              </p>

              <button
                type="button"
                className="history-secondary-button"
                onClick={() =>
                  setSearchQuery("")
                }
              >
                <X size={16} />

                <span>
                  Clear Search
                </span>
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          filteredLogs.length > 0 && (
            <div className="history-list">
              <div className="history-list-header">
                <div>
                  <h3>
                    Medication records
                  </h3>

                  <p>
                    {filteredLogs.length}{" "}
                    {filteredLogs.length === 1
                      ? "record"
                      : "records"}{" "}
                    displayed
                  </p>
                </div>
              </div>

              <div className="history-records">
                {filteredLogs.map((log) => {
                  const medicineName =
                    log.medicineId?.name ||
                    "Medicine";

                  const dosage =
                    log.medicineId?.dosage ||
                    "Dosage not available";

                  const isTaken =
                    log.status === "taken";

                  return (
                    <article
                      className="history-record"
                      key={log._id}
                    >
                      <div className="history-record-main">
                        <div className="history-record-icon">
                          <Pill size={21} />
                        </div>

                        <div className="history-record-details">
                          <div className="history-record-title">
                            <h4>
                              {medicineName}
                            </h4>

                            <span>
                              {dosage}
                            </span>
                          </div>

                          <div className="history-record-meta">
                            <div>
                              <Clock3
                                size={15}
                              />

                              <span>
                                {log.scheduledTime}
                              </span>
                            </div>

                            <div>
                              <HistoryIcon
                                size={15}
                              />

                              <span>
                                {formatDate(
                                  log.date
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`history-status ${
                          isTaken
                            ? "history-status-taken"
                            : "history-status-missed"
                        }`}
                      >
                        {isTaken ? (
                          <CheckCircle2
                            size={16}
                          />
                        ) : (
                          <XCircle
                            size={16}
                          />
                        )}

                        <span>
                          {isTaken
                            ? "Taken"
                            : "Missed"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

        <div className="history-footer">
          <button
            className="history-secondary-button"
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
        </div>
      </main>
    </div>
  );
};

export default History;