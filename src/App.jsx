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

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />

        {/* Passenger Dashboard: Only allowed for "passenger" */}
        <Route
          path="/dashboard"
          element={
            <ProfileCompleteRoute>
              <RoleRoute allowedRoles={["passenger"]}>
                <PassengerDashboard />
              </RoleRoute>
            </ProfileCompleteRoute>
          }
        />

        {/* Driver Dashboard: Only allowed for "driver" */}
        <Route
          path="/driver-dashboard"
          element={
            <ProfileCompleteRoute>
              <RoleRoute allowedRoles={["driver"]}>
                <DriverDashboard />
              </RoleRoute>
            </ProfileCompleteRoute>
          }
        />
        <Route path="/search-results" element={<SearchResults />} />
        <Route path="/manage-bookings" element={<ManageBookingsPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/passenger-bookings" element={<PassengerBookingsPage />} />
        {/* Redirect the default route to /dashboard so that ProfileCompleteRoute applies */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
