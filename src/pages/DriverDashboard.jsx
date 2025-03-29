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
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import SearchableDropdown from "../components/SearchableDropdown"; // Import SearchableDropdown

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

  // Fetch the current user data.
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEmail(userData.email);
          setRole(userData.role);
          console.log("User role from Firestore:", userData.role);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Dynamically fetch list of Canadian cities from external API
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
          // Sort the list alphabetically
          setCities(data.data.sort());
        }
      } catch (error) {
        console.error("Error fetching Canadian cities:", error);
      }
    };

    fetchCities();
  }, []);

  // Function to post a trip.
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

  // Function to notify the driver when a passenger requests a ride.
  // Trigger this from your passenger ride request flow.
  const notifyRiderOnRideRequest = async (rideRequestData) => {
    try {
      await addDoc(collection(db, "notifications"), {
        recipient: rideRequestData.riderId, // driver id
        title: "New Ride Request",
        text: `A passenger has requested your ride from ${rideRequestData.origin} to ${rideRequestData.destination}.`,
        link: `/ride-requests/${rideRequestData.rideId}`, // adjust route as needed
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error notifying rider:", error);
    }
  };

  // Function to notify the passenger when the driver accepts the ride request.
  // Trigger this from your ride acceptance flow.
  const notifyPassengerOnRideAccept = async (rideAcceptData) => {
    try {
      await addDoc(collection(db, "notifications"), {
        recipient: rideAcceptData.passengerId,
        title: "Ride Request Accepted",
        text: `Your request for ride ${rideAcceptData.rideId} was accepted by the driver!`,
        link: `/ride-details/${rideAcceptData.rideId}`, // adjust route as needed
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error notifying passenger:", error);
    }
  };

  // Simulation functions and buttons have been removed.
  // Integrate notifyRiderOnRideRequest and notifyPassengerOnRideAccept
  // into your real ride request and acceptance flows in the PassengerDashboard
  // or ManageBookingsPage as needed.

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        Loading...
      </div>
    );
  }

  const userName = email.split("@")[0];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
      <Navbar role={role} setRole={setRole} />
      <main>
        <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-6 bg-white dark:bg-gray-800 shadow sm:rounded-lg sm:px-10">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Welcome, {userName}!
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              You are logged in as a <span className="font-bold">{role}</span>.
            </p>
            {/* Post Trips Section */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Post Trips
              </h3>
              <div className="mt-4 space-y-4">
                <SearchableDropdown
                  label="Origin"
                  options={cities}
                  value={tripDetails.origin}
                  onChange={(selected) =>
                    setTripDetails({ ...tripDetails, origin: selected })
                  }
                  placeholder="Select origin"
                />
                <SearchableDropdown
                  label="Destination"
                  options={cities}
                  value={tripDetails.destination}
                  onChange={(selected) =>
                    setTripDetails({
                      ...tripDetails,
                      destination: selected,
                    })
                  }
                  placeholder="Select destination"
                />
                <input
                  type="date"
                  value={tripDetails.date}
                  onChange={(e) =>
                    setTripDetails({ ...tripDetails, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
                <input
                  type="number"
                  placeholder="Available Seats"
                  value={tripDetails.seats}
                  onChange={(e) =>
                    setTripDetails({ ...tripDetails, seats: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={tripDetails.price}
                  onChange={(e) =>
                    setTripDetails({ ...tripDetails, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
                <button
                  onClick={handlePostTrip}
                  className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Post Trip
                </button>
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
