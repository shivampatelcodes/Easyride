/* eslint-disable no-unused-vars */
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
import AdminDashboard from "./pages/AdminDashboard";
import ChatProvider from "./context/ChatContext"; // Import ChatProvider
import ChatList from "./pages/ChatList"; // Import ChatList page
import ChatWindow from "./pages/ChatWindow"; // Import ChatWindow page

const App = () => {
  return (
    <ChatProvider>
      <Router>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* All protected routes require both authentication and email verification */}
          <Route path="/" element={<Navigate replace to="/dashboard" />} />

          {/* Add chat routes */}
          <Route
            path="/chats"
            element={
              <VerifiedRoute>
                <ChatList />
              </VerifiedRoute>
            }
          />

          <Route
            path="/chats/:id"
            element={
              <VerifiedRoute>
                <ChatWindow />
              </VerifiedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <VerifiedRoute>
                <RoleRoute allowedRoles={["passenger"]}>
                  <PassengerDashboard />
                </RoleRoute>
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
                <RoleRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </RoleRoute>
              </VerifiedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ChatProvider>
  );
};

export default App;
