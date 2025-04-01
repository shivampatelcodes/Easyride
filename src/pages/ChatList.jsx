/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";
import { useChat } from "../context/ChatContext";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { app } from "../firebaseConfig";
import Navbar from "../components/Navbar";

const auth = getAuth(app);
const db = getFirestore(app);

const ChatList = () => {
  const { chats, loading } = useChat();
  const [chatUsers, setChatUsers] = useState({});

  // Fetch user details for all participants
  useEffect(() => {
    const fetchUsers = async () => {
      if (chats.length === 0) return;

      const usersToFetch = new Set();
      chats.forEach((chat) => {
        chat.participants.forEach((userId) => {
          if (userId !== auth.currentUser.uid) {
            usersToFetch.add(userId);
          }
        });
      });

      const userDetails = {};

      for (const userId of usersToFetch) {
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            userDetails[userId] = userDoc.data();
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      }

      setChatUsers(userDetails);
    };

    fetchUsers();
  }, [chats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Your Conversations
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 flex items-center">
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
          Chat with drivers and passengers
        </p>

        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-400 mb-4"
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
            <p className="text-gray-600 dark:text-gray-300">
              You don&apos;t have any conversations yet.
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              {auth.currentUser?.role === "driver"
                ? "Passengers will be able to contact you about your rides."
                : 'Start by searching for a ride and clicking on "Chat with Driver"'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => {
              const currentUser = auth.currentUser;
              const otherUserIds = chat.participants.filter(
                (id) => id !== currentUser?.uid
              );
              const hasUnread = chat.lastMessageSenderId !== currentUser?.uid;

              return (
                <Link
                  to={`/chats/${chat.id}`}
                  key={chat.id}
                  className="block bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="p-5 flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {chat.rideDetails?.origin || "Unknown"} to{" "}
                        {chat.rideDetails?.destination || "Unknown"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {chat.lastMessage ? (
                          <>
                            {chat.lastMessageSenderId === currentUser?.uid
                              ? "You: "
                              : ""}
                            {chat.lastMessage}
                          </>
                        ) : (
                          "No messages yet"
                        )}
                      </p>
                      {chat.lastMessageAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(
                            chat.lastMessageAt.seconds * 1000
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {hasUnread && (
                      <span className="flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
