/* eslint-disable no-unused-vars */
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
import DeleteAccountModal from "../components/DeleteAccountModal"; // New import

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

  // Handler to delete the account after confirmation.
  const handleDeleteAccount = async ({
    email: inputEmail,
    password: inputPassword,
  }) => {
    const user = auth.currentUser;
    if (user) {
      try {
        // Reauthenticate the user with provided credentials.
        const credential = EmailAuthProvider.credential(
          user.email,
          inputPassword
        );
        await reauthenticateWithCredential(user, credential);
        // Delete the user's Firestore document.
        await deleteDoc(doc(db, "users", user.uid));
        // Delete the user from Firebase Auth.
        await deleteUser(user);
        setIsDeleteModalOpen(false);
        navigate("/signup");
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Error deleting account. Please try again or contact support.");
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Profile</h2>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-900"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={details.fullName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={details.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={details.address}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Save Changes
              </button>
            </form>
          </div>
        );
      case "account":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
            <p>This section is under construction.</p>
          </div>
        );
      case "privacy":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Privacy</h2>
            <p>This section is under construction.</p>
          </div>
        );
      default:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">General Settings</h2>
            <p>Select an option from the list.</p>
          </div>
        );
    }
  };

  const mobileOptionsOverlay = (
    <div className="fixed inset-0 z-50 flex flex-col bg-white p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Settings Options</h2>
      <ul className="space-y-4">
        <li>
          <button
            onClick={() => {
              setActiveTab("general");
              setShowMobileOptions(false);
            }}
            className="w-full text-left px-4 py-2 text-blue-500 hover:underline focus:outline-none"
          >
            General Settings
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              setActiveTab("profile");
              setShowMobileOptions(false);
            }}
            className="w-full text-left px-4 py-2 text-blue-500 hover:underline focus:outline-none"
          >
            Profile
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              setActiveTab("account");
              setShowMobileOptions(false);
            }}
            className="w-full text-left px-4 py-2 text-blue-500 hover:underline focus:outline-none"
          >
            Account Settings
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              setActiveTab("privacy");
              setShowMobileOptions(false);
            }}
            className="w-full text-left px-4 py-2 text-blue-500 hover:underline focus:outline-none"
          >
            Privacy
          </button>
        </li>
        <li>
          <button
            onClick={() => {
              setIsDeleteModalOpen(true);
              setShowMobileOptions(false);
            }}
            className="w-full text-left px-4 py-2 text-red-500 hover:underline focus:outline-none"
          >
            Delete Account
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
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
      <Navbar role={role} setRole={setRole} />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="lg:hidden">
          <button
            onClick={() => setShowMobileOptions(true)}
            className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Show Settings Options
          </button>
        </div>
        <div className="hidden lg:flex lg:space-x-6">
          <aside className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-800 shadow rounded-md p-6">
              <h2 className="text-xl font-bold mb-4">Settings</h2>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full text-left text-blue-500 hover:underline focus:outline-none ${
                      activeTab === "profile" ? "font-bold" : ""
                    }`}
                  >
                    Profile
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("account")}
                    className={`w-full text-left text-blue-500 hover:underline focus:outline-none ${
                      activeTab === "account" ? "font-bold" : ""
                    }`}
                  >
                    Account Settings
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("privacy")}
                    className={`w-full text-left text-blue-500 hover:underline focus:outline-none ${
                      activeTab === "privacy" ? "font-bold" : ""
                    }`}
                  >
                    Privacy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="w-full text-left text-red-500 hover:underline focus:outline-none"
                  >
                    Delete Account
                  </button>
                </li>
              </ul>
              <div className="mt-6">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </aside>
          <section className="lg:w-3/4 bg-white dark:bg-gray-800 shadow rounded-md p-6">
            {renderContent()}
          </section>
        </div>
        <div className="lg:hidden">
          <section className="bg-white dark:bg-gray-800 shadow rounded-md p-6">
            {renderContent()}
          </section>
        </div>
      </div>
      {showMobileOptions && mobileOptionsOverlay}
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
