import  { useEffect, useState } from "react";
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
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar role={role} setRole={setRole} />
      <main>
        <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 py-6 bg-white shadow sm:rounded-lg sm:px-10">
            <h2 className="text-2xl font-semibold text-gray-800">
              My Bookings
            </h2>
            <div className="mt-4">
              <label
                htmlFor="filterDate"
                className="block text-sm font-medium text-gray-700"
              >
                Filter by Date
              </label>
              <input
                type="date"
                id="filterDate"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="mt-4 space-y-4">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 bg-gray-100 rounded-md shadow-sm"
                  >
                    <p>
                      <strong>Driver Email:</strong> {booking.driverEmail}
                    </p>
                    {booking.rideId && (
                      <p>
                        <strong>Ride ID:</strong> {booking.rideId}
                      </p>
                    )}
                    <p>
                      <strong>Date:</strong>{" "}
                      {booking.date && booking.date.toDate
                        ? booking.date.toDate().toLocaleDateString()
                        : booking.date && booking.date.seconds
                        ? new Date(
                            booking.date.seconds * 1000
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Status:</strong> {booking.status}
                    </p>
                    {booking.status === "Pending" && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="px-4 py-2 mt-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No bookings found.</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancelBooking}
        message="Are you sure you want to cancel this booking?"
      />
      <Modal
        isOpen={isMsgModalOpen}
        onClose={() => setIsMsgModalOpen(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default PassengerBookingsPage;
