/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import PropTypes from "prop-types";

const auth = getAuth(app);
const db = getFirestore(app);

const Navbar = ({ role, setRole }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  // Subscribe to notifications from Firestore instead of hardcoding them.
  const [notifications, setNotifications] = useState([]);
  const [hasNew, setHasNew] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

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

  // Listen for real notifications for the current user
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const q = query(
        collection(db, "notifications"),
        where("recipient", "==", user.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notifs);
        setHasNew(notifs.length > 0);
      });
      return () => unsubscribe();
    }
  }, []);

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

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Left side: Logo and Navigation Links */}
        <div className="flex items-center">
          <button
            className="text-gray-500 focus:outline-none lg:hidden"
            onClick={toggleDrawer}
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
          <span className="text-3xl font-bold text-gray-900 ml-4 lg:ml-0 cursor-pointer">
            <Link to="/dashboard">EasyRide</Link>
          </span>
          <nav className="hidden lg:flex items-center ml-8">
            <Link
              to="/dashboard"
              className="mr-4 text-blue-500 hover:underline"
            >
              Home
            </Link>
            {role === "driver" ? (
              <Link
                to="/manage-bookings"
                className="mr-4 text-blue-500 hover:underline"
              >
                Manage Bookings
              </Link>
            ) : (
              <Link
                to="/passenger-bookings"
                className="mr-4 text-blue-500 hover:underline"
              >
                Bookings
              </Link>
            )}
          </nav>
        </div>
        {/* Right side: Notifications and Settings */}
        <div className=" lg:flex items-center space-x-4">
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleToggleNotifications}
              className="relative p-2 text-gray-500 focus:outline-none"
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
              {hasNew && (
                <span className="absolute top-0 right-0 inline-block h-2 w-2 rounded-full bg-red-600"></span>
              )}
            </button>
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md z-20">
                <div className="p-4">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className="cursor-pointer text-gray-800 dark:text-gray-100 text-sm py-1 border-b last:border-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {notif.text}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Settings Icon */}
          <Link
            to="/settings"
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 text-gray-500 hover:text-blue-500"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 14a4 4 0 10-8 0m8 0v1a4 4 0 01-8 0v-1m8 0a4 4 0 11-8 0"
              />
            </svg>
          </Link>
        </div>
      </div>
      {/* Mobile Drawer Menu */}
      {isDrawerOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
          <div className="fixed inset-y-0 left-0 flex max-w-full">
            <div className="w-64 bg-white shadow-xl">
              <div className="px-4 py-6">
                <button
                  className="text-gray-500 focus:outline-none"
                  onClick={toggleDrawer}
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
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
                <nav className="mt-6">
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-blue-500 hover:underline"
                    onClick={toggleDrawer}
                  >
                    Home
                  </Link>
                  {role === "driver" ? (
                    <Link
                      to="/manage-bookings"
                      className="block px-4 py-2 text-blue-500 hover:underline"
                      onClick={toggleDrawer}
                    >
                      Manage Bookings
                    </Link>
                  ) : (
                    <Link
                      to="/passenger-bookings"
                      className="block px-4 py-2 text-blue-500 hover:underline"
                      onClick={toggleDrawer}
                    >
                      Bookings
                    </Link>
                  )}
                  <button
                    className="block w-full text-left px-4 py-2 text-gray-500 hover:underline"
                    onClick={toggleDrawer}
                  >
                    Settings
                  </button>
                </nav>
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
