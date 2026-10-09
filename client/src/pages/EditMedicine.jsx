import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Pill,
  Plus,
  Save,
  Trash2
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";

const EditMedicine = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    times: [""],
    startDate: "",
    endDate: "",
    instructions: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/medicines");

        const medicine = response.data.medicines.find(
          (item) => item._id === id
        );

        if (!medicine) {
          setError("Medicine not found.");
          return;
        }

        setFormData({
          name: medicine.name || "",
          dosage: medicine.dosage || "",
          frequency: medicine.frequency || "",
          times:
            medicine.times?.length > 0
              ? medicine.times
              : [""],
          startDate: medicine.startDate
            ? new Date(medicine.startDate)
                .toISOString()
                .split("T")[0]
            : "",
          endDate: medicine.endDate
            ? new Date(medicine.endDate)
                .toISOString()
                .split("T")[0]
            : "",
          instructions: medicine.instructions || ""
        });
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load medicine."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMedicine();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value
    });

    if (error) {
      setError("");
    }
  };

  const handleTimeChange = (index, value) => {
    const updatedTimes = [...formData.times];

    updatedTimes[index] = value;

    setFormData({
      ...formData,
      times: updatedTimes
    });

    if (error) {
      setError("");
    }
  };

  const addTimeField = () => {
    setFormData({
      ...formData,
      times: [...formData.times, ""]
    });
  };

  const removeTimeField = (index) => {
    if (formData.times.length === 1) {
      return;
    }

    const updatedTimes = formData.times.filter(
      (_, timeIndex) => timeIndex !== index
    );

    setFormData({
      ...formData,
      times: updatedTimes
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!formData.name.trim()) {
      setError("Please enter the medicine name.");
      return;
    }

    if (!formData.dosage.trim()) {
      setError("Please enter the dosage.");
      return;
    }

    if (!formData.frequency.trim()) {
      setError("Please enter the medicine frequency.");
      return;
    }

    const validTimes = formData.times.filter(
      (time) => time.trim() !== ""
    );

    if (validTimes.length === 0) {
      setError(
        "Please add at least one medicine time."
      );
      return;
    }

    if (!formData.startDate) {
      setError("Please select a start date.");
      return;
    }

    try {
      setSaving(true);

      await api.put(`/medicines/${id}`, {
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        times: validTimes,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        instructions: formData.instructions
      });

      setSuccessMessage(
        "Medicine updated successfully."
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to update medicine."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="medicine-management-page">
        <header className="medicine-management-header">
          <div className="medicine-management-brand">
            <div className="medicine-management-brand-icon">
              <Pill
                size={21}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <h1>MediCare</h1>

              <span>
                Medicine Companion
              </span>
            </div>
          </div>
        </header>

        <main className="medicine-management-main">
          <div className="medicine-management-loading">
            <div className="medicine-management-loading-icon">
              <Clock3 size={22} />
            </div>

            <h2>
              Loading medicine
            </h2>

            <p>
              Please wait while we load the
              medication details.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="medicine-management-page">
        <header className="medicine-management-header">
          <div className="medicine-management-brand">
            <div className="medicine-management-brand-icon">
              <Pill
                size={21}
                strokeWidth={2.2}
              />
            </div>

            <div>
              <h1>MediCare</h1>

              <span>
                Medicine Companion
              </span>
            </div>
          </div>
        </header>

        <main className="medicine-management-main">
          <div className="medicine-management-error-page">
            <div className="medicine-management-error-icon">
              !
            </div>

            <span className="medicine-management-eyebrow">
              MEDICATION MANAGEMENT
            </span>

            <h2>
              Medicine not available
            </h2>

            <p>
              {error}
            </p>

            <button
              className="medicine-management-secondary"
              type="button"
              onClick={() =>
                navigate("/patient")
              }
            >
              <ArrowLeft size={17} />

              <span>
                Back to Dashboard
              </span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="medicine-management-page">
      <header className="medicine-management-header">
        <div className="medicine-management-brand">
          <div className="medicine-management-brand-icon">
            <Pill
              size={21}
              strokeWidth={2.2}
            />
          </div>

          <div>
            <h1>MediCare</h1>

            <span>
              Medicine Companion
            </span>
          </div>
        </div>

        <div className="medicine-management-header-status">
          <CheckCircle2 size={16} />

          <span>
            Medication management
          </span>
        </div>
      </header>

      <main className="medicine-management-main">
        <div className="medicine-management-heading">
          <div>
            <span className="medicine-management-eyebrow">
              MEDICATION MANAGEMENT
            </span>

            <h2>
              Edit Medicine
            </h2>

            <p>
              Review and update the medication
              schedule for this medicine.
            </p>
          </div>
        </div>

        {error && (
          <div
            className="medicine-management-alert medicine-management-alert-error"
            role="alert"
          >
            <div className="medicine-management-alert-icon">
              !
            </div>

            <div>
              <strong>
                Please check the form
              </strong>

              <p>
                {error}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            className="medicine-management-alert medicine-management-alert-success"
            role="status"
          >
            <div className="medicine-management-alert-icon">
              <CheckCircle2 size={17} />
            </div>

            <div>
              <strong>
                Changes saved
              </strong>

              <p>
                {successMessage}
              </p>
            </div>
          </div>
        )}

        <form
          className="medicine-management-card"
          onSubmit={handleSubmit}
          noValidate
        >
          <section className="medicine-management-section">
            <div className="medicine-management-section-heading">
              <div className="medicine-management-section-icon">
                <Pill size={19} />
              </div>

              <div>
                <h3>
                  Medicine details
                </h3>

                <p>
                  Update the basic information for
                  this medication.
                </p>
              </div>
            </div>

            <div className="medicine-management-grid medicine-management-grid-details">
              <div className="medicine-management-field medicine-management-field-full">
                <label htmlFor="medicine-name">
                  Medicine name
                </label>

                <input
                  id="medicine-name"
                  className="medicine-management-input"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Paracetamol"
                />
              </div>

              <div className="medicine-management-field">
                <label htmlFor="medicine-dosage">
                  Dosage
                </label>

                <input
                  id="medicine-dosage"
                  className="medicine-management-input"
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  placeholder="e.g. 500 mg"
                />
              </div>

              <div className="medicine-management-field">
                <label htmlFor="medicine-frequency">
                  Frequency
                </label>

                <input
                  id="medicine-frequency"
                  className="medicine-management-input"
                  type="text"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  placeholder="e.g. Twice a day"
                />
              </div>
            </div>
          </section>

          <div className="medicine-management-divider" />

          <section className="medicine-management-section">
            <div className="medicine-management-section-heading">
              <div className="medicine-management-section-icon">
                <Clock3 size={19} />
              </div>

              <div>
                <h3>
                  Medication times
                </h3>

                <p>
                  Update each time this medicine
                  should be taken.
                </p>
              </div>
            </div>

            <div className="medicine-management-times">
              {formData.times.map(
                (time, index) => (
                  <div
                    className="medicine-management-time-row"
                    key={index}
                  >
                    <div className="medicine-management-time-input">
                      <Clock3 size={17} />

                      <input
                        className="medicine-management-input"
                        type="time"
                        value={time}
                        onChange={(event) =>
                          handleTimeChange(
                            index,
                            event.target.value
                          )
                        }
                      />
                    </div>

                    {formData.times.length > 1 && (
                      <button
                        className="medicine-management-remove"
                        type="button"
                        onClick={() =>
                          removeTimeField(index)
                        }
                        aria-label={`Remove medicine time ${
                          index + 1
                        }`}
                      >
                        <Trash2 size={16} />

                        <span>
                          Remove
                        </span>
                      </button>
                    )}
                  </div>
                )
              )}
            </div>

            <button
              className="medicine-management-add-time"
              type="button"
              onClick={addTimeField}
            >
              <Plus size={17} />

              <span>
                Add another time
              </span>
            </button>
          </section>

          <div className="medicine-management-divider" />

          <section className="medicine-management-section">
            <div className="medicine-management-section-heading">
              <div className="medicine-management-section-icon">
                <CalendarDays size={19} />
              </div>

              <div>
                <h3>
                  Schedule duration
                </h3>

                <p>
                  Update when this medication
                  schedule begins and ends.
                </p>
              </div>
            </div>

            <div className="medicine-management-grid">
              <div className="medicine-management-field">
                <label htmlFor="medicine-start-date">
                  Start date
                </label>

                <input
                  id="medicine-start-date"
                  className="medicine-management-input"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>

              <div className="medicine-management-field">
                <label htmlFor="medicine-end-date">
                  End date
                </label>

                <input
                  id="medicine-end-date"
                  className="medicine-management-input"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />

                <span className="medicine-management-hint">
                  Optional
                </span>
              </div>
            </div>
          </section>

          <div className="medicine-management-divider" />

          <section className="medicine-management-section">
            <div className="medicine-management-section-heading">
              <div className="medicine-management-section-icon">
                <FileText size={19} />
              </div>

              <div>
                <h3>
                  Additional instructions
                </h3>

                <p>
                  Update notes that help you follow
                  your medication schedule.
                </p>
              </div>
            </div>

            <div className="medicine-management-field">
              <label htmlFor="medicine-instructions">
                Instructions
              </label>

              <textarea
                id="medicine-instructions"
                className="medicine-management-input medicine-management-textarea"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                placeholder="e.g. Take after food"
                rows="4"
              />
            </div>
          </section>

          <div className="medicine-management-actions">
            <button
              className="medicine-management-secondary"
              type="button"
              onClick={() =>
                navigate("/patient")
              }
            >
              <ArrowLeft size={17} />

              <span>
                Back to Dashboard
              </span>
            </button>

            <button
              className="medicine-management-primary"
              type="submit"
              disabled={saving}
            >
              <Save size={17} />

              <span>
                {saving
                  ? "Saving..."
                  : "Update medicine"}
              </span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditMedicine;