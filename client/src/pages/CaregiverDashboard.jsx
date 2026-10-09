import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  Link2,
  LoaderCircle,
  LogOut,
  Mail,
  Pill,
  ShieldCheck,
  UserRound,
  Users,
  X,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const CaregiverDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [patientId, setPatientId] = useState("");
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] =
    useState(null);

  const [medicines, setMedicines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [adherence, setAdherence] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] =
    useState(true);
  const [loadingPatientData, setLoadingPatientData] =
    useState(false);
  const [loadingPatientId, setLoadingPatientId] =
    useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const fetchConnectedPatients = async () => {
    try {
      setLoadingPatients(true);
      setError("");

      const response = await api.get(
        "/caregiver/patients"
      );

      setPatients(response.data.patients || []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load connected patients."
      );
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchConnectedPatients();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleConnectPatient = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const trimmedPatientId = patientId.trim();

    if (!trimmedPatientId) {
      setError("Please enter a patient ID.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/caregiver/connect", {
        patientId: trimmedPatientId
      });

      setSuccessMessage(
        "Patient connected successfully."
      );

      setPatientId("");

      await fetchConnectedPatients();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to connect patient."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatientData = async (patient) => {
    const connectedPatientId =
      patient.patientId?._id;

    if (
      !connectedPatientId ||
      loadingPatientData
    ) {
      return;
    }

    try {
      setLoadingPatientData(true);
      setLoadingPatientId(connectedPatientId);
      setError("");
      setSuccessMessage("");

      const [
        medicineResponse,
        logsResponse,
        adherenceResponse
      ] = await Promise.all([
        api.get(
          `/caregiver/patients/${connectedPatientId}/medicines`
        ),
        api.get(
          `/caregiver/patients/${connectedPatientId}/logs`
        ),
        api.get(
          `/caregiver/patients/${connectedPatientId}/adherence`
        )
      ]);

      setSelectedPatient(patient.patientId);

      setMedicines(
        medicineResponse.data.medicines || []
      );

      setLogs(
        logsResponse.data.logs || []
      );

      setAdherence(
        adherenceResponse.data
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load patient data."
      );
    } finally {
      setLoadingPatientData(false);
      setLoadingPatientId("");
    }
  };

  const adherencePercentage =
    adherence?.adherencePercentage ?? 0;

  const totalTaken =
    adherence?.totalTaken ?? 0;

  const totalMissed =
    adherence?.totalMissed ?? 0;

  const totalScheduled =
    adherence?.totalScheduled ?? 0;

  const safeAdherence = Math.min(
    Math.max(adherencePercentage, 0),
    100
  );

  const selectedPatientName =
    selectedPatient?.name || "Selected patient";

  const selectedPatientEmail =
    selectedPatient?.email ||
    "Email not available";

  return (
    <div className="caregiver-page">
      <header className="caregiver-header">
        <div className="caregiver-brand">
          <div className="caregiver-brand-icon">
            <ShieldCheck
              size={21}
              strokeWidth={2.2}
            />
          </div>

          <div className="caregiver-brand-content">
            <h1>MediCare</h1>
            <span>Caregiver Portal</span>
          </div>
        </div>

        <div className="caregiver-header-actions">
          <div className="caregiver-header-profile">
            <div className="caregiver-header-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "C"}
            </div>

            <div className="caregiver-header-user">
              <strong>
                {user?.name || "Caregiver"}
              </strong>

              <span>Caregiver</span>
            </div>
          </div>

          <button
            className="caregiver-header-logout"
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
          >
            <LogOut size={17} />
            <span>Log out</span>
          </button>
        </div>
      </header>

      <main className="caregiver-main">
        <section className="caregiver-hero">
          <div className="caregiver-hero-content">
            <span className="caregiver-eyebrow">
              CAREGIVER WORKSPACE
            </span>

            <h2>
              Patient Care Overview
            </h2>

            <p>
              Monitor connected patients, medication
              schedules, adherence, and recorded
              medication activity from one workspace.
            </p>
          </div>

          <div className="caregiver-hero-status">
            <div className="caregiver-hero-status-icon">
              <Activity size={18} />
            </div>

            <div>
              <span>Care monitoring</span>
              <strong>Workspace active</strong>
            </div>
          </div>
        </section>

        {error && (
          <div className="caregiver-alert caregiver-alert-error">
            <XCircle size={18} />

            <p>{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="caregiver-alert caregiver-alert-success">
            <CheckCircle2 size={18} />

            <p>{successMessage}</p>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Dismiss success message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="caregiver-section">
          <div className="caregiver-section-heading">
            <div>
              <span>PATIENT CONNECTION</span>

              <h3>Connect a Patient</h3>

              <p>
                Add a patient using the unique account
                ID they provide to you.
              </p>
            </div>
          </div>

          <div className="caregiver-connect-card">
            <div className="caregiver-connect-intro">
              <div className="caregiver-connect-icon">
                <Link2 size={20} />
              </div>

              <div>
                <span className="caregiver-card-eyebrow">
                  SECURE CONNECTION
                </span>

                <h3>Patient account</h3>

                <p>
                  Enter the patient's account ID to
                  establish a caregiver connection.
                </p>
              </div>
            </div>

            <form
              className="caregiver-connect-form"
              onSubmit={handleConnectPatient}
            >
              <div className="caregiver-form-field">
                <label htmlFor="patient-id">
                  Patient ID
                </label>

                <input
                  id="patient-id"
                  type="text"
                  value={patientId}
                  onChange={(event) =>
                    setPatientId(
                      event.target.value
                    )
                  }
                  placeholder="Enter patient account ID"
                  autoComplete="off"
                  required
                  disabled={loading}
                />
              </div>

              <button
                className="caregiver-primary-button"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <LoaderCircle
                    size={16}
                    className="caregiver-loading-icon"
                  />
                ) : (
                  <Link2 size={16} />
                )}

                <span>
                  {loading
                    ? "Connecting..."
                    : "Connect Patient"}
                </span>
              </button>
            </form>

            <div className="caregiver-connect-note">
              <ShieldCheck size={15} />

              <span>
                Only connect to patients who have
                provided their account ID.
              </span>
            </div>
          </div>
        </section>

        <section className="caregiver-section">
          <div className="caregiver-section-heading">
            <div>
              <span>CONNECTED PATIENTS</span>

              <h3>Your Patients</h3>

              <p>
                Select a patient to open their
                medication care workspace.
              </p>
            </div>

            {!loadingPatients &&
              patients.length > 0 && (
                <div className="caregiver-count-badge">
                  <Users size={14} />

                  <span>
                    {patients.length}{" "}
                    {patients.length === 1
                      ? "patient"
                      : "patients"}
                  </span>
                </div>
              )}
          </div>

          {loadingPatients ? (
            <div className="caregiver-state">
              <div className="caregiver-state-icon">
                <LoaderCircle
                  size={23}
                  className="caregiver-loading-icon"
                />
              </div>

              <h3>Loading patients</h3>

              <p>
                Please wait while we load your
                connected patients.
              </p>
            </div>
          ) : patients.length === 0 ? (
            <div className="caregiver-state">
              <div className="caregiver-state-icon">
                <Users size={23} />
              </div>

              <h3>No connected patients</h3>

              <p>
                Connect a patient using their account
                ID to begin monitoring their
                medication activity.
              </p>
            </div>
          ) : (
            <div className="caregiver-patient-grid">
              {patients.map((connection) => {
                const patient =
                  connection.patientId;

                const patientName =
                  patient?.name || "Patient";

                const patientEmail =
                  patient?.email ||
                  "Email not available";

                const patientInitial =
                  patientName
                    .charAt(0)
                    .toUpperCase();

                const isSelected =
                  selectedPatient?._id ===
                  patient?._id;

                const isLoadingThisPatient =
                  loadingPatientId ===
                  patient?._id;

                return (
                  <button
                    key={connection._id}
                    type="button"
                    className={`caregiver-patient-card ${
                      isSelected
                        ? "caregiver-patient-card-selected"
                        : ""
                    } ${
                      isLoadingThisPatient
                        ? "caregiver-patient-card-loading"
                        : ""
                    }`}
                    onClick={() =>
                      handleViewPatientData(
                        connection
                      )
                    }
                    disabled={loadingPatientData}
                    aria-label={`View ${patientName}'s patient data`}
                    aria-busy={
                      isLoadingThisPatient
                    }
                  >
                    <div className="caregiver-patient-top">
                      <div className="caregiver-patient-avatar">
                        {isLoadingThisPatient ? (
                          <LoaderCircle
                            size={17}
                            className="caregiver-loading-icon"
                          />
                        ) : (
                          patientInitial
                        )}
                      </div>

                      <div className="caregiver-patient-title">
                        <h4>{patientName}</h4>

                        <span>
                          {isLoadingThisPatient
                            ? "Opening workspace..."
                            : isSelected
                            ? "Currently selected"
                            : "Connected patient"}
                        </span>
                      </div>

                      {isLoadingThisPatient ? (
                        <div className="caregiver-selected-indicator caregiver-selected-indicator-loading">
                          <LoaderCircle
                            size={14}
                            className="caregiver-loading-icon"
                          />
                        </div>
                      ) : (
                        isSelected && (
                          <div className="caregiver-selected-indicator">
                            <Check size={14} />
                          </div>
                        )
                      )}
                    </div>

                    <div className="caregiver-patient-details">
                      <div>
                        <Mail size={15} />

                        <span>
                          {patientEmail}
                        </span>
                      </div>

                      <div>
                        <ShieldCheck size={15} />

                        <span>
                          Active connection
                        </span>
                      </div>
                    </div>

                    <div className="caregiver-patient-action">
                      {isLoadingThisPatient ? (
                        <LoaderCircle
                          size={15}
                          className="caregiver-loading-icon"
                        />
                      ) : (
                        <Activity size={15} />
                      )}

                      <span>
                        {isLoadingThisPatient
                          ? "Loading patient data..."
                          : isSelected
                          ? "Patient workspace open"
                          : "Open patient workspace"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selectedPatient && (
          <>
            <section className="caregiver-patient-context">
              <div className="caregiver-patient-context-main">
                <div className="caregiver-patient-context-avatar">
                  {selectedPatientName
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <span className="caregiver-card-eyebrow">
                    CURRENT PATIENT
                  </span>

                  <h3>
                    {selectedPatientName}
                  </h3>

                  <div className="caregiver-patient-context-meta">
                    <Mail size={14} />

                    <span>
                      {selectedPatientEmail}
                    </span>
                  </div>
                </div>
              </div>

              <div className="caregiver-patient-context-status">
                <ShieldCheck size={16} />

                <span>
                  Connected securely
                </span>
              </div>
            </section>

            <section className="caregiver-section">
              <div className="caregiver-section-heading">
                <div>
                  <span>
                    MEDICATION ADHERENCE
                  </span>

                  <h3>
                    Adherence Overview
                  </h3>

                  <p>
                    A summary of recorded medication
                    schedules and dose activity.
                  </p>
                </div>
              </div>

              <div className="caregiver-adherence-grid">
                <div className="caregiver-adherence-main">
                  <div className="caregiver-metric-header">
                    <div className="caregiver-metric-icon">
                      <Activity size={19} />
                    </div>

                    <div>
                      <span>
                        Overall adherence
                      </span>

                      <strong>
                        {adherencePercentage}%
                      </strong>
                    </div>
                  </div>

                  <div
                    className="caregiver-progress"
                    aria-label={`Medication adherence ${adherencePercentage}%`}
                  >
                    <div
                      className="caregiver-progress-fill"
                      style={{
                        width: `${safeAdherence}%`
                      }}
                    />
                  </div>

                  <p className="caregiver-progress-note">
                    Calculated from the medication
                    activity currently recorded for
                    this patient.
                  </p>
                </div>

                <CaregiverMetricCard
                  icon={<Check size={19} />}
                  label="Taken"
                  value={totalTaken}
                  description="Completed doses"
                  variant="success"
                />

                <CaregiverMetricCard
                  icon={<X size={19} />}
                  label="Missed"
                  value={totalMissed}
                  description="Missed doses"
                  variant="danger"
                />

                <CaregiverMetricCard
                  icon={<Clock3 size={19} />}
                  label="Scheduled"
                  value={totalScheduled}
                  description="Recorded schedules"
                  variant="default"
                />
              </div>
            </section>

            <section className="caregiver-section">
              <div className="caregiver-section-heading">
                <div>
                  <span>
                    MEDICATION PLAN
                  </span>

                  <h3>Current Medicines</h3>

                  <p>
                    Review the medication plan and
                    recorded instructions for{" "}
                    {selectedPatientName}.
                  </p>
                </div>

                {medicines.length > 0 && (
                  <div className="caregiver-count-badge">
                    <Pill size={14} />

                    <span>
                      {medicines.length}{" "}
                      {medicines.length === 1
                        ? "medicine"
                        : "medicines"}
                    </span>
                  </div>
                )}
              </div>

              {medicines.length === 0 ? (
                <div className="caregiver-state">
                  <div className="caregiver-state-icon">
                    <Pill size={23} />
                  </div>

                  <h3>No medicines recorded</h3>

                  <p>
                    This patient does not have any
                    medicines recorded yet.
                  </p>
                </div>
              ) : (
                <div className="caregiver-medicine-grid">
                  {medicines.map((medicine) => (
                    <article
                      className="caregiver-medicine-card"
                      key={medicine._id}
                    >
                      <div className="caregiver-medicine-top">
                        <div className="caregiver-medicine-icon">
                          <Pill size={20} />
                        </div>

                        <div className="caregiver-medicine-title">
                          <h4>
                            {medicine.name}
                          </h4>

                          <span>
                            {medicine.dosage}
                          </span>
                        </div>

                        <span className="caregiver-active-badge">
                          Active
                        </span>
                      </div>

                      <div className="caregiver-medicine-info">
                        <div>
                          <Clock3 size={15} />

                          <span>
                            <strong>
                              Frequency
                            </strong>

                            {medicine.frequency}
                          </span>
                        </div>

                        <div>
                          <Bell size={15} />

                          <span>
                            <strong>
                              Scheduled times
                            </strong>

                            {medicine.times?.length
                              ? medicine.times.join(
                                  " • "
                                )
                              : "No times recorded"}
                          </span>
                        </div>

                        {medicine.instructions && (
                          <div>
                            <ShieldCheck size={15} />

                            <span>
                              <strong>
                                Instructions
                              </strong>

                              {medicine.instructions}
                            </span>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="caregiver-section">
              <div className="caregiver-section-heading">
                <div>
                  <span>
                    MEDICATION ACTIVITY
                  </span>

                  <h3>
                    Medication History
                  </h3>

                  <p>
                    Review recorded taken and missed
                    medication activity.
                  </p>
                </div>

                {logs.length > 0 && (
                  <div className="caregiver-count-badge">
                    <Activity size={14} />

                    <span>
                      {logs.length}{" "}
                      {logs.length === 1
                        ? "record"
                        : "records"}
                    </span>
                  </div>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="caregiver-state">
                  <div className="caregiver-state-icon">
                    <Clock3 size={23} />
                  </div>

                  <h3>
                    No medication activity
                  </h3>

                  <p>
                    No medication activity has been
                    recorded for this patient yet.
                  </p>
                </div>
              ) : (
                <div className="caregiver-history">
                  {logs.map((log) => {
                    const isTaken =
                      log.status === "taken";

                    const medicineName =
                      log.medicineId?.name ||
                      "Medicine";

                    const medicineDosage =
                      log.medicineId?.dosage ||
                      "Dosage not available";

                    return (
                      <article
                        className="caregiver-history-row"
                        key={log._id}
                      >
                        <div className="caregiver-history-main">
                          <div className="caregiver-history-icon">
                            <Pill size={18} />
                          </div>

                          <div>
                            <h4>
                              {medicineName}
                            </h4>

                            <span>
                              {medicineDosage}
                            </span>
                          </div>
                        </div>

                        <div className="caregiver-history-meta">
                          <div>
                            <Clock3 size={14} />

                            <span>
                              {log.scheduledTime}
                            </span>
                          </div>

                          <div>
                            <Bell size={14} />

                            <span>
                              {new Date(
                                log.date
                              ).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                }
                              )}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`caregiver-history-status ${
                            isTaken
                              ? "caregiver-history-status-taken"
                              : "caregiver-history-status-missed"
                          }`}
                        >
                          {isTaken ? (
                            <CheckCircle2 size={15} />
                          ) : (
                            <XCircle size={15} />
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
              )}
            </section>
          </>
        )}

        {!selectedPatient &&
          !loadingPatients && (
            <section className="caregiver-section caregiver-guidance-section">
              <div className="caregiver-guidance-card">
                <div className="caregiver-guidance-icon">
                  <UserRound size={20} />
                </div>

                <div>
                  <span className="caregiver-card-eyebrow">
                    CARE WORKSPACE
                  </span>

                  <h3>
                    Select a patient to begin
                  </h3>

                  <p>
                    Choose a connected patient above to
                    view their medication plan, adherence
                    overview, and recent activity.
                  </p>
                </div>
              </div>
            </section>
          )}

        <footer className="caregiver-footer">
          <div className="caregiver-footer-info">
            <ShieldCheck size={16} />

            <span>
              Patient medication information is
              available only through an active
              caregiver connection.
            </span>
          </div>

          <button
            className="caregiver-logout-button"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={16} />

            <span>Log out</span>
          </button>
        </footer>
      </main>
    </div>
  );
};

const CaregiverMetricCard = ({
  icon,
  label,
  value,
  description,
  variant = "default"
}) => {
  return (
    <div className="caregiver-metric-card">
      <div
        className={`caregiver-metric-icon caregiver-metric-icon-${variant}`}
      >
        {icon}
      </div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>

        <p>{description}</p>
      </div>
    </div>
  );
};

export default CaregiverDashboard;