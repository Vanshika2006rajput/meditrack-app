import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({
  children,
  allowedRole
}) => {
  const {
    user,
    loading
  } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>

        <p>
          Checking your session...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    allowedRole &&
    user.role !== allowedRole
  ) {
    if (
      user.role === "patient"
    ) {
      return (
        <Navigate
          to="/patient"
          replace
        />
      );
    }

    if (
      user.role === "caregiver"
    ) {
      return (
        <Navigate
          to="/caregiver"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;