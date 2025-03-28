/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import Navbar from "../components/Navbar";
import ConfirmationModal from "../components/ConfirmationModal";
import Modal from "../components/Modal";
import { sendRideAcceptedEmail } from "../utils/notifications"; // Import EmailJS helper

const auth = getAuth(app);
const db = getFirestore(app);

const ManageBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
      }
    };

    const bookingsQuery = query(
      collection(db, "bookings"),
      where("driverId", "==", auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(bookingsQuery, async (querySnapshot) => {
      const bookingsData = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const booking = { id: docSnap.id, ...docSnap.data() };
          if (!booking.date && booking.rideId) {
            const rideRef = doc(db, "rides", booking.rideId);
            const rideDoc = await getDoc(rideRef);
            if (rideDoc.exists()) {
              booking.date = rideDoc.data().date;
            }
          }
          return booking;
        })
      );
      setBookings(bookingsData);
      setLoading(false);
    });

    fetchUserRole();
    return () => unsubscribe();
  }, []);

  const handleAcceptBooking = async (bookingId) => {
    try {
      // First, find the booking from local state.
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) {
        console.error("Booking not found for ID:", bookingId);
        return;
      }
      console.log("Using booking from local state:", booking);

      // Verify that passengerEmail is provided in local state.
      if (!booking.passengerEmail || booking.passengerEmail.trim() === "") {
        console.error("Passenger email is missing in booking data:", booking);
        return;
      }

      // Update the status to "Accepted" in Firestore.
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, { status: "Accepted" });
      setModalMessage("Booking accepted!");
      setFeedbackModalOpen(true);

      // Prepare ride accepted data using local booking data.
      const rideAcceptData = {
        passengerEmail: booking.passengerEmail,
        rideId: booking.rideId,
      };

      console.log("Sending ride accepted email with data:", rideAcceptData);
      // Send email notification via EmailJS.
      sendRideAcceptedEmail(rideAcceptData);
    } catch (error) {
      console.error("Error accepting booking:", error);
    }
  };

  const handleRejectBooking = (bookingId) => {
    setSelectedBookingId(bookingId);
    setIsRejectModalOpen(true);
  };

  const confirmRejectBooking = async () => {
    try {
      const bookingRef = doc(db, "bookings", selectedBookingId);
      await deleteDoc(bookingRef);
      setBookings(
        bookings.filter((booking) => booking.id !== selectedBookingId)
      );
      setIsRejectModalOpen(false);
      setModalMessage("Booking rejected and deleted!");
      setFeedbackModalOpen(true);
    } catch (error) {
      console.error("Error rejecting booking:", error);
    }
  };

  const filteredBookings = filterDate
    ? bookings.filter((booking) => {
        let bookingDate = "";
        if (booking.date && booking.date.toDate) {
          bookingDate = booking.date.toDate().toISOString().split("T")[0];
        } else if (booking.date && booking.date.seconds) {
          bookingDate = new Date(booking.date.seconds * 1000)
            .toISOString()
            .split("T")[0];
        }
        return bookingDate === filterDate;
      })
    : bookings;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        Loading.....
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 dark:text-gray-100">
      <Navbar role={role} setRole={setRole} />
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            Manage Bookings
          </h2>
          <div className="mt-4">
            <label
              htmlFor="filterDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Filter by Date
            </label>
            <input
              type="date"
              id="filterDate"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>
      </header>
      <main className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {filteredBookings.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow"
              >
                <p className="mb-1">
                  <span className="font-semibold">Passenger:</span>{" "}
                  {booking.passengerEmail}
                </p>
                {booking.rideId && (
                  <p className="mb-1">
                    <span className="font-semibold">Ride ID:</span>{" "}
                    {booking.rideId}
                  </p>
                )}
                <p className="mb-1">
                  <span className="font-semibold">Date:</span>{" "}
                  {booking.date && booking.date.toDate
                    ? booking.date.toDate().toLocaleDateString()
                    : booking.date && booking.date.seconds
                    ? new Date(booking.date.seconds * 1000).toLocaleDateString()
                    : "N/A"}
                </p>
                <p className="mb-4">
                  <span className="font-semibold">Status:</span>{" "}
                  {booking.status}
                </p>
                {booking.status !== "Accepted" && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptBooking(booking.id)}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectBooking(booking.id)}
                      className="flex-1 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">No bookings found.</p>
        )}
      </main>
      <ConfirmationModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={confirmRejectBooking}
        message="Are you sure you want to reject and delete this booking?"
      />
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default ManageBookingsPage;
