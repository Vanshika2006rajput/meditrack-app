import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PatientDashboard from "./pages/PatientDashboard";
import CaregiverDashboard from "./pages/CaregiverDashboard";
import AddMedicine from "./pages/AddMedicine";
import EditMedicine from "./pages/EditMedicine";
import Medicines from "./pages/Medicines";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/medicines"
          element={
            <ProtectedRoute allowedRole="patient">
              <Medicines />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/history"
          element={
            <ProtectedRoute allowedRole="patient">
              <History />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute allowedRole="patient">
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/settings"
          element={
            <ProtectedRoute allowedRole="patient">
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-medicine"
          element={
            <ProtectedRoute allowedRole="patient">
              <AddMedicine />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-medicine/:id"
          element={
            <ProtectedRoute allowedRole="patient">
              <EditMedicine />
            </ProtectedRoute>
          }
        />

        <Route
          path="/caregiver"
          element={
            <ProtectedRoute allowedRole="caregiver">
              <CaregiverDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;