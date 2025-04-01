import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useChat } from "../context/ChatContext";
import { getAuth } from "firebase/auth";
import { app } from "../firebaseConfig";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";

const auth = getAuth(app);
const db = getFirestore(app);

const ChatWindow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeMessages, setActiveChat, sendMessage, chats, loading } =
    useChat();
  const [messageText, setMessageText] = useState("");
  const [chatData, setChatData] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;

  // Set active chat when component mounts
  useEffect(() => {
    setActiveChat(id);
    return () => setActiveChat(null);
  }, [id, setActiveChat]);

  // Get chat data directly if not in context
  useEffect(() => {
    const fetchChatData = async () => {
      if (!loading && chats.length > 0) {
        const foundChat = chats.find((chat) => chat.id === id);
        if (foundChat) {
          setChatData(foundChat);
          setLocalLoading(false);
          return;
        }
      }

      // If not found in context, try to get directly from Firestore
      try {
        const chatDoc = await getDoc(doc(db, "chats", id));
        if (chatDoc.exists()) {
          setChatData({ id: chatDoc.id, ...chatDoc.data() });
        } else {
          console.error("Chat not found in Firestore");
          // Wait 2 seconds to see if it appears, otherwise redirect
          setTimeout(() => {
            if (!chats.find((chat) => chat.id === id)) {
              navigate("/chats");
            }
          }, 2000);
        }
      } catch (error) {
        console.error("Error fetching chat:", error);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchChatData();
  }, [id, chats, loading, navigate]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    console.log(`Active messages updated: ${activeMessages.length} messages`);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // Update the handleSendMessage function
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      console.log(`Attempting to send message in chat ${id}: ${messageText}`);
      await sendMessage(id, messageText);
      console.log("Message sent successfully");
      setMessageText("");
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  if (loading || localLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
      </div>
    );
  }

  // Use either context data or directly fetched data
  const currentChat = chats.find((chat) => chat.id === id) || chatData;

  if (!currentChat) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Chat not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            We couldn&apos;t find the chat you&apos;re looking for. It may have
            been deleted or is still loading.
          </p>
          <Link
            to="/chats"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Back to All Chats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden flex flex-col h-[calc(100vh-150px)]">
          {/* Chat Header */}
          <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 flex items-center border-b border-gray-200 dark:border-gray-600">
            <Link
              to="/chats"
              className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <div>
              <h2 className="font-medium text-gray-800 dark:text-white">
                {currentChat.rideDetails.origin} to{" "}
                {currentChat.rideDetails.destination}
              </h2>
              {currentChat.rideDetails.date && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {typeof currentChat.rideDetails.date === "object" &&
                  currentChat.rideDetails.date.toDate
                    ? format(
                        new Date(currentChat.rideDetails.date.toDate()),
                        "PPP"
                      )
                    : format(new Date(currentChat.rideDetails.date), "PPP")}
                </p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mb-3"
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
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderId === currentUser.uid
                        ? "justify-end"
                        : "justify-start"
                    } mb-4`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                        msg.senderId === "system"
                          ? "bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white mx-auto"
                          : msg.senderId === currentUser.uid
                          ? "bg-purple-600 text-white rounded-br-none"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.senderId === "system"
                            ? "text-gray-500 dark:text-gray-400"
                            : msg.senderId === currentUser.uid
                            ? "text-purple-200"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex items-center"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
