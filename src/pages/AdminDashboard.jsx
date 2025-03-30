/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import ConfirmationModal from "../components/ConfirmationModal";

const auth = getAuth(app);
const db = getFirestore(app);

const AdminDashboard = () => {
  const navigate = useNavigate();

  // State variables
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [cities, setCities] = useState([]);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalRides: 0,
    totalBookings: 0,
    activeUsers: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    disputeCount: 0,
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // City management state
  const [newCity, setNewCity] = useState("");
  const [cityToRemove, setCityToRemove] = useState("");

  // Platform settings state
  const [platformSettings, setPlatformSettings] = useState({
    commissionRate: 10,
    verificationRequired: true,
    maxActiveRides: 5,
    minRidePrice: 5,
    platformName: "EasyRide",
    supportEmail: "support@easyride.com",
  });

  // Notification state
  const [notification, setNotification] = useState({
    title: "",
    message: "",
    recipients: "all", // all, drivers, passengers
  });

  const [error, setError] = useState(null);

  // Fetch all required data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchUsers(),
          fetchRides(),
          fetchBookings(),
          fetchCities(),
          fetchDisputes(),
          fetchSettings(),
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Compute statistics whenever data changes
  useEffect(() => {
    calculateStatistics();
  }, [users, rides, bookings, disputes]);

  // Data fetching functions
  const fetchUsers = async () => {
    const usersQuery = query(collection(db, "users"));
    const usersSnapshot = await getDocs(usersQuery);
    const usersData = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsers(usersData);
    return usersData;
  };

  const fetchRides = async () => {
    const ridesQuery = query(collection(db, "rides"), orderBy("date", "desc"));
    const ridesSnapshot = await getDocs(ridesQuery);
    const ridesData = ridesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setRides(ridesData);
    return ridesData;
  };

  const fetchBookings = async () => {
    const bookingsQuery = query(collection(db, "bookings"));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookingsData = bookingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setBookings(bookingsData);
    return bookingsData;
  };

  const fetchCities = async () => {
    try {
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries/cities",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: "Canada" }),
        }
      );
      const data = await response.json();
      if (data && data.data) {
        setCities(data.data.sort());
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const fetchDisputes = async () => {
    // Simulated disputes
    const mockDisputes = [
      {
        id: "dispute1",
        passengerEmail: "passenger@example.com",
        driverEmail: "driver@example.com",
        reason: "Driver didn't show up",
        status: "pending",
        createdAt: Timestamp.fromDate(new Date(Date.now() - 86400000)),
        rideId: "ride123",
      },
      {
        id: "dispute2",
        passengerEmail: "passenger2@example.com",
        driverEmail: "driver2@example.com",
        reason: "Passenger was rude",
        status: "resolved",
        createdAt: Timestamp.fromDate(new Date(Date.now() - 172800000)),
        rideId: "ride456",
      },
    ];
    setDisputes(mockDisputes);
    return mockDisputes;
  };

  const fetchSettings = async () => {
    // For now, using local state as mock settings
    return platformSettings;
  };

  // Calculate dashboard statistics
  const calculateStatistics = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const activeUsers = users.filter((user) => {
      return (
        user.lastActive &&
        new Date(user.lastActive.seconds * 1000) > thirtyDaysAgo
      );
    }).length;

    const pendingBookings = bookings.filter(
      (booking) => booking.status === "Pending"
    ).length;

    const totalRevenue = rides.reduce((sum, ride) => {
      const ridePrice = parseFloat(ride.price) || 0;
      const rideBookings = bookings.filter(
        (b) => b.rideId === ride.id && b.status === "Accepted"
      ).length;
      return (
        sum + ridePrice * rideBookings * (platformSettings.commissionRate / 100)
      );
    }, 0);

    setStatistics({
      totalUsers: users.length,
      totalRides: rides.length,
      totalBookings: bookings.length,
      activeUsers: activeUsers || Math.round(users.length * 0.7),
      pendingBookings,
      totalRevenue: totalRevenue.toFixed(2),
      disputeCount: disputes.length,
    });
  };

  // User management functions
  const handleVerifyUser = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), { verified: true });
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, verified: true } : user
        )
      );
      setModalMessage("User successfully verified!");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error verifying user:", error);
      setModalMessage("Error verifying user. Please try again.");
      setIsModalOpen(true);
    }
  };

  const handleBlockUser = async (userId) => {
    setSelectedUser(userId);
    setConfirmAction(() => async () => {
      try {
        await updateDoc(doc(db, "users", userId), { blocked: true });
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, blocked: true } : user
          )
        );
        setModalMessage("User has been blocked.");
        setIsModalOpen(true);
      } catch (error) {
        console.error("Error blocking user:", error);
        setModalMessage("Error blocking user. Please try again.");
        setIsModalOpen(true);
      }
      setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  const handleUnblockUser = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), { blocked: false });
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, blocked: false } : user
        )
      );
      setModalMessage("User has been unblocked.");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error unblocking user:", error);
      setModalMessage("Error unblocking user. Please try again.");
      setIsModalOpen(true);
    }
  };

  const handleDeleteUser = async (userId) => {
    setSelectedUser(userId);
    setConfirmAction(() => async () => {
      try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(users.filter((user) => user.id !== userId));
        setModalMessage("User has been deleted.");
        setIsModalOpen(true);
      } catch (error) {
        console.error("Error deleting user:", error);
        setModalMessage("Error deleting user. Please try again.");
        setIsModalOpen(true);
      }
      setIsConfirmModalOpen(false);
    });
    setIsConfirmModalOpen(true);
  };

  // City management functions
  const handleAddCity = async () => {
    if (!newCity.trim()) {
      setModalMessage("Please enter a city name.");
      setIsModalOpen(true);
      return;
    }
    if (!cities.includes(newCity)) {
      setCities([...cities, newCity].sort());
      setModalMessage(`${newCity} has been added to the cities list.`);
      setIsModalOpen(true);
      setNewCity("");
    } else {
      setModalMessage(`${newCity} is already in the cities list.`);
      setIsModalOpen(true);
    }
  };

  const handleRemoveCity = async () => {
    if (!cityToRemove) {
      setModalMessage("Please select a city to remove.");
      setIsModalOpen(true);
      return;
    }
    const cityInUse = rides.some(
      (ride) =>
        ride.origin === cityToRemove || ride.destination === cityToRemove
    );
    if (cityInUse) {
      setModalMessage(
        `Cannot remove ${cityToRemove} as it's used in active rides.`
      );
      setIsModalOpen(true);
      return;
    }
    setCities(cities.filter((city) => city !== cityToRemove));
    setModalMessage(`${cityToRemove} has been removed from the cities list.`);
    setIsModalOpen(true);
    setCityToRemove("");
  };

  // Settings management
  const handleSaveSettings = async () => {
    setModalMessage("Platform settings have been updated.");
    setIsModalOpen(true);
  };

  // Notification functions
  const handleSendNotification = async () => {
    if (!notification.title || !notification.message) {
      setModalMessage(
        "Please provide both title and message for the notification."
      );
      setIsModalOpen(true);
      return;
    }
    try {
      let recipientIds = [];
      if (notification.recipients === "all") {
        recipientIds = users.map((user) => user.id);
      } else {
        recipientIds = users
          .filter((user) => user.role === notification.recipients)
          .map((user) => user.id);
      }
      const notificationPromises = recipientIds.map((userId) => {
        return addDoc(collection(db, "notifications"), {
          recipient: userId,
          title: notification.title,
          text: notification.message,
          time: Timestamp.now(),
          status: "unread",
          link: "/dashboard", // Default link for admin
          type: "admin_notification",
        });
      });
      await Promise.all(notificationPromises);
      setModalMessage(`Notification sent to ${recipientIds.length} users!`);
      setIsModalOpen(true);
      setNotification({
        title: "",
        message: "",
        recipients: "all",
      });
    } catch (error) {
      console.error("Error sending notifications:", error);
      setModalMessage("Error sending notifications. Please try again.");
      setIsModalOpen(true);
    }
  };

  // Dispute management
  const handleResolveDispute = async (disputeId, resolution) => {
    setDisputes(
      disputes.map((dispute) =>
        dispute.id === disputeId
          ? { ...dispute, status: "resolved", resolution }
          : dispute
      )
    );
    setModalMessage("Dispute has been resolved.");
    setIsModalOpen(true);
  };

  // Filtering functions for users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = userFilter === "all" || user.role === userFilter;
    return matchesSearch && matchesFilter;
  });

  // Filtering functions for rides
  const filteredRides = rides.filter((ride) => {
    let matchesDate = true;
    if (dateRange !== "all") {
      const rideDate = new Date(ride.date.seconds * 1000);
      const now = new Date();
      if (dateRange === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        matchesDate = rideDate >= today;
      } else if (dateRange === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = rideDate >= weekAgo;
      } else if (dateRange === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        matchesDate = rideDate >= monthAgo;
      }
    }
    const matchesCity =
      cityFilter === "" ||
      ride.origin === cityFilter ||
      ride.destination === cityFilter;
    return matchesDate && matchesCity;
  });

  // Filtering functions for bookings
  const filteredBookings = bookings.filter((booking) => {
    return statusFilter === "all" || booking.status === statusFilter;
  });

  // Simple analytics display instead of charts
  const renderAnalyticsSummary = () => {
    const totalRidesCount = rides.length;
    const totalBookingsCount = bookings.length;
    const totalRevenue = statistics.totalRevenue;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
          Platform Analytics Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
            <h4 className="font-medium text-indigo-700 dark:text-indigo-300">
              Total Rides
            </h4>
            <p className="text-2xl font-bold">{totalRidesCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalRidesCount > 0
                ? `Latest: ${formatDate(rides[0]?.date)}`
                : "No rides yet"}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
            <h4 className="font-medium text-purple-700 dark:text-purple-300">
              Total Bookings
            </h4>
            <p className="text-2xl font-bold">{totalBookingsCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalBookingsCount > 0
                ? `Pending: ${statistics.pendingBookings}`
                : "No bookings yet"}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <h4 className="font-medium text-green-700 dark:text-green-300">
              Platform Revenue
            </h4>
            <p className="text-2xl font-bold">${totalRevenue}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Commission Rate: {platformSettings.commissionRate}%
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render helper function for dates
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <Navbar role={role} setRole={setRole} />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"
            className="w-full h-full object-cover"
            alt="Admin dashboard background"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = "none";
            }}
          />
        </div>
        <div className="container mx-auto px-6 py-12 relative z-10">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-xl opacity-90">
            Manage users, monitor platform activity, and keep EasyRide running
            smoothly.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="flex overflow-x-auto">
            {[
              "overview",
              "users",
              "rides",
              "locations",
              "notifications",
              "trust",
              "settings",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab
                    ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6 flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                    {/* SVG icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-600 dark:text-blue-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      Total Users
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {statistics.totalUsers}
                    </p>
                  </div>
                </div>
              </div>
              {/* Active Users */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6 flex items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-600 dark:text-green-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      Active Users
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {statistics.activeUsers}
                    </p>
                  </div>
                </div>
              </div>
              {/* Total Rides */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6 flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-600 dark:text-purple-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      Total Rides
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {statistics.totalRides}
                    </p>
                  </div>
                </div>
              </div>
              {/* Pending Bookings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6 flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-yellow-600 dark:text-yellow-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      Pending Bookings
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {statistics.pendingBookings}
                    </p>
                  </div>
                </div>
              </div>
              {/* Revenue (30d) */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6 flex items-center">
                  <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-emerald-600 dark:text-emerald-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      Revenue (30d)
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${statistics.totalRevenue}
                    </p>
                  </div>
                </div>
              </div>
              {/* Active Disputes */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6 flex items-center">
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-600 dark:text-red-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                      Active Disputes
                    </h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {disputes.filter((d) => d.status === "pending").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab("users")}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Manage Users
                    </button>
                    <button
                      onClick={() => setActiveTab("rides")}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View All Rides
                    </button>
                    <button
                      onClick={() => setActiveTab("notifications")}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Send Notification
                    </button>
                  </div>
                </div>
              </div>

              {/* User Distribution Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden md:col-span-2">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                    User Distribution
                  </h3>
                  <div className="flex items-center justify-center space-x-12">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        {users.filter((user) => user.role === "driver").length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Drivers
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                        {
                          users.filter((user) => user.role === "passenger")
                            .length
                        }
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Passengers
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Summary */}
            {renderAnalyticsSummary()}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Search Users
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Filter by Role
                    </label>
                    <select
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Users</option>
                      <option value="driver">Drivers</option>
                      <option value="passenger">Passengers</option>
                      <option value="admin">Admins</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 dark:text-indigo-300 font-medium">
                                  {user.fullName?.charAt(0) ||
                                    user.email?.charAt(0) ||
                                    "U"}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.fullName || "No Name"}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : user.role === "driver"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }`}
                            >
                              {user.role || "passenger"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span
                                className={`h-2.5 w-2.5 rounded-full mr-2 
                        ${
                          user.blocked
                            ? "bg-red-500"
                            : user.verified
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                              ></span>
                              {user.blocked
                                ? "Blocked"
                                : user.verified
                                ? "Verified"
                                : "Pending"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              {!user.verified && (
                                <button
                                  onClick={() => handleVerifyUser(user.id)}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                  Verify
                                </button>
                              )}
                              {user.blocked ? (
                                <button
                                  onClick={() => handleUnblockUser(user.id)}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  Unblock
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBlockUser(user.id)}
                                  className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                                >
                                  Block
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                        >
                          No users found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Rides Tab */}
        {activeTab === "rides" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date Range
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Filter by City
                    </label>
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Cities</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Rides List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Route
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Driver
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Bookings
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredRides.length > 0 ? (
                      filteredRides.map((ride) => {
                        const rideBookings = bookings.filter(
                          (b) => b.rideId === ride.id
                        );
                        return (
                          <tr key={ride.id}>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-white font-medium">
                                {ride.origin} to {ride.destination}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {ride.distance || "N/A"} km
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {ride.driverName || ride.driverEmail}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {formatDate(ride.date)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {ride.time || "Flexible"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                ${parseFloat(ride.price).toFixed(2) || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {rideBookings.length} bookings
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {
                                  rideBookings.filter(
                                    (b) => b.status === "Pending"
                                  ).length
                                }{" "}
                                pending
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                        >
                          No rides found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === "locations" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                  Manage Cities
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Add or remove cities available for ride selection. Cities that
                  are used in active rides cannot be removed.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Add City */}
                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Add New City
                    </h4>
                    <div className="flex">
                      <input
                        type="text"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder="Enter city name"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={handleAddCity}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Remove City */}
                  <div className="border dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Remove City
                    </h4>
                    <div className="flex">
                      <select
                        value={cityToRemove}
                        onChange={(e) => setCityToRemove(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select city to remove</option>
                        {cities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleRemoveCity}
                        className="px-4 py-2 bg-red-600 text-white rounded-r-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cities List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                  Available Cities ({cities.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {cities.map((city) => (
                    <div
                      key={city}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-center"
                    >
                      {city}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                  Send Platform Notification
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Send notifications to all users or specific user groups. These
                  will appear in their notification panel.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notification Title
                    </label>
                    <input
                      type="text"
                      value={notification.title}
                      onChange={(e) =>
                        setNotification({
                          ...notification,
                          title: e.target.value,
                        })
                      }
                      placeholder="Enter notification title"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notification Message
                    </label>
                    <textarea
                      value={notification.message}
                      onChange={(e) =>
                        setNotification({
                          ...notification,
                          message: e.target.value,
                        })
                      }
                      placeholder="Enter your message"
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Recipients
                    </label>
                    <select
                      value={notification.recipients}
                      onChange={(e) =>
                        setNotification({
                          ...notification,
                          recipients: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Users</option>
                      <option value="driver">Drivers Only</option>
                      <option value="passenger">Passengers Only</option>
                    </select>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleSendNotification}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Send Notification
                    </button>
                  </div>

                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <p>This will send a notification to approximately:</p>
                    <p className="font-medium mt-1">
                      {notification.recipients === "all"
                        ? users.length
                        : notification.recipients === "driver"
                        ? users.filter((u) => u.role === "driver").length
                        : users.filter((u) => u.role === "passenger")
                            .length}{" "}
                      users
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Template (for future use) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                  Email Notifications{" "}
                  <span className="text-sm text-gray-500">(Coming Soon)</span>
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  In a future update, you&apos;ll be able to send email
                  notifications to users from this panel.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trust & Safety Tab */}
        {activeTab === "trust" && (
          <div className="space-y-6">
            {/* Dispute Management */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                  Dispute Management
                </h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Dispute
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {disputes.length > 0 ? (
                        disputes.map((dispute) => (
                          <tr key={dispute.id}>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {dispute.reason}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>Passenger: {dispute.passengerEmail}</span>
                                <span className="mx-2">•</span>
                                <span>Driver: {dispute.driverEmail}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${
                                  dispute.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                }`}
                              >
                                {dispute.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(dispute.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {dispute.status === "pending" ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      handleResolveDispute(
                                        dispute.id,
                                        "driver_favor"
                                      )
                                    }
                                    className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  >
                                    Resolve for Driver
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleResolveDispute(
                                        dispute.id,
                                        "passenger_favor"
                                      )
                                    }
                                    className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  >
                                    Resolve for Passenger
                                  </button>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Resolved: {dispute.resolution || "N/A"}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                          >
                            No disputes to show.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Reported Users */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                  Trust & Safety Metrics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dispute Rate
                    </h4>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {disputes.length > 0 && bookings.length > 0
                        ? ((disputes.length / bookings.length) * 100).toFixed(
                            1
                          ) + "%"
                        : "0%"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      of total bookings
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Resolution Time
                    </h4>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      24 hrs
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      average response time
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                      User Trust Score
                    </h4>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      95%
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      platform average
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                  Platform Settings
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Commission Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Commission Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={platformSettings.commissionRate}
                        onChange={(e) =>
                          setPlatformSettings({
                            ...platformSettings,
                            commissionRate: Math.min(
                              100,
                              Math.max(0, parseInt(e.target.value) || 0)
                            ),
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Percentage of each ride fare that goes to the platform.
                      </p>
                    </div>

                    {/* Minimum Ride Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Minimum Ride Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={platformSettings.minRidePrice}
                        onChange={(e) =>
                          setPlatformSettings({
                            ...platformSettings,
                            minRidePrice: Math.max(
                              0,
                              parseInt(e.target.value) || 0
                            ),
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        The minimum price a driver can set for a ride.
                      </p>
                    </div>

                    {/* Max Active Rides */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Active Rides Per Driver
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={platformSettings.maxActiveRides}
                        onChange={(e) =>
                          setPlatformSettings({
                            ...platformSettings,
                            maxActiveRides: Math.max(
                              1,
                              parseInt(e.target.value) || 1
                            ),
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Maximum number of active rides a driver can have at
                        once.
                      </p>
                    </div>

                    {/* Verification Required */}
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={platformSettings.verificationRequired}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              verificationRequired: e.target.checked,
                            })
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Require account verification before offering rides
                        </span>
                      </label>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-6">
                        When enabled, drivers must be verified by an admin
                        before they can offer rides.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Platform Information
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Platform Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Platform Name
                        </label>
                        <input
                          type="text"
                          value={platformSettings.platformName}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              platformName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      {/* Support Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Support Email
                        </label>
                        <input
                          type="email"
                          value={platformSettings.supportEmail}
                          onChange={(e) =>
                            setPlatformSettings({
                              ...platformSettings,
                              supportEmail: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TODO: Render other tabs (users, rides, locations, notifications, trust, settings) as needed */}
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={modalMessage}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmAction}
        message="Are you sure you want to proceed?"
      />
    </div>
  );
};

export default AdminDashboard;
