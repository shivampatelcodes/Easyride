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
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
          // Extract username from email for welcome message
          setUserName(user.email.split("@")[0]);
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
              booking.origin = rideDoc.data().origin;
              booking.destination = rideDoc.data().destination;
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <Navbar role={role} setRole={setRole} />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"
            className="w-full h-full object-cover"
            alt="Bookings background"
          />
        </div>
        <div className="container mx-auto px-6 py-12 relative z-10">
          <h1 className="text-4xl font-bold mb-2">Manage Your Bookings</h1>
          <p className="text-xl opacity-90">
            Review and respond to passenger requests for your trips.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Filter Bookings
            </h2>
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-full md:w-auto">
                <label
                  htmlFor="filterDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Select Date
                </label>
                <input
                  type="date"
                  id="filterDate"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredBookings.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
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
                    Booking Request
                  </h3>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <div className="space-y-3">
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
                          Passenger
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                          {booking.passengerEmail}
                        </p>
                      </div>
                    </div>

                    {booking.origin && booking.destination && (
                      <div className="flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400 mt-0.5 mr-2"
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
                            Route
                          </p>
                          <p className="text-gray-800 dark:text-gray-200">
                            {booking.origin} → {booking.destination}
                          </p>
                        </div>
                      </div>
                    )}

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
                          {booking.date && booking.date.toDate
                            ? booking.date.toDate().toLocaleDateString()
                            : booking.date && booking.date.seconds
                            ? new Date(
                                booking.date.seconds * 1000
                              ).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {booking.rideId && (
                      <div className="flex items-start">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400 mt-0.5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Ride ID
                          </p>
                          <p className="text-gray-800 dark:text-gray-200">
                            {booking.rideId}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {booking.status !== "Accepted" && (
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAcceptBooking(booking.id)}
                        className="flex justify-center items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm transform transition hover:-translate-y-0.5"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectBooking(booking.id)}
                        className="flex justify-center items-center px-4 py-2 bg-white border border-red-500 text-red-500 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm dark:bg-gray-700 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Reject
                      </button>
                    </div>
                  )}
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You don&apos;t have any{" "}
              {filterDate ? "bookings on this date" : "pending bookings"} right
              now.
            </p>
          </div>
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
