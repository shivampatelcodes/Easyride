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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <Navbar role={user?.role || ""} setRole={() => {}} />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1557200134-90327ee9fafa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80"
            className="w-full h-full object-cover"
            alt="Email verification background"
          />
        </div>
        <div className="container mx-auto px-6 py-10 relative z-10">
          <h1 className="text-3xl font-bold mb-2">Email Verification</h1>
          <p className="text-xl opacity-90">
            Complete your registration by verifying your email address
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-blue-500 mr-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Check Your Inbox
                </h2>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* Steps */}
              <div className="space-y-6 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                      1
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                      Verification Email Sent
                    </h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      A verification email has been sent to{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {user?.email}
                      </span>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                      2
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                      Click the Verification Link
                    </h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      Check your email inbox (and spam folder) and click the
                      verification link in the email.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-medium">
                      3
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                      Complete Verification
                    </h3>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      After clicking the link, return here and click &quot;I Have
                      Verified My Email&quot; to continue.
                    </p>
                  </div>
                </div>
              </div>

              {/* Alert */}
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      You must verify your email before you can access your
                      account. This helps keep your account secure.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                <button
                  onClick={handleResendVerification}
                  className="flex-1 flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Resend Verification Email
                </button>

                <button
                  onClick={handleVerifiedClick}
                  disabled={loadingVerification}
                  className={`flex-1 flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-sm ${
                    loadingVerification ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {loadingVerification ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Checking...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
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
                      I Have Verified My Email
                    </>
                  )}
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
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
