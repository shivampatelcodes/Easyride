/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getAuth,
  signOut,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import Navbar from "../components/Navbar";
import { ThemeContext } from "../context/ThemeContext";
import DeleteAccountModal from "../components/DeleteAccountModal";

const auth = getAuth();
const db = getFirestore();

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState({
    fullName: "",
    phone: "",
    address: "",
    email: "",
  });
  const [role, setRole] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const location = useLocation();

  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDetails({
            fullName: data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
          });
          setRole(data.role || "");
        }
      }
      setLoading(false);
    };
    fetchUserDetails();
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      setAlertMessage(location.state.message);
    }
  }, [location]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/signin");
  };

  const handleChange = (e) => {
    setDetails({
      ...details,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          fullName: details.fullName,
          phone: details.phone,
          address: details.address,
        });
        navigate("/dashboard");
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }
  };

  const handleDeleteAccount = async ({
    email: inputEmail,
    password: inputPassword,
  }) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const credential = EmailAuthProvider.credential(
          user.email,
          inputPassword
        );
        await reauthenticateWithCredential(user, credential);
        await deleteDoc(doc(db, "users", user.uid));
        await deleteUser(user);
        setIsDeleteModalOpen(false);
        navigate("/signup");
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Error deleting account. Please try again or contact support.");
      }
    }
  };

  const dismissAlert = () => {
    setAlertMessage("");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
              Profile
            </h2>
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={details.fullName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={details.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={details.address}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-md hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-md transform transition hover:-translate-y-0.5"
              >
                Save Changes
              </button>
            </form>
          </div>
        );
      case "account":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
              Account Settings
            </h2>
            <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
                Display Preferences
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300">
                  Dark Mode
                </span>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    theme === "dark" ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                      theme === "dark" ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        );
      case "privacy":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
              Privacy
            </h2>
            <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
                Data Privacy
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your data privacy is important to us. We only collect
                information necessary to provide you with our service.
              </p>
              <h3 className="text-lg font-medium mb-2 mt-6 text-gray-800 dark:text-gray-200">
                Delete Your Account
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Permanently delete your account and all associated data.
              </p>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Account
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
              General Settings
            </h2>
            <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-300">
                Welcome to your settings dashboard. Use the options on the left
                to manage your account preferences.
              </p>
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">
                  Account Information
                </h3>
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Email:
                    </span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {details.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Name:
                    </span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {details.fullName || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Role:
                    </span>
                    <span className="text-gray-800 dark:text-gray-200 capitalize">
                      {role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <Navbar role={role} setRole={setRole} />

      {/* Alert Banner - only shows when there's a message */}
      {alertMessage && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{alertMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={dismissAlert}
                  className="inline-flex rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Header - updated z-index */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1512758017271-d7b84c2113f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"
            className="w-full h-full object-cover"
            alt="Settings background"
          />
        </div>
        <div className="container mx-auto px-6 py-10 relative z-10">
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-xl opacity-90">
            Manage your profile and preferences
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Mobile Settings Options Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowMobileOptions(true)}
            className="w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md"
          >
            Show Settings Options
          </button>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex lg:space-x-6">
          <aside className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                Settings
              </h2>
              <ul className="space-y-4">
                <li>
                  <button
                    onClick={() => setActiveTab("general")}
                    className={`w-full flex items-center text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === "general"
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    General
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full flex items-center text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === "profile"
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("account")}
                    className={`w-full flex items-center text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === "account"
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Account Settings
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("privacy")}
                    className={`w-full flex items-center text-left px-4 py-2 rounded-lg transition-colors ${
                      activeTab === "privacy"
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Privacy
                  </button>
                </li>
              </ul>
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </aside>
          <section className="lg:w-3/4 bg-white dark:bg-gray-800 shadow rounded-xl p-6">
            {renderContent()}
          </section>
        </div>

        {/* Mobile Content */}
        <div className="lg:hidden">
          <section className="bg-white dark:bg-gray-800 shadow rounded-xl p-6">
            {renderContent()}
          </section>
        </div>
      </div>

      {/* Mobile Options Overlay */}
      {showMobileOptions && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-800 p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Settings Options
          </h2>
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => {
                  setActiveTab("general");
                  setShowMobileOptions(false);
                }}
                className="w-full flex items-center text-left px-4 py-2 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                General
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab("profile");
                  setShowMobileOptions(false);
                }}
                className="w-full flex items-center text-left px-4 py-2 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profile
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab("account");
                  setShowMobileOptions(false);
                }}
                className="w-full flex items-center text-left px-4 py-2 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Account Settings
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setActiveTab("privacy");
                  setShowMobileOptions(false);
                }}
                className="w-full flex items-center text-left px-4 py-2 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Privacy
              </button>
            </li>
          </ul>
          <button
            onClick={() => setShowMobileOptions(false)}
            className="mt-6 w-full px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      )}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        userEmail={details.email}
        onCancel={() => setIsDeleteModalOpen(false)}
        onDelete={handleDeleteAccount}
      />
    </div>
  );
};

export default Settings;
