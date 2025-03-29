/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import Navbar from "../components/Navbar";
import ConfirmationModal from "../components/ConfirmationModal";
import Modal from "../components/Modal";

const auth = getAuth(app);
const db = getFirestore(app);

const PassengerBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
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

    const q = query(
      collection(db, "bookings"),
      where("passengerId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const bookingsData = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const booking = { id: docSnap.id, ...docSnap.data() };
          // If the booking doesn't have a date, try to fetch it from the rides collection
          if (!booking.date && booking.rideId) {
            const rideRef = doc(db, "rides", booking.rideId);
            const rideDoc = await getDoc(rideRef);
            if (rideDoc.exists()) {
              booking.date = rideDoc.data().date;
              booking.origin = rideDoc.data().origin;
              booking.destination = rideDoc.data().destination;
              booking.price = rideDoc.data().price;
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

  const handleCancelBooking = (bookingId) => {
    setSelectedBookingId(bookingId);
    setIsCancelModalOpen(true);
  };

  const confirmCancelBooking = async () => {
    try {
      await deleteDoc(doc(db, "bookings", selectedBookingId));
      setBookings(bookings.filter((b) => b.id !== selectedBookingId));
      setModalMessage("Booking cancelled successfully!");
      setIsCancelModalOpen(false);
      setIsMsgModalOpen(true);
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <Navbar role={role} setRole={setRole} />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"
            className="w-full h-full object-cover"
            alt="Bookings background"
          />
        </div>
        <div className="container mx-auto px-6 py-12 relative z-10">
          <h1 className="text-4xl font-bold mb-2">Your Bookings</h1>
          <p className="text-xl opacity-90">
            Manage and track the rides you've booked.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Filter Section */}
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

        {/* Bookings Cards Grid */}
        {filteredBookings.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-3">
                  <h3 className="text-white font-semibold flex items-center">
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
                    Booked Ride
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
                          {booking.driverEmail}
                        </p>
                      </div>
                    </div>

                    {/* Route Info */}
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

                    {/* Price Info */}
                    {booking.price && (
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
                            ${booking.price}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Ride ID */}
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

                  {/* Cancel Button - Only show for Pending bookings */}
                  {booking.status === "Pending" && (
                    <div className="mt-6">
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="w-full flex justify-center items-center px-4 py-2 bg-red-50 border border-red-500 text-red-500 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm dark:bg-red-900/20 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/30"
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
                        Cancel Booking
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You don&apos;t have any{" "}
              {filterDate ? "bookings on this date" : "bookings"} right now.
            </p>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancelBooking}
        message="Are you sure you want to cancel this booking?"
      />

      {/* Feedback Modal */}
      <Modal
        isOpen={isMsgModalOpen}
        onClose={() => setIsMsgModalOpen(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default PassengerBookingsPage;
