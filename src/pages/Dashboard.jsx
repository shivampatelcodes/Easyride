/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
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
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const auth = getAuth(app);
const db = getFirestore(app);

const Dashboard = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    origin: "",
    destination: "",
    date: "",
  });
  const [tripDetails, setTripDetails] = useState({
    origin: "",
    destination: "",
    date: "",
    seats: "",
  });
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
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

    fetchUserData();
  }, []);

  const handleSearch = () => {
    navigate("/search-results", { state: searchParams });
  };

  const handlePostTrip = async () => {
    try {
      await addDoc(collection(db, "trips"), {
        ...tripDetails,
        driverId: auth.currentUser.uid,
        driverEmail: email,
      });
      alert("Trip posted successfully!");
    } catch (error) {
      console.error("Error posting trip:", error);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, { status: "Accepted" });
      alert("Booking accepted!");
    } catch (error) {
      console.error("Error accepting booking:", error);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, { status: "Rejected" });
      alert("Booking rejected!");
    } catch (error) {
      console.error("Error rejecting booking:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const q = query(
        collection(db, "bookings"),
        where("driverId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const bookingsData = querySnapshot.docs.map((doc) => doc.data());
      setBookings(bookingsData);
      navigate("/bookings", { state: { bookings: bookingsData } });
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

            {/* Search & Book Rides */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Search & Book Rides
              </h3>
              <div className="mt-4 space-y-4">
                <input
                  type="text"
                  placeholder="Origin"
                  value={searchParams.origin}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, origin: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder="Destination"
                  value={searchParams.destination}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      destination: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <input
                  type="date"
                  value={searchParams.date}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <button
                  onClick={handleSearch}
                  className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Search Rides
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
