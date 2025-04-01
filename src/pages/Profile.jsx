/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const auth = getAuth(app);
const db = getFirestore(app);

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [stats, setStats] = useState({
    totalRides: 0,
    upcomingRides: 0,
    completedRides: 0,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate("/signin");
          return;
        }

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
          setError("User profile not found");
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        setUser({ id: currentUser.uid, ...userData });
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: currentUser.email || "",
          phone: userData.phone || "",
          role: userData.role || "",
          address: userData.address || "",
        });

        // Fetch user stats
        if (userData.role === "passenger") {
          await fetchPassengerStats(currentUser.uid);
        } else if (userData.role === "driver") {
          await fetchDriverStats(currentUser.uid);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const fetchPassengerStats = async (userId) => {
    try {
      const bookingsQuery = query(
        collection(db, "bookings"),
        where("passengerId", "==", userId)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);

      let totalRides = 0;
      let upcomingRides = 0;
      let completedRides = 0;

      const now = new Date();

      bookingsSnapshot.forEach((doc) => {
        const booking = doc.data();
        totalRides++;

        if (booking.status === "completed") {
          completedRides++;
        }

        if (booking.rideDate && new Date(booking.rideDate.toDate()) > now) {
          upcomingRides++;
        }
      });

      setStats({
        totalRides,
        upcomingRides,
        completedRides,
      });
    } catch (error) {
      console.error("Error fetching passenger stats:", error);
    }
  };

  const fetchDriverStats = async (userId) => {
    try {
      const ridesQuery = query(
        collection(db, "rides"),
        where("driverId", "==", userId)
      );
      const ridesSnapshot = await getDocs(ridesQuery);

      let totalRides = 0;
      let upcomingRides = 0;
      let completedRides = 0;

      const now = new Date();

      ridesSnapshot.forEach((doc) => {
        const ride = doc.data();
        totalRides++;

        if (ride.status === "completed") {
          completedRides++;
        }

        if (ride.date && new Date(ride.date.toDate()) > now) {
          upcomingRides++;
        }
      });

      setStats({
        totalRides,
        upcomingRides,
        completedRides,
      });
    } catch (error) {
      console.error("Error fetching driver stats:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await updateDoc(doc(db, "users", user.id), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
      });

      setUser((prev) => ({
        ...prev,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
      }));

      setSuccessMessage("Profile updated successfully");
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar role={user?.role || "passenger"} setRole={() => {}} />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar role={user?.role || "passenger"} setRole={() => {}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Profile
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage your personal information and account preferences
          </p>
        </div>

        {error && (
          <div
            className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 dark:bg-red-900/30 dark:text-red-300"
            role="alert"
          >
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div
            className="mb-6 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 dark:bg-green-900/30 dark:text-green-300"
            role="alert"
          >
            <p>{successMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Stats Card */}
          <div className="col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Profile Summary
                </h2>
              </div>
              <div className="p-6">
                {/* Profile Avatar */}
                <div className="flex justify-center mb-6">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                    {user?.firstName?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.role === "driver" ? "Driver" : "Passenger"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {user?.email}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.totalRides}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Total Rides
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.upcomingRides}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Upcoming
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.completedRides}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Completed
                    </p>
                  </div>
                </div>

                {/* Account Status */}
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Active Account
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Edit Card */}
          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-5 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Personal Information
                </h2>
                {!editing ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <svg
                      className="h-4 w-4 mr-1.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={!editing}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          !editing ? "bg-gray-100 dark:bg-gray-800" : ""
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!editing}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          !editing ? "bg-gray-100 dark:bg-gray-800" : ""
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        disabled
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!editing}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          !editing ? "bg-gray-100 dark:bg-gray-800" : ""
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="role"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Account Type
                      </label>
                      <input
                        type="text"
                        name="role"
                        id="role"
                        value={
                          formData.role === "driver" ? "Driver" : "Passenger"
                        }
                        disabled
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        id="address"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={!editing}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          !editing ? "bg-gray-100 dark:bg-gray-800" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {editing && (
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
