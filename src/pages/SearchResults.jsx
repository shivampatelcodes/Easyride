/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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

const db = getFirestore(app);
const auth = getAuth(app);

const SearchResults = () => {
  const location = useLocation();
  const { origin, destination, date } = location.state || {};
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!origin || !destination || !date) {
      console.error("Missing search parameters");
      setLoading(false);
      return;
    }

    const fetchRides = async () => {
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
      setLoading(false);
    };

    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
      }
    };

    fetchRides();
    fetchUserRole();
  }, [origin, destination, date]);

  const handleBookRide = async (rideId, driverId) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, "bookings"), {
          rideId,
          passengerId: user.uid,
          passengerEmail: user.email,
          driverId: driverId,
          status: "Pending",
        });
        alert("Ride booked successfully!");
      }
    } catch (error) {
      console.error("Error booking ride:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-gray-100">
      <Navbar role={role} setRole={setRole} />
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Search Results
          </h1>
        </div>
      </header>
      <main>
        <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-6 bg-white dark:bg-gray-800 shadow sm:rounded-lg sm:px-10">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Available Rides
            </h2>
            <div className="mt-4 space-y-4">
              {rides.length > 0 ? (
                rides.map((ride, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md shadow-sm"
                  >
                    <p>
                      <strong>Origin:</strong> {ride.origin}
                    </p>
                    <p>
                      <strong>Destination:</strong> {ride.destination}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(ride.date.seconds * 1000).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Driver Name:</strong> {ride.driverName}
                    </p>
                    <p>
                      <strong>Driver Mobile:</strong> {ride.driverMobile}
                    </p>
                    <p>
                      <strong>Seats Available:</strong> {ride.seats}
                    </p>
                    <button
                      onClick={() => handleBookRide(ride.id, ride.driverId)}
                      className="px-4 py-2 mt-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Book Ride
                    </button>
                  </div>
                ))
              ) : (
                <p>No rides found.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchResults;