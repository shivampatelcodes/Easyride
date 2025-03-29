/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import SearchableDropdown from "../components/SearchableDropdown";

const auth = getAuth(app);
const db = getFirestore(app);

const DriverDashboard = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [tripDetails, setTripDetails] = useState({
    origin: "",
    destination: "",
    date: "",
    seats: "",
    price: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const navigate = useNavigate();

  // Fetch user data and cities
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEmail(userData.email);
          setRole(userData.role);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
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
        console.error("Error fetching Canadian cities:", error);
      }
    };
    fetchCities();
  }, []);

  const handlePostTrip = async () => {
    const { origin, destination, date, seats, price } = tripDetails;
    if (!origin || !destination || !date || !seats || !price) {
      setModalMessage("Please fill out all fields before posting the trip.");
      setIsModalOpen(true);
      return;
    }
    try {
      await addDoc(collection(db, "rides"), {
        ...tripDetails,
        date: Timestamp.fromDate(new Date(date)),
        driverId: auth.currentUser.uid,
        driverEmail: auth.currentUser.email,
        status: "available",
      });
      setModalMessage("Trip posted successfully!");
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error posting trip: ", error);
      setModalMessage("Error posting trip. Please try again.");
      setIsModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  const userName = email.split("@")[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <Navbar role={role} setRole={setRole} />

      {/* Hero Section - updated z-index */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"
            className="w-full h-full object-cover"
            alt="Road trip background"
          />
        </div>
        <div className="container mx-auto px-6 py-12 relative z-10">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {userName}!</h1>
          <p className="text-xl opacity-90">
            Ready to hit the road? Post your next trip below.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Section */}
          <div className="col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  Driver Dashboard
                </h2>

                <div className="space-y-6">
                  {/* Profile Summary */}
                  <div className="flex items-center">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Account Type
                      </p>
                      <p className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                        {role} Account
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center">
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
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
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Email
                      </p>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {email}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => navigate("/manage-bookings")}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Manage Bookings
                      </button>
                      <button
                        onClick={() => navigate("/profile")}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Edit Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Post Trip Form */}
          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2"
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
                  Post a New Trip
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <SearchableDropdown
                      label="Origin City"
                      options={cities}
                      value={tripDetails.origin}
                      onChange={(selected) =>
                        setTripDetails({ ...tripDetails, origin: selected })
                      }
                      placeholder="Where are you starting from?"
                    />
                  </div>
                  <div>
                    <SearchableDropdown
                      label="Destination City"
                      options={cities}
                      value={tripDetails.destination}
                      onChange={(selected) =>
                        setTripDetails({
                          ...tripDetails,
                          destination: selected,
                        })
                      }
                      placeholder="Where are you going?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Trip Date
                    </label>
                    <input
                      type="date"
                      value={tripDetails.date}
                      onChange={(e) =>
                        setTripDetails({ ...tripDetails, date: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Available Seats
                    </label>
                    <input
                      type="number"
                      placeholder="How many passengers can you take?"
                      value={tripDetails.seats}
                      onChange={(e) =>
                        setTripDetails({
                          ...tripDetails,
                          seats: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Trip Price
                    </label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400">
                          $
                        </span>
                      </div>
                      <input
                        type="number"
                        placeholder="Set your price per seat"
                        value={tripDetails.price}
                        onChange={(e) =>
                          setTripDetails({
                            ...tripDetails,
                            price: e.target.value,
                          })
                        }
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={handlePostTrip}
                    className="w-full px-6 py-3 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transform transition hover:-translate-y-0.5"
                  >
                    Post Trip
                  </button>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 text-yellow-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Tips for Drivers
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>
                      Set a reasonable price to attract more passengers.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>
                      Respond promptly to booking requests for higher acceptance
                      rates.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>
                      Keep your vehicle clean and ensure a comfortable ride for
                      passengers.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default DriverDashboard;
