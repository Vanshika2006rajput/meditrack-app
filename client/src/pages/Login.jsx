import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  LockKeyhole,
  Mail,
  Pill,
  ShieldCheck
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user = await login(
        formData.email,
        formData.password
      );

      if (user.role === "patient") {
        navigate("/patient");
      } else if (user.role === "caregiver") {
        navigate("/caregiver");
      } else {
        setError("Your account has an unsupported role.");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed. Please try again."
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
              Stay on track with your medication.
            </h1>

            <p className="login-brand-description">
              A focused medicine companion designed to
              help patients manage schedules, track doses,
              and stay connected with caregivers.
            </p>

            <div className="login-trust-list">
              <div className="login-trust-item">
                <div className="login-trust-icon">
                  <Activity size={19} />
                </div>

                <div>
                  <strong>
                    Clear medication tracking
                  </strong>

                  <span>
                    Keep scheduled and completed doses
                    organized in one place.
                  </span>
                </div>
              </div>

              <div className="login-trust-item">
                <div className="login-trust-icon">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <strong>
                    Patient and caregiver access
                  </strong>

                  <span>
                    Keep medication information connected
                    between patients and caregivers.
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
                WELCOME BACK
              </span>

              <h2 className="login-card-title">
                Sign in to MediCare
              </h2>

              <p className="login-card-description">
                Access your medication dashboard and
                continue managing your daily schedule.
              </p>
            </div>

            {error && (
              <div
                className="login-error"
                role="alert"
              >
                <ShieldCheck size={17} />
                <span>{error}</span>
              </div>
            )}

            <form
              className="login-form"
              onSubmit={handleSubmit}
            >
              <div className="login-field">
                <label
                  className="login-label"
                  htmlFor="email"
                >
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
                <label
                  className="login-label"
                  htmlFor="password"
                >
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
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button
                className="login-submit"
                type="submit"
                disabled={loading}
              >
                <span>
                  {loading ? "Signing in..." : "Sign in"}
                </span>

                {!loading && (
                  <ArrowRight size={18} />
                )}
              </button>
            </form>

            <div className="login-security-note">
              <ShieldCheck size={16} />

              <span>
                Sign in securely to access your account.
              </span>
            </div>

            <p className="signup-login-link">
              Don't have an account?{" "}
              <Link to="/signup">
                Create account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;