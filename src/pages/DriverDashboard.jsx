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
  const [tripDetails, setTripDetails] = useState({
    origin: "",
    destination: "",
    date: "",
    seats: "",
    driverName: "",
    driverMobile: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (user) {
        // Fetch user details
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEmail(userData.email);
          setRole(userData.role);
        }

        // (Optional) Driver bookings retrieval code can remain here for other logic
        const q = query(
          collection(db, "bookings"),
          where("driverId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        // Removed display of bookings below the trip posting section
        // const bookingsData = querySnapshot.docs.map((doc) => ({
        //   id: doc.id,
        //   ...doc.data(),
        // }));
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handlePostTrip = async () => {
    const { origin, destination, date, seats, driverName, driverMobile } =
      tripDetails;
    if (
      !origin ||
      !destination ||
      !date ||
      !seats ||
      !driverName ||
      !driverMobile
    ) {
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
      await addDoc(collection(db, "bookings"), {
        date: Timestamp.fromDate(new Date(date)),
        // the rest of your booking data
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

            {/* Post Trips */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Post Trips
              </h3>
              <div className="mt-4 space-y-4">
                <input
                  type="text"
                  placeholder="Driver Name"
                  value={tripDetails.driverName}
                  onChange={(e) =>
                    setTripDetails({
                      ...tripDetails,
                      driverName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
                <input
                  type="text"
                  placeholder="Driver Mobile"
                  value={tripDetails.driverMobile}
                  onChange={(e) =>
                    setTripDetails({
                      ...tripDetails,
                      driverMobile: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
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
                <button
                  onClick={handlePostTrip}
                  className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Post Trip
                </button>
              </div>
            </div>
            {/* Driver Bookings section removed */}
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
