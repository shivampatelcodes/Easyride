/* eslint-disable no-unused-vars */
import { useContext } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import SignUp from "./pages/Register";
import SignIn from "./pages/Login";
import PassengerDashboard from "./pages/Dashboard";
import SearchResults from "./pages/SearchResults";
import DriverDashboard from "./pages/DriverDashboard";
import ManageBookingsPage from "./pages/ManageBookingsPage";
import Settings from "./pages/Settings";
import ProfileCompleteRoute from "./components/ProfileCompleteRoute";
import Profile from "./pages/Profile";
import PassengerBookingsPage from "./pages/PassengerBookingsPage";
import RoleRoute from "./components/RoleRoute";
import VerifyEmail from "./pages/VerifyEmail";
import VerifiedRoute from "./components/VerifiedRoute";
import AdminDashboard from "./pages/AdminDashboard"; // Add this import

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* All protected routes must pass through VerifiedRoute */}
        <Route
          path="/dashboard"
          element={
            <VerifiedRoute>
              <ProfileCompleteRoute>
                <RoleRoute allowedRoles={["passenger"]}>
                  <PassengerDashboard />
                </RoleRoute>
              </ProfileCompleteRoute>
            </VerifiedRoute>
          }
        />

        <Route
          path="/driver-dashboard"
          element={
            <VerifiedRoute>
              <ProfileCompleteRoute>
                <RoleRoute allowedRoles={["driver"]}>
                  <DriverDashboard />
                </RoleRoute>
              </ProfileCompleteRoute>
            </VerifiedRoute>
          }
        />

        <Route
          path="/manage-bookings"
          element={
            <VerifiedRoute>
              <ManageBookingsPage />
            </VerifiedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <VerifiedRoute>
              <Profile />
            </VerifiedRoute>
          }
        />

        <Route
          path="/passenger-bookings"
          element={
            <VerifiedRoute>
              <PassengerBookingsPage />
            </VerifiedRoute>
          }
        />

        <Route
          path="/search-results"
          element={
            <VerifiedRoute>
              <SearchResults />
            </VerifiedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <VerifiedRoute>
              <Settings />
            </VerifiedRoute>
          }
        />

        {/* Admin Dashboard Route */}
        <Route
          path="/admin-dashboard"
          element={
            <VerifiedRoute>
              <AdminDashboard />
            </VerifiedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
