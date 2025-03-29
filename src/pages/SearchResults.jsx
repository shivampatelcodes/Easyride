/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  getDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../firebaseConfig";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";

const db = getFirestore(app);
const auth = getAuth(app);

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { origin, destination, date } = location.state || {};
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!origin || !destination || !date) {
      console.error("Missing search parameters");
      setLoading(false);
      return;
    }

    const fetchRides = async () => {
      try {
        const q = query(
          collection(db, "rides"),
          where("origin", "==", origin),
          where("destination", "==", destination),
          where("date", "==", Timestamp.fromDate(new Date(date)))
        );
        const querySnapshot = await getDocs(q);
        const ridesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRides(ridesData);
      } catch (error) {
        console.error("Error fetching rides:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
          // Extract username from email for personalization
          setUserName(user.email.split("@")[0]);
        }
      }
    };

    fetchRides();
    fetchUserRole();
  }, [origin, destination, date]);

  const handleBookRide = async (ride) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setModalMessage("Please sign in to book a ride.");
        setModalOpen(true);
        return;
      }

      if (user.uid === ride.driverId) {
        setModalMessage("You cannot book your own ride.");
        setModalOpen(true);
        return;
      }

      await addDoc(collection(db, "bookings"), {
        rideId: ride.id,
        passengerId: user.uid,
        passengerEmail: user.email,
        driverId: ride.driverId,
        driverEmail: ride.driverEmail,
        origin: ride.origin,
        destination: ride.destination,
        date: ride.date,
        status: "Pending",
        createdAt: Timestamp.now(),
      });

      setModalMessage(
        "Your ride request has been sent successfully! You can track its status in your bookings."
      );
      setModalOpen(true);
    } catch (error) {
      console.error("Error booking ride:", error);
      setModalMessage(
        "There was an error booking your ride. Please try again."
      );
      setModalOpen(true);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <Navbar role={role} setRole={setRole} />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"
            className="w-full h-full object-cover"
            alt="Search results background"
          />
        </div>
        <div className="container mx-auto px-6 py-10 relative z-10">
          <h1 className="text-4xl font-bold mb-2">Available Rides</h1>
          <p className="text-xl opacity-90">
            {origin} to {destination} on {new Date(date).toLocaleDateString()}
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Search Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Your Search
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500 mt-0.5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Origin
                  </p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">
                    {origin}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500 mt-0.5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Destination
                  </p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">
                    {destination}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500 mt-0.5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Date
                  </p>
                  <p className="text-gray-800 dark:text-gray-200 font-medium">
                    {new Date(date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-750 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {rides.length} {rides.length === 1 ? "ride" : "rides"} found
                </span>
              </div>
              <button
                onClick={() => navigate("/search")}
                className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                Modify Search
              </button>
            </div>
          </div>
        </div>

        {/* Rides Grid */}
        {rides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rides.map((ride) => (
              <div
                key={ride.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3">
                  <h3 className="text-white font-semibold flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H11a1 1 0 001-1v-5h2v5a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H17a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                    </svg>
                    Available Ride
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    {/* Route */}
                    <div className="flex items-center">
                      <div className="flex flex-col items-center mr-4">
                        <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                        <span className="h-12 w-0.5 bg-gray-300 dark:bg-gray-600 my-1"></span>
                        <span className="h-3 w-3 rounded-full bg-indigo-600"></span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {ride.origin}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 mb-1">
                          to
                        </p>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {ride.destination}
                        </p>
                      </div>
                    </div>

                    {/* Driver Info */}
                    <div className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 mt-0.5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Driver
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                          {ride.driverName || ride.driverEmail}
                        </p>
                      </div>
                    </div>

                    {/* Date Info */}
                    <div className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 mt-0.5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Date
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                          {formatDate(ride.date)}
                        </p>
                      </div>
                    </div>

                    {/* Mobile Info */}
                    <div className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 mt-0.5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Mobile
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                          {ride.driverMobile || "Not Provided"}
                        </p>
                      </div>
                    </div>

                    {/* Seats Info */}
                    <div className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 mt-0.5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Seats Available
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                          {ride.seats || 1}
                        </p>
                      </div>
                    </div>

                    {/* Price Info - Always display price or fallback */}
                    <div className="flex items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 mt-0.5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Price
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                          {ride.price ? `$${ride.price}` : "Not Provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Book button */}
                  <button
                    onClick={() => handleBookRide(ride)}
                    className="w-full flex justify-center items-center px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transform transition hover:-translate-y-0.5"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                      <path
                        fillRule="evenodd"
                        d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Book This Ride
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
              No rides found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              No rides are available for your selected route and date.
            </p>
            <button
              onClick={() => navigate("/search")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Try Another Search
            </button>
          </div>
        )}
      </main>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default SearchResults;
