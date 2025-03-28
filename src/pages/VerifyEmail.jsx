/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { getAuth, sendEmailVerification, signOut } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";

const VerifyEmail = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [loadingVerification, setLoadingVerification] = useState(false);

  const handleResendVerification = async () => {
    try {
      if (!user) {
        setModalMessage("No user found. Please sign in again.");
        setIsModalOpen(true);
        return;
      }
      await sendEmailVerification(user);
      setModalMessage(
        "Verification email resent. Please check your inbox (and spam folder)."
      );
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error resending email verification:", error);
      setModalMessage(`Error resending verification email: ${error.message}`);
      setIsModalOpen(true);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/signin");
  };

  const handleVerifiedClick = async () => {
    setLoadingVerification(true);
    try {
      // Reload the user to get updated verification status.
      await user.reload();
      const refreshedUser = auth.currentUser;
      if (refreshedUser && refreshedUser.emailVerified) {
        // Email is verified. Sign out and navigate to sign in.
        await signOut(auth);
        navigate("/signin", {
          state: {
            message:
              "Email verified. Please sign in using your verified account.",
          },
        });
      } else {
        // Email not yet verified.
        setModalMessage(
          "Email not verified yet. Please check your inbox and click the verification link."
        );
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setModalMessage("Error checking verification status. Please try again.");
      setIsModalOpen(true);
    }
    setLoadingVerification(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar role={user?.role || ""} setRole={() => {}} />
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Verify Your Email
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          A verification email has been sent to <strong>{user?.email}</strong>.
          Please check your inbox (and spam folder) and click the verification
          link. Once you have verified, click the button below. You will then be
          prompted to sign in again.
        </p>
        <div className="space-x-4">
          <button
            onClick={handleResendVerification}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Resend Verification Email
          </button>
          <button
            onClick={handleVerifiedClick}
            disabled={loadingVerification}
            className={`px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 ${
              loadingVerification ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loadingVerification ? "Checking..." : "I Have Verified My Email"}
          </button>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Sign Out
          </button>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default VerifyEmail;
