import {
  ArrowLeft,
  BadgeCheck,
  Mail,
  ShieldCheck,
  User,
  UserRound
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const displayRole =
    user?.role === "patient"
      ? "Patient"
      : "Caregiver";

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-brand">
          <div className="profile-brand-icon">
            <UserRound
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

        <div className="profile-header-status">
          <ShieldCheck size={16} />

          <span>
            Account information
          </span>
        </div>
      </header>

      <main className="profile-main">
        <div className="profile-heading">
          <div>
            <span className="profile-eyebrow">
              ACCOUNT INFORMATION
            </span>

            <h2>
              My Profile
            </h2>

            <p>
              View your MediCare account details
              and account security information.
            </p>
          </div>
        </div>

        <section className="profile-hero-card">
          <div className="profile-avatar">
            {initials}
          </div>

          <div className="profile-hero-details">
            <span className="profile-hero-label">
              Signed in as
            </span>

            <h3>
              {user?.name || "User"}
            </h3>

            <div className="profile-hero-meta">
              <Mail size={15} />

              <span>
                {user?.email || "Email not available"}
              </span>
            </div>
          </div>

          <div className="profile-role-badge">
            <BadgeCheck size={15} />

            <span>
              {displayRole}
            </span>
          </div>
        </section>

        <div className="profile-grid">
          <section className="profile-card">
            <div className="profile-card-header">
              <div className="profile-card-icon">
                <User size={19} />
              </div>

              <div>
                <h3>
                  Personal information
                </h3>

                <p>
                  Your registered account details.
                </p>
              </div>
            </div>

            <div className="profile-details">
              <div className="profile-detail-row">
                <div className="profile-detail-icon">
                  <User size={16} />
                </div>

                <div>
                  <span>
                    Full name
                  </span>

                  <strong>
                    {user?.name ||
                      "Not available"}
                  </strong>
                </div>
              </div>

              <div className="profile-detail-row">
                <div className="profile-detail-icon">
                  <Mail size={16} />
                </div>

                <div>
                  <span>
                    Email address
                  </span>

                  <strong>
                    {user?.email ||
                      "Not available"}
                  </strong>
                </div>
              </div>

              <div className="profile-detail-row">
                <div className="profile-detail-icon">
                  <BadgeCheck size={16} />
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
          </section>

          <section className="profile-card">
            <div className="profile-card-header">
              <div className="profile-card-icon profile-card-icon-security">
                <ShieldCheck size={19} />
              </div>

              <div>
                <h3>
                  Account security
                </h3>

                <p>
                  Information about your signed-in
                  account.
                </p>
              </div>
            </div>

            <div className="profile-security-panel">
              <div className="profile-security-icon">
                <ShieldCheck size={21} />
              </div>

              <div>
                <strong>
                  Authenticated account
                </strong>

                <p>
                  You are currently signed in to
                  your MediCare account.
                </p>
              </div>
            </div>

            <div className="profile-security-row">
              <span>
                Current role
              </span>

              <strong>
                {displayRole}
              </strong>
            </div>

            <div className="profile-security-row">
              <span>
                Account status
              </span>

              <span className="profile-status">
                <span className="profile-status-dot" />
                Active
              </span>
            </div>
          </section>
        </div>

        <div className="profile-footer">
          <button
            className="profile-secondary-button"
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

export default Profile;