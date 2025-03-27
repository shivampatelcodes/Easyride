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
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";

const auth = getAuth(app);
const db = getFirestore(app);

const DriverDashboard = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  // Updated state: removed driverName and driverMobile; added price field.
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

  // Fetch the current user data, including email and role.
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
        // (Optional) Driver bookings retrieval code can remain here if needed.
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Function to post a trip. It creates a ride document and then (optionally) a booking.
  const handlePostTrip = async () => {
    const { origin, destination, date, seats, price } = tripDetails;
    if (!origin || !destination || !date || !seats || !price) {
      setModalMessage("Please fill out all fields before posting the trip.");
      setIsModalOpen(true);
      return;
    }

    try {
      const rideDocRef = await addDoc(collection(db, "rides"), {
        ...tripDetails,
        date: Timestamp.fromDate(new Date(date)),
        driverId: auth.currentUser.uid,
        driverEmail: auth.currentUser.email,
        status: "available",
      });
      // Optionally, create a booking document.
      await addDoc(collection(db, "bookings"), {
        date: Timestamp.fromDate(new Date(date)),
        // Additional booking fields can be added.
      });
      setModalMessage("Trip posted successfully!");
      setIsModalOpen(true);

      // Notify all passengers about the new ride.
      notifyPassengers({
        origin,
        destination,
        rideId: rideDocRef.id,
      });
    } catch (error) {
      console.error("Error posting trip: ", error);
      setModalMessage("Error posting trip. Please try again.");
      setIsModalOpen(true);
    }
  };

  // Function to notify all passengers by creating a notification for each.
  // Each notification includes a title with a serial number.
  const notifyPassengers = async (rideData) => {
    try {
      const passengersQuery = query(
        collection(db, "users"),
        where("role", "==", "passenger")
      );
      const querySnapshot = await getDocs(passengersQuery);
      querySnapshot.forEach(async (userDoc, index) => {
        await addDoc(collection(db, "notifications"), {
          recipient: userDoc.id,
          title: `Notification #${index + 1}`,
          text: `New ride from ${rideData.origin} to ${rideData.destination} has been posted!`,
          link: "/search-results",
          timestamp: Timestamp.now(),
        });
      });
    } catch (error) {
      console.error("Error notifying passengers:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        Loading...
      </div>
    );
  }

  // Display a welcome message using the part of the email before the "@"
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
                <input
                  type="text"
                  placeholder="Origin"
                  value={tripDetails.origin}
                  onChange={(e) =>
                    setTripDetails({ ...tripDetails, origin: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
                <input
                  type="text"
                  placeholder="Destination"
                  value={tripDetails.destination}
                  onChange={(e) =>
                    setTripDetails({
                      ...tripDetails,
                      destination: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
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
