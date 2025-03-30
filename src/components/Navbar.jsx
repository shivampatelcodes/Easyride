/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import PropTypes from "prop-types";

const auth = getAuth(app);
const db = getFirestore(app);

const Navbar = ({ role, setRole }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasNew, setHasNew] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleToggleNotifications = () => {
    if (!isNotifOpen) {
      setHasNew(false);
    }
    setIsNotifOpen((prev) => !prev);
  };

  const handleNotificationClick = (notif) => {
    setIsNotifOpen(false);
    navigate(notif.link);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
        setHasNew(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotifOpen]);

  // Helper function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Fetch notifications when component mounts
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    console.log("Fetching notifications for user:", user.uid);

    // Create a query against the notifications collection
    const q = query(
      collection(db, "notifications"),
      where("recipient", "==", user.uid)
    );

    // Listen for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifs = [];
      querySnapshot.forEach((doc) => {
        notifs.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log("Notifications fetched:", notifs.length);

      // Sort by time (newest first)
      notifs.sort((a, b) => b.time.seconds - a.time.seconds);
      setNotifications(notifs);

      // Count unread notifications
      setUnreadCount(notifs.filter((n) => n.status === "unread").length);
    });

    return () => unsubscribe();
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        status: "read",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side: Logo and Navigation Links */}
          <div className="flex items-center">
            <button
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none lg:hidden"
              onClick={toggleDrawer}
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                ></path>
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center ml-2 lg:ml-0">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                  EasyRide
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center ml-10 space-x-8">
              <Link
                to="/dashboard"
                className={`flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 border-b-2 ${
                  isActive("/dashboard")
                    ? "border-blue-500 text-gray-900 dark:text-white"
                    : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                Home
              </Link>

              {role === "driver" ? (
                <Link
                  to="/manage-bookings"
                  className={`flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 border-b-2 ${
                    isActive("/manage-bookings")
                      ? "border-blue-500 text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  Manage Bookings
                </Link>
              ) : (
                <Link
                  to="/passenger-bookings"
                  className={`flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 border-b-2 ${
                    isActive("/passenger-bookings")
                      ? "border-blue-500 text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  My Bookings
                </Link>
              )}
            </nav>
          </div>

          {/* Right side: Notifications and Settings */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleToggleNotifications}
                className="relative p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Notifications"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 7.165 6 9.388 6 12v2.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  ></path>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-20 border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium">
                    Notifications
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                              <svg
                                className="h-5 w-5 text-blue-600 dark:text-blue-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {notif.text}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {notif.time && notif.time.seconds
                                  ? new Date(
                                      notif.time.seconds * 1000
                                    ).toLocaleString()
                                  : "Just now"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <Link
              to="/settings"
              className={`p-2 rounded-full ${
                isActive("/settings")
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              aria-label="Settings"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={toggleDrawer}
            aria-hidden="true"
          ></div>

          <div className="fixed inset-y-0 left-0 flex max-w-full">
            <div className="relative w-screen max-w-xs bg-white dark:bg-gray-800 shadow-xl">
              <div className="h-full flex flex-col py-5 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
                {/* Close button */}
                <div className="px-4 flex items-center justify-between">
                  <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                    EasyRide
                  </div>
                  <button
                    className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                    onClick={toggleDrawer}
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Nav items */}
                <div className="mt-6 px-2 space-y-1">
                  <Link
                    to="/dashboard"
                    className={`group flex items-center px-4 py-3 text-base font-medium rounded-md ${
                      isActive("/dashboard")
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={toggleDrawer}
                  >
                    <svg
                      className="mr-3 h-5 w-5 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Home
                  </Link>

                  {role === "driver" ? (
                    <Link
                      to="/manage-bookings"
                      className={`group flex items-center px-4 py-3 text-base font-medium rounded-md ${
                        isActive("/manage-bookings")
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={toggleDrawer}
                    >
                      <svg
                        className="mr-3 h-5 w-5 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Manage Bookings
                    </Link>
                  ) : (
                    <Link
                      to="/passenger-bookings"
                      className={`group flex items-center px-4 py-3 text-base font-medium rounded-md ${
                        isActive("/passenger-bookings")
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={toggleDrawer}
                    >
                      <svg
                        className="mr-3 h-5 w-5 text-blue-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                        />
                      </svg>
                      My Bookings
                    </Link>
                  )}

                  <Link
                    to="/settings"
                    className={`group flex items-center px-4 py-3 text-base font-medium rounded-md ${
                      isActive("/settings")
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    onClick={toggleDrawer}
                  >
                    <svg
                      className="mr-3 h-5 w-5 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

Navbar.propTypes = {
  role: PropTypes.string.isRequired,
  setRole: PropTypes.func.isRequired,
};

export default Navbar;
