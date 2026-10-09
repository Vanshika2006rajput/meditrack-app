import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  Pill,
  ShieldCheck,
  UserRound
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient"
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await register(formData);

      setSuccess(
        "Your account has been created. Redirecting to sign in..."
      );

      setTimeout(() => {
        navigate("/login", {
          state: {
            registeredEmail: formData.email.trim().toLowerCase()
          }
        });
      }, 1200);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Account creation failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-brand-panel">
          <div className="login-brand-content">
            <div className="login-logo">
              <Pill size={24} strokeWidth={2.2} />
            </div>

            <span className="login-brand-kicker">
              MEDICATION MANAGEMENT
            </span>

            <h1 className="login-brand-title">
              Take control of your medication routine.
            </h1>

            <p className="login-brand-description">
              Create your MediCare account to organize medication
              schedules, track doses, and stay connected with care.
            </p>

            <div className="login-trust-list">
              <div className="login-trust-item">
                <div className="login-trust-icon">
                  <UserRound size={19} />
                </div>

                <div>
                  <strong>Personal medication management</strong>
                  <span>
                    Manage your own medication schedule in one place.
                  </span>
                </div>
              </div>

              <div className="login-trust-item">
                <div className="login-trust-icon">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <strong>Patient and caregiver accounts</strong>
                  <span>
                    Choose the account type that matches your needs.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="login-footer-note">
            MediCare Medicine Companion
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-card">
            <div className="login-card-header">
              <div className="login-card-icon">
                <Pill size={22} />
              </div>

              <span className="login-card-eyebrow">
                CREATE YOUR ACCOUNT
              </span>

              <h2 className="login-card-title">
                Join MediCare
              </h2>

              <p className="login-card-description">
                Enter your details to create your personal account.
              </p>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <ShieldCheck size={17} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="signup-success" role="status">
                {success}
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label className="login-label" htmlFor="name">
                  Full name
                </label>

                <div className="login-input-wrap">
                  <UserRound size={18} />

                  <input
                    className="login-input"
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="email">
                  Email address
                </label>

                <div className="login-input-wrap">
                  <Mail size={18} />

                  <input
                    className="login-input"
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="password">
                  Password
                </label>

                <div className="login-input-wrap">
                  <LockKeyhole size={18} />

                  <input
                    className="login-input"
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>

                <span className="signup-field-hint">
                  Use at least 8 characters.
                </span>
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="role">
                  Account type
                </label>

                <select
                  className="login-input signup-role-select"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="patient">Patient / User</option>
                  <option value="caregiver">Caregiver</option>
                </select>
              </div>

              <button
                className="login-submit"
                type="submit"
                disabled={loading}
              >
                <span>
                  {loading ? "Creating account..." : "Create account"}
                </span>

                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="login-security-note">
              <ShieldCheck size={16} />

              <span>
                Your password is securely hashed before storage.
              </span>
            </div>

            <p className="signup-login-link">
              Already have an account?{" "}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Signup;