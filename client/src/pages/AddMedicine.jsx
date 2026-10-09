import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileImage,
  FileText,
  Info,
  Pill,
  Plus,
  Save,
  ScanLine,
  ShieldAlert,
  Stethoscope,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

const AddMedicine = () => {
  const navigate = useNavigate();
  const labelInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    times: [""],
    startDate: "",
    endDate: "",
    instructions: ""
  });

  const [labelImage, setLabelImage] = useState(null);
  const [labelPreview, setLabelPreview] = useState("");
  const [labelError, setLabelError] = useState("");
  const [labelAnalysis, setLabelAnalysis] = useState("");
  const [analyzingLabel, setAnalyzingLabel] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleLabelImageChange = (event) => {
    const file = event.target.files?.[0];

    setLabelError("");
    setLabelAnalysis("");

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      setLabelError(
        "Please upload a JPG, PNG, or WebP image."
      );

      event.target.value = "";
      return;
    }

    const maxFileSize = 5 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setLabelError(
        "The image must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    if (labelPreview) {
      URL.revokeObjectURL(labelPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setLabelImage(file);
    setLabelPreview(previewUrl);
  };

  const removeLabelImage = () => {
    if (labelPreview) {
      URL.revokeObjectURL(labelPreview);
    }

    setLabelImage(null);
    setLabelPreview("");
    setLabelError("");
    setLabelAnalysis("");

    if (labelInputRef.current) {
      labelInputRef.current.value = "";
    }
  };

  const handleAnalyzeLabel = async () => {
    if (!labelImage || analyzingLabel) {
      return;
    }

    try {
      setAnalyzingLabel(true);
      setLabelError("");
      setLabelAnalysis("");

      const uploadData = new FormData();

      uploadData.append(
        "labelImage",
        labelImage
      );

      const response = await api.post(
        "/medicine-label/analyze",
        uploadData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setLabelAnalysis(
        response.data.analysis ||
          "No label information was returned."
      );
    } catch (error) {
      setLabelError(
        error.response?.data?.message ||
          "Failed to analyze the medicine label."
      );
    } finally {
      setAnalyzingLabel(false);
    }
  };

  const parseLabelAnalysis = (analysis) => {
    if (!analysis) {
      return [];
    }

    const lines = analysis
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const sections = [];
    let currentSection = null;

    lines.forEach((line) => {
      const cleanedLine = line
        .replace(/^#{1,6}\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/^---+$/, "")
        .trim();

      if (!cleanedLine) {
        return;
      }

      const isBullet =
        /^[-*•]\s+/.test(cleanedLine);

      const isHeading =
        /^#{1,6}\s+/.test(line) ||
        (
          !isBullet &&
          cleanedLine.endsWith(":")
        ) ||
        (
          !isBullet &&
          /^(medicine details|general uses|common side effects|important warnings|important precautions|storage information|medicine information|safety note|disclaimer)$/i.test(
            cleanedLine
          )
        );

      if (isHeading) {
        const title = cleanedLine
          .replace(/:$/, "")
          .trim();

        currentSection = {
          title,
          items: []
        };

        sections.push(currentSection);

        return;
      }

      if (!currentSection) {
        currentSection = {
          title: "Medicine Information",
          items: []
        };

        sections.push(currentSection);
      }

      const item = cleanedLine
        .replace(/^[-*•]\s+/, "")
        .replace(/^\*\*(.*?)\*\*:\s*/, "$1: ")
        .trim();

      if (item) {
        currentSection.items.push(item);
      }
    });

    return sections;
  };

  const getAnalysisIcon = (title) => {
    const normalizedTitle =
      title.toLowerCase();

    if (
      normalizedTitle.includes("warning") ||
      normalizedTitle.includes("precaution")
    ) {
      return ShieldAlert;
    }

    if (
      normalizedTitle.includes("side effect")
    ) {
      return AlertTriangle;
    }

    if (
      normalizedTitle.includes("use")
    ) {
      return Stethoscope;
    }

    if (
      normalizedTitle.includes("safety") ||
      normalizedTitle.includes("disclaimer")
    ) {
      return ShieldAlert;
    }

    if (
      normalizedTitle.includes("detail") ||
      normalizedTitle.includes("information")
    ) {
      return Info;
    }

    return FileText;
  };

  const getAnalysisTone = (title) => {
    const normalizedTitle =
      title.toLowerCase();

    if (
      normalizedTitle.includes("warning") ||
      normalizedTitle.includes("precaution")
    ) {
      return {
        background: "#fff7ed",
        border: "#fed7aa",
        iconBackground: "#ffedd5",
        iconColor: "#c2410c"
      };
    }

    if (
      normalizedTitle.includes("safety") ||
      normalizedTitle.includes("disclaimer")
    ) {
      return {
        background: "#f8fafc",
        border: "#e2e8f0",
        iconBackground: "#f1f5f9",
        iconColor: "#475569"
      };
    }

    if (
      normalizedTitle.includes("side effect")
    ) {
      return {
        background: "#fffaf5",
        border: "#fde68a",
        iconBackground: "#fef3c7",
        iconColor: "#b45309"
      };
    }

    if (
      normalizedTitle.includes("use")
    ) {
      return {
        background: "#f8fbff",
        border: "#dbeafe",
        iconBackground: "#eff6ff",
        iconColor: "#2563eb"
      };
    }

    return {
      background: "#ffffff",
      border: "#e2e8f0",
      iconBackground: "#f1f5f9",
      iconColor: "#475569"
    };
  };

  const renderLabelAnalysis = () => {
    const sections =
      parseLabelAnalysis(labelAnalysis);

    if (!sections.length) {
      return (
        <div className="medicine-label-analysis-content">
          {labelAnalysis}
        </div>
      );
    }

    return (
      <div
        className="medicine-label-analysis-content"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "16px"
        }}
      >
        {sections.map((section, index) => {
          const Icon =
            getAnalysisIcon(section.title);

          const tone =
            getAnalysisTone(section.title);

          return (
            <section
              key={`${section.title}-${index}`}
              style={{
                overflow: "hidden",
                border: `1px solid ${tone.border}`,
                borderRadius: "11px",
                background: tone.background
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 14px",
                  borderBottom:
                    `1px solid ${tone.border}`
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    flex: "0 0 32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    background:
                      tone.iconBackground,
                    color: tone.iconColor
                  }}
                >
                  <Icon size={16} />
                </div>

                <h4
                  style={{
                    margin: 0,
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: 700
                  }}
                >
                  {section.title}
                </h4>
              </div>

              <div
                style={{
                  padding: "13px 15px"
                }}
              >
                {section.items.map(
                  (item, itemIndex) => {
                    const separatorIndex =
                      item.indexOf(": ");

                    const hasLabel =
                      separatorIndex > 0 &&
                      separatorIndex < 60;

                    if (hasLabel) {
                      const label =
                        item.slice(
                          0,
                          separatorIndex
                        );

                      const value =
                        item.slice(
                          separatorIndex + 2
                        );

                      return (
                        <div
                          key={itemIndex}
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "minmax(110px, 0.35fr) minmax(0, 1fr)",
                            gap: "12px",
                            padding:
                              "8px 0",
                            borderBottom:
                              itemIndex <
                              section.items.length - 1
                                ? "1px solid #e2e8f0"
                                : "none"
                          }}
                        >
                          <span
                            style={{
                              color:
                                "#64748b",
                              fontSize:
                                "12px",
                              fontWeight: 600,
                              lineHeight:
                                1.5
                            }}
                          >
                            {label}
                          </span>

                          <span
                            style={{
                              color:
                                "#334155",
                              fontSize:
                                "12px",
                              lineHeight:
                                1.6
                            }}
                          >
                            {value}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={itemIndex}
                        style={{
                          display: "flex",
                          alignItems:
                            "flex-start",
                          gap: "9px",
                          padding:
                            "7px 0",
                          borderBottom:
                            itemIndex <
                            section.items.length - 1
                              ? "1px solid #e2e8f0"
                              : "none"
                        }}
                      >
                        <span
                          style={{
                            width: "5px",
                            height: "5px",
                            flex:
                              "0 0 5px",
                            marginTop:
                              "7px",
                            borderRadius:
                              "50%",
                            background:
                              tone.iconColor
                          }}
                        />

                        <span
                          style={{
                            color:
                              "#334155",
                            fontSize:
                              "12px",
                            lineHeight:
                              1.6
                          }}
                        >
                          {item}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          );
        })}

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "9px",
            padding: "12px 13px",
            border: "1px solid #dbeafe",
            borderRadius: "10px",
            background: "#eff6ff",
            color: "#475569"
          }}
        >
          <Info
            size={16}
            style={{
              flex: "0 0 auto",
              marginTop: "1px",
              color: "#2563eb"
            }}
          />

          <span
            style={{
              fontSize: "11px",
              lineHeight: 1.55
            }}
          >
            AI-generated information is for general
            educational purposes only. Confirm important
            medicine information with a doctor or
            pharmacist.
          </span>
        </div>
      </div>
    );
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
      setError(
        "Please enter the medicine frequency."
      );
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
      setLoading(true);

      await api.post("/medicines", {
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        times: validTimes,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        instructions: formData.instructions
      });

      setSuccessMessage(
        "Medicine added successfully."
      );

      setFormData({
        name: "",
        dosage: "",
        frequency: "",
        times: [""],
        startDate: "",
        endDate: "",
        instructions: ""
      });

      removeLabelImage();
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to add medicine."
      );
    } finally {
      setLoading(false);
    }
  };

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

            <h2>Add Medicine</h2>

            <p>
              Create a clear medication schedule
              for your daily routine.
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

              <p>{error}</p>
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
                Medicine added
              </strong>

              <p>{successMessage}</p>
            </div>
          </div>
        )}

        <form
          className="medicine-management-card"
          onSubmit={handleSubmit}
          noValidate
        >
          <section className="medicine-management-section medicine-label-reader-section">
            <div className="medicine-management-section-heading">
              <div className="medicine-management-section-icon">
                <ScanLine size={19} />
              </div>

              <div>
                <h3>
                  Read medicine label
                </h3>

                <p>
                  Upload a clear photo of the medicine
                  label to analyze visible information.
                </p>
              </div>
            </div>

            <div className="medicine-label-reader">
              {!labelPreview ? (
                <button
                  type="button"
                  className="medicine-label-upload"
                  onClick={() =>
                    labelInputRef.current?.click()
                  }
                >
                  <div className="medicine-label-upload-icon">
                    <UploadCloud size={24} />
                  </div>

                  <div className="medicine-label-upload-content">
                    <strong>
                      Upload medicine label
                    </strong>

                    <span>
                      Choose a JPG, PNG, or WebP image
                      up to 5 MB.
                    </span>
                  </div>

                  <span className="medicine-label-upload-action">
                    Browse image
                  </span>
                </button>
              ) : (
                <div className="medicine-label-preview">
                  <div className="medicine-label-preview-image">
                    <img
                      src={labelPreview}
                      alt="Selected medicine label preview"
                    />
                  </div>

                  <div className="medicine-label-preview-details">
                    <div className="medicine-label-file-icon">
                      <FileImage size={20} />
                    </div>

                    <div className="medicine-label-file-info">
                      <strong>
                        {labelImage?.name ||
                          "Medicine label image"}
                      </strong>

                      <span>
                        {labelImage
                          ? `${(
                              labelImage.size /
                              (1024 * 1024)
                            ).toFixed(2)} MB`
                          : "Image selected"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="medicine-label-remove"
                      onClick={removeLabelImage}
                      aria-label="Remove medicine label image"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={labelInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLabelImageChange}
                hidden
              />

              {labelError && (
                <div
                  className="medicine-label-error"
                  role="alert"
                >
                  <span>!</span>

                  <p>{labelError}</p>
                </div>
              )}

              <div className="medicine-label-reader-footer">
                <div className="medicine-label-reader-note">
                  <FileText size={15} />

                  <span>
                    AI provides general label information
                    only. Confirm important information
                    with a pharmacist or healthcare
                    professional.
                  </span>
                </div>

                <button
                  type="button"
                  className="medicine-label-analyze"
                  disabled={
                    !labelImage ||
                    analyzingLabel
                  }
                  onClick={handleAnalyzeLabel}
                >
                  <ScanLine
                    size={16}
                    className={
                      analyzingLabel
                        ? "medicine-label-analyze-icon-loading"
                        : ""
                    }
                  />

                  <span>
                    {analyzingLabel
                      ? "Analyzing label..."
                      : "Analyze label"}
                  </span>
                </button>
              </div>

              {labelAnalysis && (
                <div
                  className="medicine-label-analysis"
                  role="status"
                  aria-live="polite"
                >
                  <div className="medicine-label-analysis-header">
                    <div className="medicine-label-analysis-icon">
                      <CheckCircle2 size={17} />
                    </div>

                    <div>
                      <strong>
                        Medicine information
                      </strong>

                      <span>
                        Review the AI-generated information
                        before using it in your medication
                        records.
                      </span>
                    </div>
                  </div>

                  {renderLabelAnalysis()}
                </div>
              )}
            </div>
          </section>

          <div className="medicine-management-divider" />

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
                  Enter the basic information for
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
                  Add each time this medicine should
                  be taken.
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
                  Define when this medication
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
                  Add notes that help you follow
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
              disabled={loading}
            >
              <Save size={17} />

              <span>
                {loading
                  ? "Adding medicine..."
                  : "Add medicine"}
              </span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddMedicine;