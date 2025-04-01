import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useChat } from "../../context/ChatContext";

const DriverChatButton = ({ rideId, passengerId, className }) => {
  const { startChat } = useChat();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChatClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setLoading(true);
      const chatId = await startChat(rideId, passengerId);

      if (chatId) {
        // Add a small delay to ensure Firestore has time to update
        setTimeout(() => {
          navigate(`/chats/${chatId}`);
          setLoading(false);
        }, 500);
      } else {
        console.error("Failed to create chat");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleChatClick}
      disabled={loading}
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200 ${
        loading ? "opacity-70 cursor-not-allowed" : ""
      } ${className}`}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
      ) : (
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      )}
      Chat with Passenger
    </button>
  );
};

DriverChatButton.propTypes = {
  rideId: PropTypes.string.isRequired,
  passengerId: PropTypes.string.isRequired,
  className: PropTypes.string,
};

export default DriverChatButton;
